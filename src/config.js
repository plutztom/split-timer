const apiPrefix = '/api';
const apiBase ='https://localhost:5001' + apiPrefix;

const secondsToMillis = (seconds) => {
  return seconds * 1000;
};

const conf = {
  useXHRLogger: false,
  filenameHeader: 'x-suggested-filename',
  defaultErrMessage: 'An error has occurred. Please try again later.',
  defaultRowsPerPage: 20,
  httpRetryInterval: secondsToMillis(3),
  httpRequestTimeout: secondsToMillis(7),
  httpRetryLimit: 5,
  httpRequestTimeoutRetryLimit: 0,
  api: {
    base: apiBase,
    prefix: apiPrefix,
    getRunDefinition: '/Run/GetRunDefintion'
  },
  pathRoot: '/',
  hash: {
    root: '/#',
  },
};

export {conf};
