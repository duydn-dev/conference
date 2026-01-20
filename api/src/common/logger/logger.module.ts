import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');
import { join } from 'path';

const logDir = join(process.cwd(), 'logs');

// Custom format similar to Serilog
const serilogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
    let log = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context) {
      log += ` [${context}]`;
    }
    
    log += ` ${message}`;
    
    // Add metadata if exists
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      const metaStr = metaKeys
        .map(key => `${key}=${JSON.stringify(meta[key])}`)
        .join(' ');
      log += ` ${metaStr}`;
    }
    
    // Add stack trace if exists
    if (trace) {
      log += `\n${trace}`;
    }
    
    return log;
  })
);

// File transport for all logs
const allLogsTransport = new DailyRotateFile({
  filename: join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: serilogFormat,
  level: 'debug',
});

// File transport for errors only
const errorLogsTransport = new DailyRotateFile({
  filename: join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: serilogFormat,
  level: 'error',
});

// Console transport for development
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
      let log = `${timestamp} [${level}]`;
      
      if (context) {
        log += ` [${context}]`;
      }
      
      log += ` ${message}`;
      
      const metaKeys = Object.keys(meta).filter(key => key !== 'timestamp' && key !== 'level' && key !== 'message' && key !== 'context');
      if (metaKeys.length > 0) {
        const metaStr = metaKeys
          .map(key => `${key}=${JSON.stringify(meta[key])}`)
          .join(' ');
        log += ` ${metaStr}`;
      }
      
      return log;
    })
  ),
});

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        allLogsTransport,
        errorLogsTransport,
        ...(process.env.NODE_ENV !== 'production' ? [consoleTransport] : []),
      ],
      // Default meta
      defaultMeta: {
        service: 'conference-api',
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
