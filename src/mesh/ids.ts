const HEX = 'abcdef0123456789';

export function makeId(len = 12): string {
  let s = '';
  for (let i = 0; i < len; i++) s += HEX[Math.floor(Math.random() * HEX.length)];
  return s;
}
