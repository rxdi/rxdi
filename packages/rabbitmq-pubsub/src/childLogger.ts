
export function createChildLogger(logger: Logger, className: string) {
  return {
    trace: (...message: any[]) => process.env.PUBSUB_LOGGING && console.log(...message),
    error: (...message: any[]) => process.env.PUBSUB_LOGGING && console.error(...message),
    debug: (...message: any[]) => process.env.PUBSUB_LOGGING && console.log(...message),
  };
}


export interface Logger {
  trace: (...m: any[]) => void;
  error: (...m: any[]) => void;
  debug: (...m: any[]) => void;
}