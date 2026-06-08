declare module 'tone' {
  export function start(): Promise<void>;
  export function now(): number;

  interface Signal {
    value: number;
  }

  interface ToneNode {
    connect(destination: ToneNode): this;
    disconnect(): this;
    toDestination(): this;
    dispose(): this;
  }

  export class PolySynth {
    constructor();
    connect(destination: ToneNode): this;
    disconnect(): this;
    toDestination(): this;
    triggerAttackRelease(note: string, duration: string, time: number, velocity?: number): this;
  }

  export class AMSynth extends PolySynth {}
  export class FMSynth extends PolySynth {}
  export class MembraneSynth extends PolySynth {}
  export class MetalSynth extends PolySynth {}

  export class Reverb implements ToneNode {
    constructor(seconds?: number);
    wet: Signal;
    connect(destination: ToneNode): this;
    disconnect(): this;
    toDestination(): this;
    dispose(): this;
  }

  export class FeedbackDelay implements ToneNode {
    constructor(delayTime?: number, feedback?: number);
    wet: Signal;
    connect(destination: ToneNode): this;
    disconnect(): this;
    toDestination(): this;
    dispose(): this;
  }

  export class Volume implements ToneNode {
    constructor(volume?: number);
    volume: Signal;
    connect(destination: ToneNode): this;
    disconnect(): this;
    toDestination(): this;
    dispose(): this;
  }

  export class Sequence {
    constructor(
      callback: (time: number, idx: number) => void,
      events: unknown[],
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
