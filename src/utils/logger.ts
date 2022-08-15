import winston from "winston";
import dayjs from "dayjs";

// Set up logger with winston
const logger = winston.createLogger({
    level: "info",
    format: winston.format.printf((info) => `${dayjs().format("MMMM D, YYYY h:mm:ss A")} | [${info.level.toUpperCase()}]: ${info.message}`),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.Console(),
        new winston.transports.File({ filename: "./logs/error.log", level: "error" }),
        new winston.transports.File({ filename: "./logs/combined.log" })
    ]
});

export default logger;