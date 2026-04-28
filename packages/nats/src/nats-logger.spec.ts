import { NatsLoggerService } from './services/nats-logger.service';
import { ConsoleNatsLogger } from './interfaces/nats-logger';

describe('ConsoleNatsLogger', () => {
  it('should not log when disabled', () => {
    const logger = new ConsoleNatsLogger(false);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.info('Test message');
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should log when enabled', () => {
    const logger = new ConsoleNatsLogger(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.info('Test message');
    expect(consoleSpy).toHaveBeenCalledWith('[NATS] [INFO] Test message');

    consoleSpy.mockRestore();
  });

  it('should log debug messages', () => {
    const logger = new ConsoleNatsLogger(true);
    const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

    logger.debug('Debug message');
    expect(consoleSpy).toHaveBeenCalledWith('[NATS] [DEBUG] Debug message');

    consoleSpy.mockRestore();
  });

  it('should log warn messages', () => {
    const logger = new ConsoleNatsLogger(true);
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    logger.warn('Warn message');
    expect(consoleSpy).toHaveBeenCalledWith('[NATS] [WARN] Warn message');

    consoleSpy.mockRestore();
  });

  it('should log error messages', () => {
    const logger = new ConsoleNatsLogger(true);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    logger.error('Error message');
    expect(consoleSpy).toHaveBeenCalledWith('[NATS] [ERROR] Error message');

    consoleSpy.mockRestore();
  });
});

describe('NatsLoggerService', () => {
  it('should not log when disabled', () => {
    const logger = new NatsLoggerService(false);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.info('Test message');
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should log when enabled', () => {
    const customLogger = new ConsoleNatsLogger(true);
    const logger = new NatsLoggerService(true, customLogger);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.info('Test message');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should not log if no logger provided and disabled', () => {
    const logger = new NatsLoggerService(false);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.debug('Should not log');
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should setEnabled changes logging state', () => {
    const customLogger = new ConsoleNatsLogger(true);
    const logger = new NatsLoggerService(false, customLogger);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.info('Should not log');
    expect(consoleSpy).not.toHaveBeenCalled();

    logger.setEnabled(true);
    logger.info('Should log now');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should use default no-op logger when none provided and enabled', () => {
    const logger = new NatsLoggerService(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.info('Should not throw');
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should pass through debug with args', () => {
    const customLogger = new ConsoleNatsLogger(true);
    const logger = new NatsLoggerService(true, customLogger);
    const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

    logger.debug('Debug message', { key: 'value' });
    expect(consoleSpy).toHaveBeenCalledWith('[NATS] [DEBUG] Debug message', { key: 'value' });

    consoleSpy.mockRestore();
  });

  it('should pass through info with args', () => {
    const customLogger = new ConsoleNatsLogger(true);
    const logger = new NatsLoggerService(true, customLogger);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.info('Info message', 'arg1', 'arg2');
    expect(consoleSpy).toHaveBeenCalledWith('[NATS] [INFO] Info message', 'arg1', 'arg2');

    consoleSpy.mockRestore();
  });

  it('should pass through warn with args', () => {
    const customLogger = new ConsoleNatsLogger(true);
    const logger = new NatsLoggerService(true, customLogger);
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    logger.warn('Warn message', { error: 'details' });
    expect(consoleSpy).toHaveBeenCalledWith('[NATS] [WARN] Warn message', { error: 'details' });

    consoleSpy.mockRestore();
  });

  it('should pass through error with args', () => {
    const customLogger = new ConsoleNatsLogger(true);
    const logger = new NatsLoggerService(true, customLogger);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    logger.error('Error message', new Error('oops'));
    expect(consoleSpy).toHaveBeenCalledWith('[NATS] [ERROR] Error message', new Error('oops'));

    consoleSpy.mockRestore();
  });

  it('should setEnabled to false', () => {
    const customLogger = new ConsoleNatsLogger(true);
    const logger = new NatsLoggerService(true, customLogger);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.info('Should log');
    expect(consoleSpy).toHaveBeenCalled();

    logger.setEnabled(false);
    logger.info('Should not log');
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});