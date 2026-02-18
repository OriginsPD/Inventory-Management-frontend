import pino from 'pino';

export const logger = pino({
  level: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  browser: {
    asObject: true,
  }
});
