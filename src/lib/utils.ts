import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function toCamel(s: string) {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
}

function toSnake(s: string) {
    return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertKeys(obj: any, converter: (s:string) => string): any {
    if (Array.isArray(obj)) {
        return obj.map(v => convertKeys(v, converter));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((acc, key) => {
            acc[converter(key)] = convertKeys(obj[key], converter);
            return acc;
        }, {} as any);
    }
    return obj;
}

export function keysToCamel(obj: any): any {
    return convertKeys(obj, toCamel);
}

export function keysToSnake(obj: any): any {
    return convertKeys(obj, toSnake);
}
