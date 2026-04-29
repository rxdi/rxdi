import { setConfigGraphql, setConfigServer } from './core-module';

describe('Core module helper', () => {
  it('Should set appropriate config to graphql', async () => {
    expect(setConfigGraphql({ initQuery: false }).initQuery).toBe(false);
    expect(setConfigGraphql({ writeEffects: true }).writeEffects).toBe(true);
    expect(
      setConfigGraphql({ buildAstDefinitions: false }).buildAstDefinitions
    ).toBe(false);
  });

  it('Should set appropriate config to server', async () => {
    expect(setConfigServer({ randomPort: false }).randomPort).toBe(false);
    expect(setConfigServer({ hapi: { port: 9202 } }).hapi.port).toBe(9202);
  });
});
