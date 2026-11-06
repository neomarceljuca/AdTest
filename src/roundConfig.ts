export const ROUND_DURATION_MS = 15_000;

export interface FruitLaunch {
  atMs: number;
  x: number;
  velocityX: number;
  velocityY: number;
  color: number;
}

const CORAL = 0xff715b;
const GOLD = 0xffc75f;
const GREEN = 0x81d88a;

export const ROUND_LAUNCHES: readonly FruitLaunch[] = [
  { atMs: 0, x: 96, velocityX: 96, velocityY: -740, color: CORAL },
  { atMs: 2000, x: 264, velocityX: -96, velocityY: -740, color: GOLD },
  { atMs: 3900, x: 87, velocityX: 112, velocityY: -770, color: GREEN },
  { atMs: 5550, x: 240, velocityX: -65, velocityY: -800, color: CORAL },
  { atMs: 7000, x: 125, velocityX: 45, velocityY: -755, color: GOLD },
  { atMs: 8250, x: 60, velocityX: 55, velocityY: -740, color: GREEN },
  { atMs: 8250, x: 300, velocityX: -55, velocityY: -740, color: CORAL },
  { atMs: 9800, x: 265, velocityX: -100, velocityY: -780, color: GOLD },
  { atMs: 10_900, x: 80, velocityX: 95, velocityY: -760, color: GREEN },
  { atMs: 11_950, x: 232, velocityX: -62, velocityY: -820, color: CORAL },
];
