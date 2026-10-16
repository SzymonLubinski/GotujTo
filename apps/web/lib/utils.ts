import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function orderBySessionSeed<T>(
  items: readonly T[],
  seed: string | undefined,
  getKey: (item: T) => string,
): T[] {
  if (!seed) {
    return [...items];
  }

  return [...items].sort((first, second) => {
    const firstKey = getKey(first);
    const secondKey = getKey(second);
    const scoreDifference = getSeededScore(seed, firstKey) - getSeededScore(seed, secondKey);

    return scoreDifference || firstKey.localeCompare(secondKey);
  });
}

function getSeededScore(seed: string, value: string) {
  const input = `${seed}:${value}`;
  let hash = 2166136261;

  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
