import { events } from './events';
import { START_AMMO, SCORE_PER_KILL, SCORE_PER_AMMO } from '../config';
import type { PhysicsWorld } from '../physics/PhysicsWorld';

export type GamePhase = 'menu' | 'aiming' | 'swinging' | 'flying' | 'settling' | 'won' | 'lost';

export class GameState {
  phase: GamePhase = 'menu';
  score = 0;
  ammo = START_AMMO;
  bestScore = parseInt(localStorage.getItem('ctc_best') || '0', 10);
  starsEarned = 0;
  enemiesAlive = 0;
  paused = false;
  physics: PhysicsWorld;

  constructor(physics: PhysicsWorld) {
    this.physics = physics;

    this.physics.onTurnEnded = () => this.endTurn();
    this.physics.onEnemyKilled = (_idx: number) => {
      this.enemiesAlive--;
      this.score += SCORE_PER_KILL;
      events.emit('score-changed', this.score);
      events.emit('enemies-changed', this.enemiesAlive);
    };
  }

  private setPhase(p: GamePhase) {
    this.phase = p;
    events.emit('phase-changed', p);
  }

  startLevel() {
    this.setPhase('aiming');
    this.score = 0;
    this.ammo = START_AMMO;
    this.starsEarned = 0;
    this.enemiesAlive = this.physics.enemies.length;
    events.emit('score-changed', this.score);
    events.emit('ammo-changed', this.ammo);
    events.emit('enemies-changed', this.enemiesAlive);
  }

  fire() {
    if (this.phase !== 'aiming') return;
    this.setPhase('swinging');
  }

  startFlying() {
    this.setPhase('flying');
  }

  endTurn() {
    this.setPhase('settling');
    this.ammo--;

    if (this.enemiesAlive <= 0) {
      this.score += this.ammo * SCORE_PER_AMMO;
      this.starsEarned = this.ammo >= 2 ? 3 : this.ammo === 1 ? 2 : 1;
      this.updateBest();
      this.setPhase('won');
      events.emit('victory');
      return;
    }

    if (this.ammo <= 0) {
      this.starsEarned = 0;
      this.setPhase('lost');
      events.emit('defeat');
      return;
    }

    this.setPhase('aiming');
    events.emit('ammo-changed', this.ammo);
  }

  togglePause() {
    this.paused = !this.paused;
    events.emit(this.paused ? 'pause' : 'resume');
  }

  private updateBest() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      try { localStorage.setItem('ctc_best', String(this.bestScore)); } catch {}
    }
  }
}
