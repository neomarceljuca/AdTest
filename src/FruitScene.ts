import Phaser from 'phaser';
import woodUrl from './assets/darkwood1background.jpg';
import fruitsUrl from './assets/fruits.png';
import fanfareUrl from './assets/ringfanfare.mp3';
import slashUrl from './assets/SlashHitCrate.mp3';
import { FRUIT_FRAMES, type FruitFrame } from './fruitFrames';
import { ROUND_DURATION_MS, ROUND_LAUNCHES, type FruitLaunch } from './roundConfig';

export const PLAYFIELD = { width: 360, height: 640 };

const FRUIT_RADIUS = 34;
const GRAVITY = 850;
const TRAIL_LIFETIME = 100;
const SLASH_SOUND = 'slash-hit';
const SLASH_VOLUME = 0.45;
const FANFARE_SOUND = 'round-end-fanfare';
const FANFARE_VOLUME = 0.5;
const HIT_SHAKE_MS = 90;
const HIT_SHAKE_INTENSITY = 0.0045;

interface Flight {
  image: Phaser.GameObjects.Image;
  clip?: Phaser.GameObjects.Graphics;
  velocityX: number;
  velocityY: number;
}

interface FruitFlight extends Flight {
  frame: FruitFrame;
}

interface TrailSegment {
  line: Phaser.Geom.Line;
  remainingMs: number;
}

export class FruitScene extends Phaser.Scene {
  private phase: 'ready' | 'playing' | 'finished' = 'ready';
  private fruits: FruitFlight[] = [];
  private halves: Flight[] = [];
  private elapsedMs = 0;
  private nextLaunch = 0;
  private score = 0;
  private instruction!: Phaser.GameObjects.Text;
  private scoreLabel!: Phaser.GameObjects.Text;
  private timeLabel!: Phaser.GameObjects.Text;
  private trail!: Phaser.GameObjects.Graphics;
  private trailSegments: TrailSegment[] = [];
  private swipePointerId?: number;
  private previousPoint = new Phaser.Math.Vector2();
  private fruitBounds = new Phaser.Geom.Circle(0, 0, FRUIT_RADIUS);
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor(private readonly onRoundEnd: (score: number, total: number) => void) {
    super('FruitScene');
  }

  preload() {
    if (!this.textures.exists('wood')) this.load.image('wood', woodUrl);
    if (!this.textures.exists('fruits')) this.load.image('fruits', fruitsUrl);
    if (!this.cache.audio.exists(SLASH_SOUND)) this.load.audio(SLASH_SOUND, slashUrl);
    if (!this.cache.audio.exists(FANFARE_SOUND)) this.load.audio(FANFARE_SOUND, fanfareUrl);
  }

  create() {
    this.phase = 'ready';
    this.elapsedMs = 0;
    this.nextLaunch = 0;
    this.score = 0;
    this.halves = [];
    this.trailSegments = [];
    this.swipePointerId = undefined;

    const centerX = PLAYFIELD.width / 2;
    const textStyle = { fontFamily: 'sans-serif', color: '#ffffff' };

    const background = this.add.image(centerX, PLAYFIELD.height / 2, 'wood').setDepth(-1);
    const coverScale = Math.max(PLAYFIELD.width / background.width, PLAYFIELD.height / background.height);
    background.setScale(coverScale * (1 + 2 * HIT_SHAKE_INTENSITY));

    const fruitTexture = this.textures.get('fruits');
    for (const [name, { bounds: [x, y, width, height] }] of Object.entries(FRUIT_FRAMES)) {
      if (!fruitTexture.has(name)) fruitTexture.add(name, 0, x, y, width, height);
    }

    this.add.text(centerX, 54, 'Fruit Slice', { ...textStyle, fontSize: '36px' }).setOrigin(0.5);
    this.instruction = this.add.text(centerX, 103, 'Swipe through the fruit to start', {
      ...textStyle, fontSize: '18px', color: '#f3ddbe',
    }).setOrigin(0.5);
    this.scoreLabel = this.add.text(24, 145, `Score 0/${ROUND_LAUNCHES.length}`, {
      ...textStyle, fontSize: '22px',
    }).setOrigin(0, 0.5);
    this.timeLabel = this.add.text(PLAYFIELD.width - 24, 145, `${ROUND_DURATION_MS / 1000}s`, {
      ...textStyle, fontSize: '22px',
    }).setOrigin(1, 0.5);

    this.trail = this.add.graphics().setDepth(1);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.startSwipe, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.trackSwipe, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.finishSwipe, this);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.finishSwipe, this);

    this.fruits = [this.createFruit(centerX, 356, ROUND_LAUNCHES[0].frame, 0, 0)];
  }

  update(_time: number, delta: number) {
    if (this.phase === 'playing') {
      this.elapsedMs += delta;
      const timeLeft = Math.max(0, ROUND_DURATION_MS - this.elapsedMs);
      this.timeLabel.setText(`${Math.ceil(timeLeft / 1000)}s`);
      if (timeLeft === 0) {
        this.finishRound();
        return;
      }

      const seconds = delta / 1000;
      this.fruits = this.fruits.filter((fruit) => this.advanceFlight(fruit, seconds));
      this.halves = this.halves.filter((half) => this.advanceFlight(half, seconds));

      while (this.nextLaunch < ROUND_LAUNCHES.length) {
        const launch = ROUND_LAUNCHES[this.nextLaunch];
        if (launch.atMs > this.elapsedMs) break;

        this.launchFruit(launch);
        this.nextLaunch++;
      }
    }

    if (this.trailSegments.length > 0) {
      this.trail.clear();
      this.trailSegments = this.trailSegments.filter((segment) => {
        segment.remainingMs -= delta;
        if (segment.remainingMs <= 0) return false;

        this.trail.lineStyle(4, 0xe8f7ff, segment.remainingMs / TRAIL_LIFETIME);
        this.trail.strokeLineShape(segment.line);
        return true;
      });
    }
  }

  private launchFruit(launch: FruitLaunch) {
    this.fruits.push(this.createFruit(
      launch.x, PLAYFIELD.height + FRUIT_RADIUS, launch.frame, launch.velocityX, launch.velocityY,
    ));
  }

  private createFruit(x: number, y: number, frame: FruitFrame, velocityX: number, velocityY: number): FruitFlight {
    const image = this.add.image(x, y, 'fruits', frame);
    image.setScale((FRUIT_RADIUS * 2) / Math.max(image.width, image.height));
    return { image, frame, velocityX, velocityY };
  }

  private finishRound() {
    this.phase = 'finished';
    this.swipePointerId = undefined;
    for (const flight of [...this.fruits, ...this.halves]) flight.image.destroy();
    this.fruits = [];
    this.halves = [];
    this.trailSegments = [];
    this.trail.clear();

    if (this.cache.audio.exists(FANFARE_SOUND)) {
      this.sound.play(FANFARE_SOUND, { volume: FANFARE_VOLUME });
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.sound.removeByKey(FANFARE_SOUND);
      });
    }

    this.onRoundEnd(this.score, ROUND_LAUNCHES.length);
  }

  private advanceFlight(flight: Flight, seconds: number) {
    const { image, clip } = flight;
    image.x += flight.velocityX * seconds;
    image.y += flight.velocityY * seconds + GRAVITY * seconds ** 2 / 2;
    clip?.setPosition(image.x, image.y);
    flight.velocityY += GRAVITY * seconds;

    if (flight.velocityY > 0 && image.y - FRUIT_RADIUS > PLAYFIELD.height) {
      image.destroy();
      return false;
    }
    return true;
  }

  private startSwipe(pointer: Phaser.Input.Pointer) {
    if (this.phase === 'finished' || !pointer.primaryDown) return;
    if (this.swipePointerId !== undefined && this.swipePointerId !== pointer.id) return;

    this.swipePointerId = pointer.id;
    this.previousPoint.set(pointer.x, pointer.y);
  }

  private trackSwipe(pointer: Phaser.Input.Pointer) {
    if (pointer.id !== this.swipePointerId) return;

    const dx = pointer.x - this.previousPoint.x;
    const dy = pointer.y - this.previousPoint.y;
    if (dx === 0 && dy === 0) return;

    // Use the same camera transform for both endpoints during a shake.
    const camera = this.cameras.main;
    const from = camera.getWorldPoint(this.previousPoint.x, this.previousPoint.y);
    const to = camera.getWorldPoint(pointer.x, pointer.y);
    const line = new Phaser.Geom.Line(from.x, from.y, to.x, to.y);
    this.previousPoint.set(pointer.x, pointer.y);
    this.trailSegments.push({ line, remainingMs: TRAIL_LIFETIME });

    // Check the whole swipe segment so a fast drag can hit between pointer samples.
    const before = this.fruits.length;
    this.fruits = this.fruits.filter((fruit) => {
      this.fruitBounds.setPosition(fruit.image.x, fruit.image.y);
      if (!Phaser.Geom.Intersects.LineToCircle(line, this.fruitBounds)) return true;

      this.sliceFruit(fruit, Math.atan2(dy, dx));
      return false;
    });
    const sliced = before - this.fruits.length;
    if (sliced === 0) return;

    if (!this.reducedMotion.matches) camera.shake(HIT_SHAKE_MS, HIT_SHAKE_INTENSITY, true);

    if (this.phase === 'ready') {
      this.phase = 'playing';
      this.instruction.setText('Slice as many as you can');
    } else {
      this.score += sliced;
      this.scoreLabel.setText(`Score ${this.score}/${ROUND_LAUNCHES.length}`);
    }
  }

  private finishSwipe(pointer: Phaser.Input.Pointer) {
    if (pointer.id !== this.swipePointerId) return;

    if (!pointer.wasCanceled) this.trackSwipe(pointer);
    this.swipePointerId = undefined;
  }

  private sliceFruit(fruit: FruitFlight, angle: number) {
    const { x, y, scale } = fruit.image;
    const pushX = -Math.sin(angle) * 125;
    const pushY = Math.cos(angle) * 125;
    const extent = FRUIT_RADIUS * 2;

    for (const direction of [1, -1]) {
      const image = this.add.image(x, y, 'fruits', fruit.frame).setScale(scale);
      // Rotate the clip along the swipe while the fruit artwork keeps its orientation.
      const clip = this.make.graphics({ x, y }, false).setRotation(angle);
      clip.fillStyle(0xffffff).fillRect(-extent, direction === 1 ? 0 : -extent, extent * 2, extent);
      image.setMask(clip.createGeometryMask());
      image.once(Phaser.GameObjects.Events.DESTROY, () => {
        image.clearMask(true);
        clip.destroy();
      });

      this.halves.push({
        image,
        clip,
        velocityX: fruit.velocityX + pushX * direction,
        velocityY: fruit.velocityY + pushY * direction,
      });
    }

    fruit.image.destroy();
    if (this.cache.audio.exists(SLASH_SOUND)) this.sound.play(SLASH_SOUND, { volume: SLASH_VOLUME });
    this.burstJuice(x, y, angle, FRUIT_FRAMES[fruit.frame].juiceColor);
    if (this.phase === 'playing') this.showPoint(x, y);
  }

  private burstJuice(x: number, y: number, sliceAngle: number, color: number) {
    const dropletCount = 8;

    for (let index = 0; index < dropletCount; index++) {
      const angle = sliceAngle + (index / dropletCount) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.2, 0.2);
      const distance = Phaser.Math.Between(40, 62);
      const droplet = this.add.circle(x, y, Phaser.Math.FloatBetween(3.2, 5.3), color).setDepth(0.5);

      this.tweens.add({
        targets: droplet,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        scale: 0.55,
        alpha: { value: 0, ease: 'Cubic.In' },
        duration: Phaser.Math.Between(330, 420),
        ease: 'Quad.Out',
        onComplete: () => droplet.destroy(),
      });
    }
  }

  private showPoint(x: number, y: number) {
    const point = this.add.text(x, y - 18, '+1', {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#fff3d5',
      stroke: '#27160f',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2);

    this.tweens.add({
      targets: point,
      y: y - 52,
      alpha: { value: 0, ease: 'Quad.In' },
      duration: 520,
      ease: 'Quad.Out',
      onComplete: () => point.destroy(),
    });
  }
}
