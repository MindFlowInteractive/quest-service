/**
 * Generic test data factory to reduce fixture boilerplate. (#416)
 */
export type FactoryDefaults<T> = () => T;
export type FactoryOverrides<T> = Partial<T> | ((base: T) => Partial<T>);

export function createFactory<T>(defaults: FactoryDefaults<T>) {
  return function build(overrides: FactoryOverrides<T> = {}): T {
    const base = defaults();
    const patch = typeof overrides === "function" ? overrides(base) : overrides;
    return { ...base, ...patch };
  };
}

export function buildMany<T>(build: (overrides?: FactoryOverrides<T>) => T, count: number): T[] {
  return Array.from({ length: count }, () => build());
}

export function sequence(prefix: string): () => string {
  let counter = 0;
  return () => `${prefix}-${++counter}`;
}
