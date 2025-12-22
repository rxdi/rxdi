import { Service, BootstrapLogger } from '@rxdi/core';

@Service()
export class StartService {
  constructor(
    private logger: BootstrapLogger
  ) { }

  startBrowser() {
    this.logger.log('Browser started!');
  }
}
