// frontend/src/lib/logger.ts

export const logger = {
  info: (args: any) => console.log(JSON.stringify(args, null, 2)),
  error: (args: any) => console.error(JSON.stringify(args, null, 2)),
  warn: (args: any) => console.warn(JSON.stringify(args, null, 2)),
  debug: (args: any) => console.debug(JSON.stringify(args, null, 2)),
};
