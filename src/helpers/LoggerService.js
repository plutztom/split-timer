import {conf} from '../config';
import {LOG_SEVERITY} from './LoggerTypes';
import {LoggerHttpService} from './LoggerHttpService';

const getPrintableDate = () => {
  const d = new Date();
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();

  if (month.length < 2) {
    month = '0' + month;
  }
  if (day.length < 2) {
    day = '0' + day;
  }

  return `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
};

class Logger {
  #name = '';

  constructor(name) {
    this.#name = name;
  }

  error(...messages) {
    return this.issueMessage(messages, LOG_SEVERITY.ERROR);
  }

  info(...messages) {
    return this.issueMessage(messages, LOG_SEVERITY.INFO);
  }

  debug(...messages) {
    return this.issueMessage(messages, LOG_SEVERITY.DEBUG);
  }

  log(...messages) {
    return this.issueMessage(messages, LOG_SEVERITY.DEFAULT);
  }

  warn(...messages) {
    return this.issueMessage(messages, LOG_SEVERITY.WARNING);
  }

  issueMessage(messages, level) {
    try {
      const printableDate = getPrintableDate();
      const log = `${level} ${this.#name} ${printableDate} ${messages.join(' ')}`;

      let jsLogLevel = (level).toLowerCase();
      if (level === LOG_SEVERITY.WARNING) {
        jsLogLevel = 'warn';
      } else if (level === LOG_SEVERITY.DEFAULT) {
        jsLogLevel = 'log';
      }

      if (!conf.isProduction) {
        // Pipe to browser console as well as service.
        console[jsLogLevel](log);
      }

      const logAttributes = {
        logger: this.#name,
        dateTime: printableDate,
        timestamp: Date.now(),
        message: messages.join(' ')
      };

      const logEntry = {
        severity: level,
        payload: JSON.stringify(logAttributes)
      };

      if (conf.useXHRLogger) {
        LoggerHttpService.postLog(logEntry);
      }
    } catch (err) {
      try {
        console.error('LOGGING ERROR: Try debugging the logger service.', err.name, err.message, err.stack);
      } catch (ignored) {
        console.error('LOGGING FAILURE: Check logger service.');
      }
    }
  }
}

export class LoggerService {
  static getLogger(name) {
    return new Logger(name);
  }
}
