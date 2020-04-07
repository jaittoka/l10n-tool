export default function joinArrays<T>(arrays: T[][]): T[] {
  const result = [] as T[];
  arrays.forEach((arr) => arr.forEach((item) => result.push(item)));
  return result;
}
