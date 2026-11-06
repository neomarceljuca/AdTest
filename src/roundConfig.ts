export const ROUND_DURATION_MS = 15_000;
export const LAUNCH_VARIATION = { velocityX: 12, velocityY: 22 };
export const FRUIT_SPIN_SPEED = { min: 5, max: 45 }; // Degrees per second.

export interface FruitLaunch {
  atMs: number;
  x: number;
  velocityX: number;
  velocityY: number;
}

export const ROUND_LAUNCHES: readonly FruitLaunch[] = [
  { atMs: 0, x: 96, velocityX: 96, velocityY: -740 },
  { atMs: 2000, x: 264, velocityX: -96, velocityY: -740 },
  { atMs: 3900, x: 87, velocityX: 112, velocityY: -770 },
  { atMs: 5550, x: 240, velocityX: -65, velocityY: -800 },
  { atMs: 7000, x: 125, velocityX: 45, velocityY: -755 },
  { atMs: 8250, x: 60, velocityX: 55, velocityY: -740 },
  { atMs: 8250, x: 300, velocityX: -55, velocityY: -740 },
  { atMs: 9800, x: 265, velocityX: -100, velocityY: -780 },
  { atMs: 10_900, x: 80, velocityX: 95, velocityY: -760 },
  { atMs: 13_000, x: 60, velocityX: 55, velocityY: -820 },
  { atMs: 13_000, x: 232, velocityX: -62, velocityY: -900 },
  { atMs: 13_000, x: 332, velocityX: -32, velocityY: -740 },
];
