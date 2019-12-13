
import {conf} from '../config';

const LOG_URL = conf.api.base + conf.api.writeToLogger;

// Full-native http service for posting logs.
// The normal http service uses logger methods, which would cause an infinite loop.
export class LoggerHttpService {

  static postLog(logEntry) {
    const request = new XMLHttpRequest();

    try {
      request.open('POST', LOG_URL, true);
      request.setRequestHeader('Content-Type', 'application/json');

      request.onload = function () {
        if (request.status < 200 || request.status > 400) {
          console.error('Server rejected log:', LOG_URL, JSON.stringify(logEntry));
        }
      };

      request.onerror = function () {
        console.error('Error posting logs to hardware server.');
      };

      const body = {
        data: {
          type: logEntry.severity,
          description: logEntry.payload,
        }
      };
      request.send(JSON.stringify(body));
    } catch (err) {
      console.error('Something is wrong with the logger.', err.name, err.message, err.stack);
    }
  }
}
