/*
 * Utility functions
 */

export function inString(text: string, offset: number): boolean {
  let isin = false;
  let pos = text.indexOf('"');

  while (pos >= 0 && pos < offset) {
    if (pos === 0 || text.charAt(pos - 1) !== '\\') {
      isin = !isin;
    }

    pos = text.indexOf('"', pos + 1);
  }

  return isin;
}

export function getDateTime(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  // format e.g. 2017-02-13 10:04:45
  return `${year}-${month}-${day} ${hour}:${minutes}:${seconds}`;
}

// if < 10, prefix 0
const pad = (num: number): string => (num < 10 ? '0' + num : '' + num);
