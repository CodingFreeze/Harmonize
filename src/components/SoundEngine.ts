import * as Tone from 'tone';

export interface StrokePoint {
  x: number;
  y: number;
  time: number;
  pressure?: number;
  speed?: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
  stylus?: string;
}

class SoundEngine {
  private synth: any; // Use any type to avoid TypeScript errors
  private isInitialized: boolean = false;
  private strokes: Stroke[] = [];
  private playing: boolean = false;
  private currentInstrument: string = 'synth';
  private currentStylus: string = 'default';
  private sequence: any = null; // Use any type to avoid TypeScript errors
  private reverb: any; // Use any type to avoid TypeScript errors
  private delay: any; // Use any type to avoid TypeScript errors
  private volume: any; // Volume node
  private currentVolume: number = 25; // Default mid-range volume (0-75)
  private playbackSpeed: number = 1; // Default normal speed (1x)
  private startTime: number = 0;
  private totalDuration: number = 120; // Maximum 2 minutes (120 seconds)
  private autoEndTimeout: number | null = null;
  private onPlaybackEnd: (() => void) | null = null;
  private loopPlayback: boolean = false;
  private currentPosition: number = 0; // Current playback position in seconds
  private isDisposed: boolean = false;
  
  constructor() {
    // Initialize with a basic synth
    this.synth = new Tone.PolySynth().toDestination();
    
    try {
      // Set up better quality audio settings
      const toneContext = (Tone as any).context;
      if (toneContext) {
        toneContext.lookAhead = 0.2; // Slightly higher lookahead for smoother sound
        toneContext.updateInterval = 0.01; // More frequent updates
        
        // Check if audio context is in suspended state and notify
        if (toneContext.state !== 'running') {
          console.warn('Audio context is suspended. User interaction will be required to enable audio.');
        }
      }
      
      // Create cleaner effects and volume control
      this.reverb = new Tone.Reverb(1.0).toDestination();
      this.delay = new Tone.FeedbackDelay(0.2, 0.2).toDestination();
      this.volume = new (Tone as any).Volume(-3).toDestination();
      
      // Adjust effect levels for cleaner sound
      if (this.reverb.wet) this.reverb.wet.value = 0.3;
      if (this.delay.wet) this.delay.wet.value = 0.2;
  
      // Chain effects to synth
      this.synth.disconnect();
      this.synth.connect(this.volume);
      this.volume.connect(this.reverb);
      this.volume.connect(this.delay);
      this.volume.toDestination(); // Also connect directly for cleaner signal
      
      // Verify the volume level isn't set to mute
      if (this.volume && this.volume.volume && this.volume.volume.value < -40) {
        console.warn('Volume may be too low:', this.volume.volume.value);
        this.volume.volume.value = -3; // Safer default
      }
    } catch (error) {
      console.warn('Error setting up audio settings:', error);
    }
    
    // Apply initial volume
    this.setVolume(this.currentVolume);
    
    // Clean up when window unloads
    window.addEventListener('beforeunload', () => {
      this.dispose();
    });
    
    // Log a message to help with debugging
    console.log('SoundEngine initialized. Current volume:', this.currentVolume);
  }

  // Dispose of all audio resources
  dispose() {
    if (this.isDisposed) return;
    
    this.stop();
    
    // Clean up all audio nodes
    try {
      if (this.synth) {
        this.synth.disconnect();
        if (typeof this.synth.dispose === 'function') {
          this.synth.dispose();
        }
      }
      
      if (this.reverb) {
        this.reverb.disconnect();
        if (typeof this.reverb.dispose === 'function') {
          this.reverb.dispose();
        }
      }
      
      if (this.delay) {
        this.delay.disconnect();
        if (typeof this.delay.dispose === 'function') {
          this.delay.dispose();
        }
      }
      
      if (this.volume) {
        this.volume.disconnect();
        if (typeof this.volume.dispose === 'function') {
          this.volume.dispose();
        }
      }
      
      if (this.sequence) {
        if (typeof this.sequence.dispose === 'function') {
          this.sequence.dispose();
        }
      }
    } catch (error) {
      console.warn('Error disposing audio resources:', error);
    }
    
    this.isDisposed = true;
  }

  async initialize() {
    if (this.isDisposed) {
      this.isDisposed = false;
    }
    
    if (!this.isInitialized) {
      try {
        // Check if audio context is in suspended state (common in browsers)
        const toneContext = (Tone as any).context;
        if (toneContext && toneContext.state === 'suspended') {
          console.log('Audio context is suspended. Attempting to resume...');
          await toneContext.resume();
        }
        
        // Tone.start() needs to be triggered by user gesture in most browsers
        await Tone.start();
        console.log('Tone.js audio context started successfully');
        
        // Set up better audio quality options
        if (toneContext) {
          toneContext.latencyHint = 'balanced';
        }
        
        // Double check that the context is actually running
        if (toneContext && toneContext.state !== 'running') {
          console.warn('Audio context still not running after initialization');
          alert('Please click or tap on the page to enable audio playback');
          return false;
        }
        
        this.isInitialized = true;
        
        // Create a test oscillator to verify audio is working
        try {
          const testOsc = new (Tone as any).Oscillator().toDestination();
          testOsc.volume.value = -20; // Quiet test tone
          testOsc.frequency.value = 440;
          testOsc.start();
          setTimeout(() => {
            testOsc.stop();
            testOsc.dispose();
          }, 300);
          console.log('Test tone played successfully');
        } catch (testError) {
          console.warn('Test tone failed:', testError);
        }
      } catch (error) {
        console.warn('Error initializing audio:', error);
        return false;
      }
    }
    
    return true;
  }

  setInstrument(instrumentType: string) {
    // Clean up previous synth
    if (this.synth) {
      this.synth.disconnect();
      
      // Try to dispose if the method exists
      if (typeof this.synth.dispose === 'function') {
        try {
          this.synth.dispose();
        } catch (error) {
          console.warn('Error disposing synth:', error);
        }
      }
    }

    this.currentInstrument = instrumentType;

    try {
      // Create the selected synth type with better settings
      switch (instrumentType) {
        case 'am-synth':
          this.synth = new Tone.AMSynth();
          break;
        case 'fm-synth':
          this.synth = new Tone.FMSynth();
          break;
        case 'membrane':
          this.synth = new Tone.MembraneSynth();
          break;
        case 'metal':
          this.synth = new Tone.MetalSynth();
          break;
        default:
          this.synth = new Tone.PolySynth();
      }
      
      // Apply better settings for less static
      if (this.synth.oscillator && typeof this.synth.oscillator.type === 'string') {
        // Use triangle waves for smoother sound
        this.synth.oscillator.type = 'triangle';
      }
      
      // Adjust envelope for cleaner sound
      if (this.synth.envelope) {
        this.synth.envelope.attack = 0.02;
        this.synth.envelope.release = 0.8;
      }
      
      // Reduce harsh sounds
      if (instrumentType === 'fm-synth' && this.synth.modulationIndex) {
        this.synth.modulationIndex.value = 5; // Lower value for less harsh sound
      }
      
      if (instrumentType === 'metal' && this.synth.octaves) {
        this.synth.octaves = 1.5; // Lower value for less harsh sound
      }
    } catch (error) {
      console.warn('Error creating synth:', error);
      // Fall back to basic synth
      this.synth = new Tone.PolySynth();
    }

    // Reconnect to effects
    this.connectEffects();
    
    // Apply current volume
    this.setVolume(this.currentVolume);
  }

  // Set the stylus type which affects sound characteristics
  setStylus(stylusType: string) {
    this.currentStylus = stylusType;
    
    try {
      // Disconnect and dispose old effects
      if (this.reverb) {
        this.reverb.disconnect();
        if (typeof this.reverb.dispose === 'function') {
          this.reverb.dispose();
        }
      }
      
      if (this.delay) {
        this.delay.disconnect();
        if (typeof this.delay.dispose === 'function') {
          this.delay.dispose();
        }
      }
      
      // Configure effects based on stylus type
      switch (stylusType) {
        case 'brush':
          // Soft attack with more reverb
          this.reverb = new Tone.Reverb(2.0).toDestination();
          this.delay = new Tone.FeedbackDelay(0.2, 0.15).toDestination();
          if (this.reverb.wet) this.reverb.wet.value = 0.4;
          if (this.delay.wet) this.delay.wet.value = 0.2;
          break;
        case 'pencil':
          // Sharp, detailed sound
          this.reverb = new Tone.Reverb(0.6).toDestination();
          this.delay = new Tone.FeedbackDelay(0.1, 0.05).toDestination();
          if (this.reverb.wet) this.reverb.wet.value = 0.2;
          if (this.delay.wet) this.delay.wet.value = 0.1;
          break;
        case 'marker':
          // Bold, sustained sound
          this.reverb = new Tone.Reverb(1.2).toDestination();
          this.delay = new Tone.FeedbackDelay(0.15, 0.1).toDestination();
          if (this.reverb.wet) this.reverb.wet.value = 0.3;
          if (this.delay.wet) this.delay.wet.value = 0.15;
          break;
        case 'watercolor':
          // Flowing, blended tones
          this.reverb = new Tone.Reverb(3.0).toDestination();
          this.delay = new Tone.FeedbackDelay(0.3, 0.25).toDestination();
          if (this.reverb.wet) this.reverb.wet.value = 0.5;
          if (this.delay.wet) this.delay.wet.value = 0.3;
          break;
        default:
          // Default pen - clean sound
          this.reverb = new Tone.Reverb(1.0).toDestination();
          this.delay = new Tone.FeedbackDelay(0.2, 0.1).toDestination();
          if (this.reverb.wet) this.reverb.wet.value = 0.3;
          if (this.delay.wet) this.delay.wet.value = 0.2;
      }
      
      // Reconnect effects with new settings
      this.connectEffects();
    } catch (error) {
      console.error('Error setting stylus effects:', error);
      
      // Fall back to basic effects
      try {
        this.reverb = new Tone.Reverb(1.0).toDestination();
        this.delay = new Tone.FeedbackDelay(0.2, 0.1).toDestination();
        if (this.reverb.wet) this.reverb.wet.value = 0.3;
        if (this.delay.wet) this.delay.wet.value = 0.2;
        this.connectEffects();
      } catch (fallbackError) {
        console.error('Failed to set fallback effects:', fallbackError);
      }
    }
  }

  // Connect all effects in the chain with current settings
  private connectEffects() {
    try {
      // Disconnect existing connections
      if (this.synth) this.synth.disconnect();
      if (this.volume) this.volume.disconnect();
      if (this.reverb) this.reverb.disconnect();
      if (this.delay) this.delay.disconnect();
      
      // Recreate volume node if needed
      if (!this.volume) {
        this.volume = new (Tone as any).Volume(-3).toDestination();
      }
      
      // Connect through the volume node
      this.synth.connect(this.volume);
      this.volume.connect(this.reverb);
      this.volume.connect(this.delay);
      
      // Also connect directly for cleaner sound with less effects
      this.volume.toDestination();
    } catch (error) {
      console.warn('Error connecting effects:', error);
      // Fall back to direct connection
      try {
        this.synth.disconnect();
        this.synth.toDestination();
      } catch (fallbackError) {
        console.error('Failed to connect directly:', fallbackError);
      }
    }
  }

  // Set the volume based on a 0-100 scale
  setVolume(volumeLevel: number) {
    // Store the current volume setting
    this.currentVolume = volumeLevel;
    
    try {
      // Set volume using the volume node
      if (this.volume) {
        const dbValue = Math.log10(Math.max(0.01, volumeLevel / 100)) * 20; // Convert to dB scale
        this.volume.volume.value = dbValue;
      } else if (this.synth && 'volume' in this.synth) {
        // Fallback for synths with volume property
        this.synth.volume.value = Math.log10(Math.max(0.01, volumeLevel / 100)) * 20;
      }
    } catch (err) {
      console.error('Error setting volume:', err);
    }
  }

  // Set the playback speed (0.5 = half speed, 2 = double speed)
  setPlaybackSpeed(speed: number) {
    this.playbackSpeed = speed;
    
    // If currently playing, adjust the Tone.Transport timeScale
    if (this.playing) {
      try {
        // Transport has a timeScale property
        (Tone.Transport as any).timeScale = speed;
      } catch (error) {
        console.warn('Error setting timeScale:', error);
      }
    }
  }

  // Register a callback for when playback ends
  setPlaybackEndCallback(callback: () => void) {
    this.onPlaybackEnd = callback;
  }

  // Set whether playback should loop
  setLoopPlayback(loop: boolean) {
    this.loopPlayback = loop;
  }

  // Set current playback position manually (for timeline seeking)
  setPlaybackPosition(seconds: number) {
    // Ensure position is valid and positive
    this.currentPosition = Math.max(0, Math.min(seconds, this.totalDuration));
    
    // If playing, restart from new position
    if (this.playing) {
      try {
        this.stop();
        this.play(this.currentPosition);
      } catch (error) {
        console.warn('Error setting playback position:', error);
        // Reset playback state if something goes wrong
        this.playing = false;
        if (this.onPlaybackEnd) {
          this.onPlaybackEnd();
        }
      }
    }
  }

  // Get current playback position in seconds
  getPlaybackPosition(): number {
    if (!this.playing) {
      return this.currentPosition;
    }
    
    const now = Date.now();
    const elapsed = (now - this.startTime) / 1000; // Convert to seconds
    return Math.min(this.currentPosition + elapsed, this.totalDuration);
  }

  // Get current playback progress (0-1)
  getProgress(): number {
    return this.getPlaybackPosition() / this.totalDuration;
  }

  addStroke(stroke: Stroke) {
    this.strokes.push(stroke);
    
    // Recalculate the total duration when strokes are added
    this.calculateTotalDuration();
    
    // If we're playing, trigger sounds as we draw
    if (this.playing) {
      this.playStrokeInRealTime(stroke);
    }
  }

  // Calculate the total duration based on the timing of all strokes
  private calculateTotalDuration() {
    if (this.strokes.length === 0) {
      this.totalDuration = 120; // Default to 2 minutes if no strokes
      return;
    }
    
    let minTime = Number.MAX_VALUE;
    let maxTime = 0;
    let longestNoteDuration = 0;
    
    // Find the earliest and latest time points across all strokes
    this.strokes.forEach(stroke => {
      stroke.points.forEach((point, i) => {
        minTime = Math.min(minTime, point.time);
        maxTime = Math.max(maxTime, point.time);
        
        // Calculate maximum note duration for the last point in each stroke
        if (i === stroke.points.length - 1) {
          const duration = this.mapSpeedToDuration(point.speed);
          const durationSeconds = this.getDurationInSeconds(duration);
          longestNoteDuration = Math.max(longestNoteDuration, durationSeconds);
        }
      });
    });
    
    // Calculate duration in seconds with buffer for the longest note to finish playing
    const durationMs = maxTime - minTime;
    // Add longest note duration + extra buffer (minimum 5 seconds)
    const calculatedDuration = (durationMs / 1000) + Math.max(5, longestNoteDuration + 2);
    
    // Cap at 2 minutes maximum
    this.totalDuration = Math.min(calculatedDuration, 120);
    
    console.log(`Duration calculated: ${this.totalDuration} seconds (raw: ${durationMs/1000}s, longest note: ${longestNoteDuration}s)`);
  }

  // Map canvas coordinates to musical values
  private mapXToNote(x: number, canvasWidth: number): string {
    // Create a pentatonic scale (can be adjusted based on preferences)
    const notes = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'];
    const index = Math.floor((x / canvasWidth) * notes.length);
    return notes[Math.min(index, notes.length - 1)];
  }

  private mapYToVelocity(y: number, canvasHeight: number): number {
    // Invert Y because canvas Y grows downward, but we want higher = more velocity
    return 0.2 + 0.8 * (1 - (y / canvasHeight));
  }

  private mapSpeedToDuration(speed: number | undefined): string {
    if (speed === undefined) return '8n';
    
    // Very fast = short notes, slow = longer notes
    if (speed > 20) return '16n';
    if (speed > 10) return '8n';
    if (speed > 5) return '4n';
    return '2n';
  }

  // Get the duration of a note in seconds
  private getDurationInSeconds(duration: string): number {
    // Convert note durations to seconds based on current BPM
    let bpm = 120; // Default to 120 BPM
    
    try {
      // Get BPM from Tone.Transport if available
      const transportBpm = (Tone.Transport as any).bpm;
      if (transportBpm && typeof transportBpm.value === 'number') {
        bpm = transportBpm.value;
      }
    } catch (error) {
      console.warn('Error getting BPM:', error);
    }
    
    const secondsPerBeat = 60 / bpm;
    
    switch (duration) {
      case '1n': return secondsPerBeat * 4; // whole note
      case '2n': return secondsPerBeat * 2; // half note
      case '4n': return secondsPerBeat; // quarter note
      case '8n': return secondsPerBeat / 2; // eighth note
      case '16n': return secondsPerBeat / 4; // sixteenth note
      default: return secondsPerBeat; // default to quarter note
    }
  }

  // Apply stylus effects to a note
  private applyStylusToNote(note: string, stylus?: string): string {
    // Use stroke's stylus or current stylus setting
    const currentStylus = stylus || this.currentStylus;
    
    switch(currentStylus) {
      case 'brush':
        // Brush adds slight detune
        return note;
      case 'pencil':
        // Pencil might add higher octave notes
        return note.replace(/(\d)/, (match) => {
          const num = parseInt(match);
          return (Math.random() > 0.7) ? (num + 1).toString() : match;
        });
      case 'marker':
        // Marker adds lower notes for richness
        return note;
      case 'watercolor':
        // Watercolor adds chord-like qualities
        return note;
      default:
        return note;
    }
  }

  playStrokeInRealTime(stroke: Stroke) {
    if (!this.isInitialized || stroke.points.length === 0) return;
    
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    const strokeStylus = stroke.stylus;
    
    // Process all stroke points at once for better scheduling
    const noteEvents = [];
    
    for (let i = 0; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      let note = this.mapXToNote(point.x, canvasWidth);
      note = this.applyStylusToNote(note, strokeStylus);
      const velocity = this.mapYToVelocity(point.y, canvasHeight);
      
      // Calculate time difference from the first point
      const timeSinceStart = i === 0 ? 0 : (point.time - stroke.points[0].time) / 1000; // Convert to seconds
      
      // For efficiency, reduce points for smoother performance
      if (i === 0 || i === stroke.points.length - 1 || i % 3 === 0) {
        noteEvents.push({
          note,
          velocity,
          time: timeSinceStart
        });
      }
    }
    
    // Schedule all notes
    noteEvents.forEach(event => {
      try {
        this.synth.triggerAttackRelease(
          event.note,
          '8n',
          Tone.now() + event.time,
          event.velocity
        );
      } catch (error) {
        console.warn('Error playing note in real-time:', error);
      }
    });
  }

  // Method that can be called directly from a user interaction (click/touch) to enable audio
  async manualInitialize(): Promise<boolean> {
    try {
      // Try to resume the audio context from suspended state
      const toneContext = (Tone as any).context;
      if (toneContext && toneContext.state === 'suspended') {
        console.log('Manually resuming audio context from user interaction');
        await toneContext.resume();
      }
      
      // Start Tone.js
      await Tone.start();
      
      // Play a silent note to verify audio is working
      this.synth.triggerAttackRelease('C4', 0.01, undefined, 0.01);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to manually initialize audio:', error);
      return false;
    }
  }

  // Modified to handle cases where sound isn't working
  async play(startPositionSeconds: number = 0) {
    if (this.strokes.length === 0) {
      console.warn('No strokes to play');
      return;
    }
    
    // Ensure startPositionSeconds is not negative
    startPositionSeconds = Math.max(0, startPositionSeconds);
    
    // Try to initialize the audio context first
    const success = await this.initialize();
    if (!success) {
      console.warn('Failed to initialize audio. Trying manual initialization...');
      const manualSuccess = await this.manualInitialize();
      if (!manualSuccess) {
        console.error('Audio initialization failed. Sound may not work.');
        alert('Unable to initialize audio. Try clicking somewhere on the page first.');
        return;
      }
    }
    
    // Cancel any previous sequences and timeouts
    if (this.sequence) {
      try {
        if (typeof this.sequence.dispose === 'function') {
          this.sequence.dispose();
        } else {
          this.sequence.stop();
        }
      } catch (error) {
        console.warn('Error disposing sequence:', error);
      }
    }
    
    if (this.autoEndTimeout !== null) {
      clearTimeout(this.autoEndTimeout);
      this.autoEndTimeout = null;
    }

    try {
      Tone.Transport.cancel();
    } catch (error) {
      console.warn('Error canceling transport:', error);
    }
    
    // Set transport timeScale based on playback speed
    try {
      (Tone.Transport as any).timeScale = this.playbackSpeed;
    } catch (error) {
      console.warn('Error setting timeScale:', error);
    }
    
    // Store the current position
    this.currentPosition = startPositionSeconds;
    
    // Prepare all points from all strokes
    const allPoints: (StrokePoint & { note: string, velocity: number, duration: string, stylus?: string })[] = [];
    
    // Get canvas dimensions
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    
    // Process all strokes
    this.strokes.forEach(stroke => {
      // Get stylus for this stroke
      const strokeStylus = stroke.stylus;
      
      stroke.points.forEach((point, i) => {
        // Calculate speed if not present
        if (point.speed === undefined && i > 0) {
          const prevPoint = stroke.points[i - 1];
          const dx = point.x - prevPoint.x;
          const dy = point.y - prevPoint.y;
          const dt = point.time - prevPoint.time;
          // Avoid division by zero
          point.speed = dt > 0 ? Math.sqrt(dx * dx + dy * dy) / dt : 0;
        }
        
        // Get base note from position
        let note = this.mapXToNote(point.x, canvasWidth);
        
        // Apply stylus effect to note
        note = this.applyStylusToNote(note, strokeStylus);
        
        allPoints.push({
          ...point,
          note,
          velocity: this.mapYToVelocity(point.y, canvasHeight),
          duration: this.mapSpeedToDuration(point.speed),
          stylus: strokeStylus
        });
      });
    });
    
    // Sort by time
    allPoints.sort((a, b) => a.time - b.time);
    
    if (allPoints.length === 0) {
      console.warn("No points to play");
      return;
    }
    
    // Find the time range of the points
    const firstTime = allPoints[0].time;
    const lastTime = allPoints[allPoints.length - 1].time;
    const timeSpan = Math.max(1, (lastTime - firstTime) / 1000); // in seconds
    
    console.log(`Points time span: ${timeSpan} seconds, count: ${allPoints.length}`);
    
    // Create a sequence of events
    const events = allPoints.map(point => {
      return (time: number) => {
        try {
          // Set stylus for this note if it exists
          if (point.stylus) {
            this.setStylus(point.stylus);
          }
          
          this.synth.triggerAttackRelease(point.note, point.duration, time, point.velocity);
        } catch (error) {
          console.warn('Error triggering note:', error);
        }
      };
    });
    
    // Calculate time interval (can be adjusted for playback speed)
    const interval = '16n';
    
    // Create sequence
    try {
      this.sequence = new Tone.Sequence(
        (time: number, idx: number) => {
          if (events[idx]) {
            events[idx](time);
          }
        },
        events.map((_, i) => i),
        interval
      );
    } catch (error) {
      console.error('Failed to create sequence:', error);
      if (this.onPlaybackEnd) {
        this.onPlaybackEnd();
      }
      return;
    }
    
    // Set up progress tracking with current timestamp
    this.startTime = Date.now();
    
    // Recalculate the total duration based on strokes, limited to 2 minutes
    this.calculateTotalDuration();
    
    // Set up auto-stop after the total duration
    const remainingDuration = this.totalDuration - startPositionSeconds;
    console.log(`Setting timeout for ${remainingDuration} seconds`);
    
    this.autoEndTimeout = window.setTimeout(() => {
      if (this.playing) {
        console.log("Ending playback after timeout");
        if (this.loopPlayback) {
          this.stop();
          this.play(0); // Restart from beginning if looping
        } else {
          this.stop();
          if (this.onPlaybackEnd) {
            this.onPlaybackEnd();
          }
        }
      }
    }, remainingDuration * 1000) as unknown as number;
    
    // Start playback
    try {
      this.sequence.start(0);
      Tone.Transport.start();
      this.playing = true;
      console.log("Playback started");
    } catch (error) {
      console.warn('Error starting playback:', error);
      this.playing = false;
      
      // Try to recover
      this.stop();
      
      if (this.onPlaybackEnd) {
        this.onPlaybackEnd();
      }
    }
  }

  stop() {
    if (this.sequence) {
      try {
        // Use null instead of timestamp to avoid potential negative values
        this.sequence.stop();
      } catch (error) {
        console.warn('Error stopping sequence:', error);
      }
    }
    
    if (this.autoEndTimeout !== null) {
      clearTimeout(this.autoEndTimeout);
      this.autoEndTimeout = null;
    }
    
    // Store current position for potential resume
    if (this.playing) {
      const now = Date.now();
      const elapsed = (now - this.startTime) / 1000;
      this.currentPosition = Math.min(this.currentPosition + elapsed, this.totalDuration);
    }
    
    try {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    } catch (error) {
      console.warn('Error stopping transport:', error);
    }
    
    this.playing = false;
  }

  clearStrokes() {
    this.strokes = [];
    
    if (this.sequence) {
      try {
        if (typeof this.sequence.dispose === 'function') {
          this.sequence.dispose();
        } else {
          this.sequence.stop();
        }
        this.sequence = null;
      } catch (error) {
        console.warn('Error disposing sequence:', error);
      }
    }
    
    if (this.autoEndTimeout !== null) {
      clearTimeout(this.autoEndTimeout);
      this.autoEndTimeout = null;
    }
    
    this.currentPosition = 0;
  }

  // Utility method to test if audio is working
  async testAudio(): Promise<{success: boolean; message: string}> {
    try {
      // First check if audio context is available and running
      const toneContext = (Tone as any).context;
      if (!toneContext) {
        return {
          success: false,
          message: 'No audio context available'
        };
      }
      
      // Try to resume if suspended
      if (toneContext.state === 'suspended') {
        try {
          await toneContext.resume();
          await Tone.start();
        } catch (resumeError) {
          return {
            success: false,
            message: 'Failed to resume audio context. User interaction required.'
          };
        }
      }
      
      // Check state after resume attempt
      if (toneContext.state !== 'running') {
        return {
          success: false,
          message: `Audio context state is "${toneContext.state}". Click or tap on the page to enable audio.`
        };
      }
      
      // Try to play a test tone
      try {
        // Create a temporary synth for testing
        const testSynth = new (Tone as any).Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();
        
        // Set volume very low to avoid startling the user
        testSynth.volume.value = -20;
        
        // Play a quick test tone
        testSynth.triggerAttackRelease('C4', 0.1);
        
        // Clean up
        setTimeout(() => {
          testSynth.dispose();
        }, 500);
        
        return {
          success: true,
          message: 'Audio is working correctly'
        };
      } catch (playError) {
        return {
          success: false,
          message: 'Failed to play test tone: ' + (playError as Error).message
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error testing audio: ' + (error as Error).message
      };
    }
  }

  // Create a button callback that initializes audio when clicked
  // This can be attached to any UI element in the app
  createAudioInitializer(onSuccess?: () => void, onError?: (err: string) => void): () => Promise<void> {
    return async () => {
      try {
        console.log('User interaction detected, initializing audio...');
        const result = await this.testAudio();
        
        if (result.success) {
          console.log('Audio initialized successfully via user interaction');
          if (onSuccess) onSuccess();
        } else {
          console.warn('Audio initialization failed:', result.message);
          if (onError) onError(result.message);
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
        if (onError) onError((error as Error).message || 'Unknown error initializing audio');
      }
    };
  }
}

export default SoundEngine; 