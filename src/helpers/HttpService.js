
import {conf} from '../config';
import {LoggerService} from './LoggerService';
import {HTTP_ERROR_CODE} from './HttpTypes';
import {catchError, map, retryWhen, switchMap, timeout} from 'rxjs/operators';
import Axios from 'axios-observable';
import StringUtils from './StringUtils';
import {throwError, TimeoutError, timer} from 'rxjs';

const HTTP_RETRY_INTERVAL = conf.httpRetryInterval;
const HTTP_RETRY_LIMIT = conf.httpRetryLimit;
const HTTP_REQUEST_TIMEOUT = conf.httpRequestTimeout;
const HTTP_REQUEST_TIMEOUT_RETRY_LIMIT = conf.httpRequestTimeoutRetryLimit;
const RES_TYPE = 'arraybuffer';

const logger = LoggerService.getLogger('HttpService');

export class HttpService {

  static get(urlPath, requestOptions) {
  return HttpService._request('get', urlPath, requestOptions);
}

static post(urlPath, requestOptions) {
  return HttpService._request('post', urlPath, requestOptions);
}

static put(urlPath, requestOptions) {
  return HttpService._request('put', urlPath, requestOptions);
}

static _request(method, urlPath, requestOptions) {
  requestOptions = requestOptions || (Object.freeze({}));

const {useMockApi, externalUrl, pathParams, queryParams, responseType, data} = requestOptions;
let {httpRetryLimit} = requestOptions;

const mockApiBase = useMockApi ? conf.mockApiBase : '';
const url = externalUrl || HttpUtils.parseUrlWithParams(urlPath, pathParams, mockApiBase);

if ((method === 'put' || method === 'post') && !requestOptions.data) {
  logger.warn(`data should be provided in the requestOptions for ${method} ${url}`);
}

if (method === 'post' && (httpRetryLimit === null || httpRetryLimit === undefined)) {
  httpRetryLimit = 0;
}

const axiosOpts = {
  method,
  url: url,
  data: data || null,
  withCredentials: true,
  responseType: responseType || RES_TYPE,
  params: queryParams || null,
  crossDomain: true
};
return Axios.request(axiosOpts).pipe(
    timeout(requestOptions.httpTimeout || HTTP_REQUEST_TIMEOUT),
    retryWhen((errObs) => {
      return HttpUtils.timedRetryHandler(errObs, httpRetryLimit, url);
    }),
    catchError(HttpUtils.errHandler),
    map(requestOptions.parser || HttpUtils.parseJson)
);
}

}

export class HttpError {
  code;
  message;

  constructor(code, message) {
    this.code = code;
    this.message = message;
  }

  toString() {
    return `HttpError: ${this.code} ${this.message}`;
  }
}

export class HttpUtils {

  static parseJson(res) {
    if (!res || res.data === null || res.data === undefined) {
      return null;
    }

    let responseText = '';
    try {
      responseText = Buffer.from(res.data, 'binary').toString();
    } catch (e) {
      logger.error('Failed reading response body from server, returning null.');
      return null;
    }

    const url = HttpUtils.rebuildReqUrl(res);

    if (responseText === '' || responseText === 'OK') {
      logger.info(`${res.status} ${res.statusText}: ${url}`);
      return null;
    }

    try {
      logger.info(`${res.status} ${res.statusText}: ${url}`);
      return JSON.parse(responseText);
    } catch (e) {
      const resTextObj = {
        responseText: responseText
      };

      logger.warn(`${url}: Server returned text instead of JSON, using: ${JSON.stringify(resTextObj)}`);

      return resTextObj;
    }
  };

  // Axios leaves the query params out of the url, and this method recreates the full url.
  static rebuildReqUrl(res) {
    let url = res.config.url;
    if (res.config.params) {
      const params = res.config.params;
      const paramKeys = Object.keys(params);
      if (paramKeys.length > 0) {
        try {
          // build the query params back in
          url = url + '?' + paramKeys.map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
        } catch (e) {
          logger.warn(`${url}: Failed to rebuild url string`);
        }
      }
    }

    return url;
  }

  static parseUrlWithParams(urlPath, params, apiBase) {
  const base = apiBase || conf.api.base;
  if (!params || Object.keys(params).length === 0) {
  return base + urlPath;
}
const url = base + urlPath;

const colonParams = {};
Object.keys(params).forEach(key => {
  colonParams[':' + key] = params[key];
});

return StringUtils.replaceMap(url, colonParams);
}

static timedRetryHandler(errObs, httpRetryLimit = HTTP_RETRY_LIMIT,
    url) {
  if (httpRetryLimit === null || httpRetryLimit === undefined) {
  httpRetryLimit = conf.httpRetryLimit;
}

let count = 0;
return errObs.pipe(
    switchMap((res) => {

      if (res instanceof TimeoutError && count < HTTP_REQUEST_TIMEOUT_RETRY_LIMIT) {
        logger.debug('Retrying request after timeout to url "' + url + '".', 'Attempt ' + count + '.');

        count += 1;
        return timer(HTTP_RETRY_INTERVAL);
      } else if (count >= httpRetryLimit ||
          res.status === HTTP_ERROR_CODE.BAD_REQUEST ||
          res.status === HTTP_ERROR_CODE.UNAUTHORIZED
      ) {
        return throwError(res);
      } else {
        logger.debug('Retrying request to url "' + url + '".', 'Attempt ' + count + '.');

        count += 1;
        return timer(HTTP_RETRY_INTERVAL);
      }
    })
);
};

static errHandler(res) {
  if (res instanceof TimeoutError) {
  return throwError(new HttpError(408, res.message));
}

let code = 0, message = '';
try {
  code = res.response.status;
  message = res.response.statusText;
} catch (err) {
  logger.error('Error parsing server error message.');
}

const emptyMessage = !message || !message.toLowerCase() ||
    message.toLowerCase().includes('ok');
const systemError = code === HTTP_ERROR_CODE.SYSTEM || !code;

if (emptyMessage || systemError) {
  message = conf.defaultErrMessage;
}

logger.error('Failed request to url', res.config.url + '. Status', code, '. Message', message + '.');

return throwError(new HttpError(code, message));
}
}
