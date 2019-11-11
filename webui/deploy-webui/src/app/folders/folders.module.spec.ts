import { FoldersModule } from './folders.module';

describe('FoldersModule', () => {
  let foldersModule: FoldersModule;

  beforeEach(() => {
    foldersModule = new FoldersModule();
  });

  it('should create an instance', () => {
    expect(foldersModule).toBeTruthy();
  });
});
