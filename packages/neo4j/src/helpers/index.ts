import { IExcludeType, NEO4J_MODULE_CONFIG } from '../injection.tokens';

export const mapToString = (a: IExcludeType[]) => a.map(t => t.toString());

export const exclude = (
  c: NEO4J_MODULE_CONFIG,
  type: 'query' | 'mutation',
  defaultExcludedTypes: IExcludeType[]
) => ({
  [type]: {
    exclude: defaultExcludedTypes.concat(
      ...(c!.excludedTypes![type]!.exclude! as any)
    )
  }
});
