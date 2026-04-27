export function parseMultipleJson(data: unknown): unknown[] {
  if (!data) return [];

  const str = data.toString();

  const objects = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < str.length; i++) {
    if (str[i] === '{') depth++;
    if (str[i] === '}') depth--;

    if (depth === 0 && str[i] === '}') {
      objects.push(JSON.parse(str.slice(start, i + 1)));
      start = i + 1;
    }
  }

  return objects;
}
