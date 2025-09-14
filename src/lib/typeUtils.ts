// Type utilities to handle null/undefined values safely

export const nullToUndefined = <T>(value: T | null): T | undefined => {
  return value === null ? undefined : value;
};

export const nullToEmptyString = (value: string | null | undefined): string => {
  return value ?? '';
};

export const nullToFalse = (value: boolean | null | undefined): boolean => {
  return value ?? false;
};

export const safeDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  try {
    return new Date(value);
  } catch {
    return null;
  }
};