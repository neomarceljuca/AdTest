import Phaser from 'phaser';

export const PLAYFIELD = { width: 360, height: 640 };

const FRUIT_RADIUS = 34;
const FRUIT_COLOR = 0xff715b;
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
  private fruit?: Flight;
  private halves: Flight[] = [];
  private score = 0;
  private scoreLabel!: Phaser.GameObjects.Text;
  private trail!: Phaser.GameObjects.Graphics;
  private trailSegments: TrailSegment[] = [];
  private swipePointerId?: number;
  private previousPoint = new Phaser.Math.Vector2();
  private fruitBounds = new Phaser.Geom.Circle(0, 0, FRUIT_RADIUS);

  create() {
    const centerX = PLAYFIELD.width / 2;
    const textStyle = { fontFamily: 'sans-serif', color: '#ffffff' };

    this.add.text(centerX, 54, 'Fruit Slice', { ...textStyle, fontSize: '36px' }).setOrigin(0.5);
    this.add.text(centerX, 103, 'Swipe through the fruit', {
      ...textStyle, fontSize: '18px', color: '#b9cce6',
    }).setOrigin(0.5);
    this.scoreLabel = this.add.text(centerX, 145, 'Score 0', {
      ...textStyle, fontSize: '22px',
    }).setOrigin(0.5);

    this.trail = this.add.graphics().setDepth(1);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.startSwipe, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.trackSwipe, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.finishSwipe, this);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.finishSwipe, this);

    this.launchFruit();
  }

  update(_time: number, delta: number) {
    const seconds = delta / 1000;

    if (this.fruit && !this.advanceFlight(this.fruit, seconds)) {
      this.fruit = undefined;
    }
    this.halves = this.halves.filter((half) => this.advanceFlight(half, seconds));
    if (!this.fruit && this.halves.length === 0) {
      this.launchFruit();
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

  private launchFruit() {
    this.fruit = {
      shape: this.add.circle(96, PLAYFIELD.height + FRUIT_RADIUS, FRUIT_RADIUS, FRUIT_COLOR),
      velocityX: 96,
      velocityY: -740,
    };
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
    if (!pointer.primaryDown) return;
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

    if (!this.fruit) return;

    // Check the whole swipe segment so a fast drag can hit between pointer samples.
    this.fruitBounds.setPosition(this.fruit.shape.x, this.fruit.shape.y);
    if (Phaser.Geom.Intersects.LineToCircle(line, this.fruitBounds)) {
      this.sliceFruit(this.fruit, Math.atan2(dy, dx));
    }
  }

  private finishSwipe(pointer: Phaser.Input.Pointer) {
    if (pointer.id !== this.swipePointerId) return;

    if (!pointer.wasCanceled) this.trackSwipe(pointer);
    this.swipePointerId = undefined;
  }

  private sliceFruit(fruit: Flight, angle: number) {
    const { x, y } = fruit.shape;
    const angleDegrees = Phaser.Math.RadToDeg(angle);
    const pushX = -Math.sin(angle) * 125;
    const pushY = Math.cos(angle) * 125;

    fruit.shape.destroy();
    this.fruit = undefined;
    this.scoreLabel.setText(`Score ${++this.score}`);

    this.halves = [
      {
        shape: this.add.arc(x, y, FRUIT_RADIUS, angleDegrees, angleDegrees + 180, false, FRUIT_COLOR),
        velocityX: fruit.velocityX + pushX,
        velocityY: fruit.velocityY + pushY,
      },
      {
        shape: this.add.arc(x, y, FRUIT_RADIUS, angleDegrees + 180, angleDegrees + 360, false, FRUIT_COLOR),
        velocityX: fruit.velocityX - pushX,
        velocityY: fruit.velocityY - pushY,
      },
    ];
  }
}
