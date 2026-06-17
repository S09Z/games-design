import { events } from './events';
import { START_AMMO, SCORE_PER_KILL, SCORE_PER_AMMO } from '../config';
import { PhysicsWorld } from '../physics/PhysicsWorld';

export type GamePhase = 'menu' | 'aiming' | 'swinging' | 'flying' | 'settling' | 'won' | 'lost';

export class GameState {
  phase: GamePhase = 'menu';
  score = 0;
  ammo = START_AMMO;
  bestScore = parseInt(localStorage.getItem('ctc_best') || '0', 10);
  starsEarned = 0;
  enemiesAlive = 0;
  physics: PhysicsWorld;

  constructor(physics: PhysicsWorld) {
    this.physics = physics;

    this.physics.onTurnEnded = () => this.endTurn();
    this.physics.onEnemyKilled = () => {
      this.enemiesAlive--;
    };
  }

  startLevel() {
    this.phase = 'aiming';
    this.score = 0;
    this.ammo = START_AMMO;
    this.starsEarned = 0;
    this.enemiesAlive = this.physics.enemies.length;
    events.emit('score-changed', this.score);
    events.emit('ammo-changed', this.ammo);
  }

  fire(pos: { x: number; y: number; z: number }, vel: { x: number; y: number; z: number }) {
    if (this.phase !== 'aiming') return;
    this.phase = 'swinging';
    // Physics will launch boulder at release frame (handled by caller/trebuchet anim)
    // For now fire directly:
    this.physics.launchBoulder(pos, vel);
    this.phase = 'flying';
  }

  endTurn() {
    this.phase = 'settling';
    this.ammo--;

    if (this.enemiesAlive <= 0) {
      // Victory
      this.score += this.ammo * SCORE_PER_AMMO;
      this.starsEarned = this.ammo >= 2 ? 3 : this.ammo === 1 ? 2 : 1;
      this.updateBest();
      this.phase = 'won';
      events.emit('victory');
      return;
    }

    if (this.ammo <= 0) {
      // Defeat
      this.starsEarned = 0;
      this.phase = 'lost';
      events.emit('defeat');
      return;
    }

    // Next shot
    this.phase = 'aiming';
    events.emit('ammo-changed', this.ammo);
  }

  private updateBest() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      try { localStorage.setItem('ctc_best', String(this.bestScore)); } catch {}
    }
  }
}
