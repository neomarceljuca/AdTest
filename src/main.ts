import Phaser from 'phaser';

new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game',
  width: 360,
  height: 640,
  backgroundColor: '#18243b',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    create(this: Phaser.Scene) {
      this.add.text(180, 230, 'Fruit Slice', {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.add.circle(180, 320, 34, 0xff715b);
    },
  },
});
