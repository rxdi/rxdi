import { setConfigGraphql, setConfigServer } from './core-module';

describe('Core module helper', () => {
  it('Should set appropriate config to graphql', async done => {
    expect(setConfigGraphql({ initQuery: false }).initQuery).toBe(false);
    expect(setConfigGraphql({ writeEffects: true }).writeEffects).toBe(true);
    expect(
      setConfigGraphql({ buildAstDefinitions: false }).buildAstDefinitions
    ).toBe(false);
    done();
  });

  it('Should set appropriate config to server', async done => {
    expect(setConfigServer({ randomPort: false }).randomPort).toBe(false);
    expect(setConfigServer({ hapi: { port: 9202 } }).hapi.port).toBe(9202);
    done();
  });
});
