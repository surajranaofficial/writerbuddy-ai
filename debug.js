// debug.js

const DEBUG_MODE = true; // Control debug logging (set to false for production)
const LOG_PREFIX = '[WritterBuddy]';

const Logger = {
  info: (...args) => {
    if (DEBUG_MODE) {
      console.info(LOG_PREFIX, ...args);
    }
  },
  warn: (...args) => {
    if (DEBUG_MODE) {
      console.warn(LOG_PREFIX, ...args);
    }
  },
  error: (...args) => {
    // Always log errors regardless of DEBUG_MODE
    console.error(LOG_PREFIX, ...args);
  },
  debug: (...args) => {
    if (DEBUG_MODE) {
      console.log(LOG_PREFIX, '[DEBUG]', ...args);
    }
  }
};
