const winston = require('winston');
const moment = require('moment-timezone');
const path = require('path');

// 设置日志文件的路径
const logFilePath = path.join(__dirname, 'logs', 'wecom.log');

// 创建一个logger实例
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => moment().tz("Asia/Shanghai").format('YYYY-MM-DD HH:mm:ss')
    }),
    winston.format.printf(info => {
      return `${info.timestamp} - [${info.level.toUpperCase()}]: ${info.message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: logFilePath })
  ]
});

module.exports = logger;