import type { FruitFrame } from './fruitFrames';

export const ROUND_DURATION_MS = 15_000;

export interface FruitLaunch {
  atMs: number;
  x: number;
  velocityX: number;
  velocityY: number;
  frame: FruitFrame;
}

export const ROUND_LAUNCHES: readonly FruitLaunch[] = [
  { atMs: 0, x: 96, velocityX: 96, velocityY: -740, frame: 'apple' },
  { atMs: 2000, x: 264, velocityX: -96, velocityY: -740, frame: 'orange' },
  { atMs: 3900, x: 87, velocityX: 112, velocityY: -770, frame: 'pear' },
  { atMs: 5550, x: 240, velocityX: -65, velocityY: -800, frame: 'mango' },
  { atMs: 7000, x: 125, velocityX: 45, velocityY: -755, frame: 'pomegranate' },
  { atMs: 8250, x: 60, velocityX: 55, velocityY: -740, frame: 'goldenFruit' },
  { atMs: 8250, x: 300, velocityX: -55, velocityY: -740, frame: 'apple' },
  { atMs: 9800, x: 265, velocityX: -100, velocityY: -780, frame: 'orange' },
  { atMs: 10_900, x: 80, velocityX: 95, velocityY: -760, frame: 'pear' },
  { atMs: 11_950, x: 232, velocityX: -62, velocityY: -820, frame: 'mango' },
];
