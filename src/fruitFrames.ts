// Each frame is [x, y, width, height] in pixels within fruits.png.
export const FRUIT_FRAMES = {
  apple: [0, 29, 97, 85],
  pear: [136, 0, 86, 114],
  orange: [264, 27, 90, 87],
  mango: [371, 19, 121, 96],
  pomegranate: [514, 10, 95, 106],
  goldenFruit: [647, 21, 91, 94],
} as const;

export type FruitFrame = keyof typeof FRUIT_FRAMES;
