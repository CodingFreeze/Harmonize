declare module 'tone' {
  export function start(): Promise<void>;
  export function now(): number;

  export class PolySynth {
    constructor();
    connect(destination: any): this;
    disconnect(): this;
    toDestination(): this;
    triggerAttackRelease(note: string, duration: string, time: number, velocity?: number): this;
  }

  export class AMSynth extends PolySynth {}
  export class FMSynth extends PolySynth {}
  export class MembraneSynth extends PolySynth {}
  export class MetalSynth extends PolySynth {}

  export class Reverb {
    constructor(seconds?: number);
    toDestination(): this;
  }

  export class FeedbackDelay {
    constructor(delayTime?: number, feedback?: number);
    toDestination(): this;
  }

  export class Sequence {
    constructor(
      callback: (time: number, idx: number) => void,
      events: any[],
      subdivision: string
    );
    start(time?: number): this;
    stop(time?: number): this;
    dispose(): this;
  }

  export const Transport: {
    start(time?: number): void;
    stop(time?: number): void;
    cancel(after?: number): void;
  };
} 