// Oracle type transformers for TypeORM
// Oracle doesn't have native BOOLEAN or JSON column types

export const booleanTransformer = {
  to: (value: boolean | undefined | null): number | null =>
    value === undefined || value === null ? null : value ? 1 : 0,
  from: (value: number | null): boolean => value === 1,
};

export const jsonTransformer = {
  to: (value: any): string | null =>
    value === undefined || value === null ? null : JSON.stringify(value),
  from: (value: string | null): any => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
};
