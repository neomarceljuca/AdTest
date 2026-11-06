// Bounds are [x, y, width, height] in pixels within fruits.png.
export const FRUIT_FRAMES = {
  apple: { bounds: [0, 29, 97, 85], juiceColor: 0xff7059 },
  pear: { bounds: [136, 0, 86, 114], juiceColor: 0xb2de68 },
  orange: { bounds: [264, 27, 90, 87], juiceColor: 0xff9e3d },
  mango: { bounds: [371, 19, 121, 96], juiceColor: 0xffb84d },
  pomegranate: { bounds: [514, 10, 95, 106], juiceColor: 0xf45e7d },
  goldenFruit: { bounds: [647, 21, 91, 94], juiceColor: 0xffdc52 },
} as const;

export type FruitFrame = keyof typeof FRUIT_FRAMES;
