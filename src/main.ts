import Phaser from 'phaser';
import { FruitScene, PLAYFIELD } from './FruitScene';

new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game',
  width: PLAYFIELD.width,
  height: PLAYFIELD.height,
  backgroundColor: '#18243b',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: FruitScene,
});
