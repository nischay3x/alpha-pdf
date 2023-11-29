import winston, { transports } from "winston";

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
//   defaultMeta: { service: 'user-service' },
  transports: [
    new transports.Console(), // Log to console
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

export default logger;