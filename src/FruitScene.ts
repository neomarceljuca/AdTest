import Phaser from 'phaser';
import { ROUND_DURATION_MS, ROUND_LAUNCHES, type FruitLaunch } from './roundConfig';

export const PLAYFIELD = { width: 360, height: 640 };

const FRUIT_RADIUS = 34;
const GRAVITY = 850;
const TRAIL_LIFETIME = 100;

interface Flight {
  shape: Phaser.GameObjects.Arc;
  velocityX: number;
  velocityY: number;
}

interface TrailSegment {
  line: Phaser.Geom.Line;
  remainingMs: number;
}

export class FruitScene extends Phaser.Scene {
  private phase: 'ready' | 'playing' | 'finished' = 'ready';
  private fruits: Flight[] = [];
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

  constructor(private readonly onRoundEnd: (score: number, total: number) => void) {
    super('FruitScene');
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

    this.add.text(centerX, 54, 'Fruit Slice', { ...textStyle, fontSize: '36px' }).setOrigin(0.5);
    this.instruction = this.add.text(centerX, 103, 'Swipe through the fruit to start', {
      ...textStyle, fontSize: '18px', color: '#b9cce6',
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

    this.fruits = [{
      shape: this.add.circle(centerX, 356, FRUIT_RADIUS, ROUND_LAUNCHES[0].color),
      velocityX: 0,
      velocityY: 0,
    }];
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
    this.fruits.push({
      shape: this.add.circle(launch.x, PLAYFIELD.height + FRUIT_RADIUS, FRUIT_RADIUS, launch.color),
      velocityX: launch.velocityX,
      velocityY: launch.velocityY,
    });
  }

  private finishRound() {
    this.phase = 'finished';
    this.swipePointerId = undefined;
    for (const flight of [...this.fruits, ...this.halves]) flight.shape.destroy();
    this.fruits = [];
    this.halves = [];
    this.trailSegments = [];
    this.trail.clear();
    this.onRoundEnd(this.score, ROUND_LAUNCHES.length);
  }

  private advanceFlight(flight: Flight, seconds: number) {
    flight.shape.x += flight.velocityX * seconds;
    flight.shape.y += flight.velocityY * seconds + GRAVITY * seconds ** 2 / 2;
    flight.velocityY += GRAVITY * seconds;

    if (flight.velocityY > 0 && flight.shape.y - FRUIT_RADIUS > PLAYFIELD.height) {
      flight.shape.destroy();
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

    const line = new Phaser.Geom.Line(this.previousPoint.x, this.previousPoint.y, pointer.x, pointer.y);
    this.previousPoint.set(pointer.x, pointer.y);
    this.trailSegments.push({ line, remainingMs: TRAIL_LIFETIME });

    // Check the whole swipe segment so a fast drag can hit between pointer samples.
    const before = this.fruits.length;
    this.fruits = this.fruits.filter((fruit) => {
      this.fruitBounds.setPosition(fruit.shape.x, fruit.shape.y);
      if (!Phaser.Geom.Intersects.LineToCircle(line, this.fruitBounds)) return true;

      this.sliceFruit(fruit, Math.atan2(dy, dx));
      return false;
    });
    const sliced = before - this.fruits.length;
    if (sliced === 0) return;

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

  private sliceFruit(fruit: Flight, angle: number) {
    const { x, y, fillColor } = fruit.shape;
    const angleDegrees = Phaser.Math.RadToDeg(angle);
    const pushX = -Math.sin(angle) * 125;
    const pushY = Math.cos(angle) * 125;

    fruit.shape.destroy();

    this.halves.push(
      {
        shape: this.add.arc(x, y, FRUIT_RADIUS, angleDegrees, angleDegrees + 180, false, fillColor),
        velocityX: fruit.velocityX + pushX,
        velocityY: fruit.velocityY + pushY,
      },
      {
        shape: this.add.arc(x, y, FRUIT_RADIUS, angleDegrees + 180, angleDegrees + 360, false, fillColor),
        velocityX: fruit.velocityX - pushX,
        velocityY: fruit.velocityY - pushY,
      },
    );
  }
}
