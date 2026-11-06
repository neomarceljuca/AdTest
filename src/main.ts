import Phaser from 'phaser';
import { FruitScene, PLAYFIELD } from './FruitScene';

const endCard = document.querySelector<HTMLElement>('#end-card')!;
const result = document.querySelector<HTMLElement>('#round-result')!;

const fruitScene = new FruitScene((score, total) => {
  result.textContent = `You sliced ${score} of ${total}`;
  endCard.hidden = false;
  result.focus();
});

document.querySelector('#play-again')!.addEventListener('click', () => {
  endCard.hidden = true;
  fruitScene.scene.restart();
});

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
  scene: fruitScene,
});
