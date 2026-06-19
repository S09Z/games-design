export type GameEvent =
  | 'physics-ready'
  | 'boulder-launched'
  | 'boulder-removed'
  | 'collision-impact'
  | 'enemy-killed'
  | 'turn-ended'
  | 'victory'
  | 'defeat'
  | 'aim-changed'
  | 'ammo-changed'
  | 'score-changed'
  | 'enemies-changed'
  | 'level-restart'
  | 'phase-changed'
  | 'pause'
  | 'resume';

export type Listener = (...args: unknown[]) => void;

export class EventBus {
  private listeners = new Map<GameEvent, Listener[]>();

  on(event: GameEvent, fn: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(fn);
  }

  off(event: GameEvent, fn: Listener) {
    const fns = this.listeners.get(event);
    if (fns) this.listeners.set(event, fns.filter(f => f !== fn));
  }

  emit(event: GameEvent, ...args: unknown[]) {
    this.listeners.get(event)?.forEach(fn => fn(...args));
  }
}

export const events = new EventBus();
