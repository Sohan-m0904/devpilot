export function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function fmtScore(n: number) {
  return (Math.round(n * 1000) / 1000).toFixed(3);
}
