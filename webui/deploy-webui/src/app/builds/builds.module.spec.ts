import { BuildsModule } from './builds.module';

describe('FoldersModule', () => {
  let buildsModule: BuildsModule;

  beforeEach(() => {
    buildsModule = new BuildsModule();
  });

  it('should create an instance', () => {
    expect(BuildsModule).toBeTruthy();
  });
});
