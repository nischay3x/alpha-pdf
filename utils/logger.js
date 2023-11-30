import winston from "winston";
const { transports } = winston;

const customFormat = winston.format.printf(({ level, timestamp, message }) => {
  return `${level}: ${timestamp}: ${message}`;
});


export const processLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    customFormat
  ),
  transports: [
    new transports.Console(), // Log to console
    new winston.transports.File({ filename: 'process.log' })
  ],
});

export const serverLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    customFormat
  ),
  transports: [
    new transports.Console(), // Log to console
    new winston.transports.File({ filename: 'server.log' }),
  ],
});

const combined = {
  error: (msg) => {
    processLogger.error(msg);
    serverLogger.error(msg);
  },
  info: (msg) => {
    processLogger.info(msg);
    serverLogger.info(msg);
  }
}

export default combined;