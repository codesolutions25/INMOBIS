type Primitive = string | number | boolean | null | undefined;

type ConvertToCamelCase<T> = T extends Array<infer U>
  ? ConvertToCamelCase<U>[]
  : T extends Primitive
  ? T
  : {
      [K in keyof T as K extends string ? CamelCase<K> : K]: T[K] extends object ? ConvertToCamelCase<T[K]> : T[K];
    };

type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : S extends string
  ? Lowercase<S>
  : S;

/**
 * Converts a string or object keys from snake_case to camelCase
 * @param input The string or object to convert
 * @returns The converted string or object with camelCased keys
 */
export function toCamelCase<T>(input: T): ConvertToCamelCase<T> {
  if (input === null || input === undefined) {
    return input as ConvertToCamelCase<T>;
  }
  
  if (Array.isArray(input)) {
    return input.map((item) => toCamelCase(item)) as ConvertToCamelCase<T>;
  }
  
  if (typeof input === 'object') {
    return Object.entries(input).reduce((acc, [key, value]) => {
      const newKey = key.replace(/([-_][a-z])/g, (group) => 
        group.toUpperCase().replace(/[-_]/g, '')
      ) as CamelCase<typeof key>;
      
      return {
        ...acc,
        [newKey]: typeof value === 'object' ? toCamelCase(value) : value,
      };
    }, {} as any) as ConvertToCamelCase<T>;
  }
  
  if (typeof input === 'string') {
    return input.replace(/([-_][a-z])/g, (group) => 
      group.toUpperCase().replace(/[-_]/g, '')
    ) as unknown as ConvertToCamelCase<T>;
  }
  
  return input as ConvertToCamelCase<T>;
}

/**
 * Converts a string from camelCase to snake_case
 * @param str The string to convert
 * @returns The converted string in snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Converts all keys of an object from snake_case to camelCase
 * @param obj The object to convert
 * @returns A new object with camelCased keys
 */
export function keysToCamelCase<T>(obj: any): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keysToCamelCase(item)) as unknown as T;
  }

  return Object.keys(obj).reduce((result, key) => {
    const value = obj[key];
    const newKey = toCamelCase(key);
    
    result[newKey] = typeof value === 'object' && value !== null 
      ? keysToCamelCase(value) 
      : value;
      
    return result;
  }, {} as any) as T;
}

/**
 * Converts all keys of an object from camelCase to snake_case
 * @param obj The object to convert
 * @returns A new object with snake_cased keys
 */
export function keysToSnakeCase<T>(obj: any): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keysToSnakeCase(item)) as unknown as T;
  }

  return Object.keys(obj).reduce((result, key) => {
    const value = obj[key];
    const newKey = toSnakeCase(key);
    
    result[newKey] = typeof value === 'object' && value !== null 
      ? keysToSnakeCase(value) 
      : value;
      
    return result;
  }, {} as any) as T;
}
