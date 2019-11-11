import { NamespaceModule } from './namespace.module';

describe('FoldersModule', () => {
  let namespaceModule: NamespaceModule;

  beforeEach(() => {
    namespaceModule = new NamespaceModule();
  });

  it('should create an instance', () => {
    expect(NamespaceModule).toBeTruthy();
  });
});
