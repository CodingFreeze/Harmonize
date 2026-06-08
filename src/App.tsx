import React, { useState, useRef, useEffect } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';

const App: React.FC = () => {
  const [instrument, setInstrument] = useState<string>('synth');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [strokeColor, setStrokeColor] = useState<string>('#38bdf8'); // Default color
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(50); // Default volume (middle of range 0-100)
  const [fluctuateVolume, setFluctuateVolume] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [selectedStylus, setSelectedStylus] = useState<string>('default');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // Default speed (1x)
  const [loopPlayback, setLoopPlayback] = useState<boolean>(false); // Default: no looping
  const [timelinePosition, setTimelinePosition] = useState<number>(0); // Position in seconds
  
  // Reference to the clearCanvas function provided by Canvas component
  const clearCanvasRef = useRef<() => void>(() => {});

  // Handle volume fluctuation with time limit (2 minutes)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (fluctuateVolume && isPlaying) {
      let direction = 1; // 1 = up, -1 = down
      
      interval = setInterval(() => {
        setVolume(prevVolume => {
          let newVolume = prevVolume + direction;
          
          // Change direction when reaching limits
          if (newVolume >= 100) {
            direction = -1;
            return 100;
          } else if (newVolume <= 0) {
            direction = 1;
            return 0;
          }
          
          return newVolume;
        });
      }, 100); // Adjust every 100ms
      
      // Set a timeout to stop fluctuation after 2 minutes
      timeoutId = setTimeout(() => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        setFluctuateVolume(false);
      }, 2 * 60 * 1000); // 2 minutes
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fluctuateVolume, isPlaying]);

  const handleClearCanvas = () => {
    // Call the clearCanvas function from the Canvas component
    clearCanvasRef.current();
  };

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Handler for when playback ends
  const handlePlaybackEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen app-shell flex flex-col">
      <header className="sticky top-0 z-20 py-4 px-6 flex items-center justify-between border-b border-[var(--hairline)] bg-[var(--surface-0)]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400/25 to-secondary-500/20 ring-1 ring-primary-400/30 shadow-[0_4px_18px_-6px_rgba(56,189,248,0.5)]">
            <svg className="w-5 h-5 text-primary-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </span>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-primary-200 to-secondary-300 bg-clip-text text-transparent">
            HarMonize
          </h1>
        </div>
        <div className="hidden sm:block text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
          Draw to create music
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1">
        <Toolbar
          instrument={instrument}
          setInstrument={setInstrument}
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          onClear={handleClearCanvas}
          volume={volume}
          setVolume={setVolume}
          showInstructions={showInstructions}
          setShowInstructions={setShowInstructions}
          fluctuateVolume={fluctuateVolume}
          setFluctuateVolume={setFluctuateVolume}
          selectedStylus={selectedStylus}
          setSelectedStylus={setSelectedStylus}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
          loopPlayback={loopPlayback}
          setLoopPlayback={setLoopPlayback}
        />
        
        <main className="flex-1 p-4">
          <Canvas
            instrument={instrument}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onClearRequest={handleClearCanvas}
            setClearCanvasRef={clearCanvasRef}
            volume={volume}
            showInstructions={showInstructions}
            setShowInstructions={setShowInstructions}
            playbackProgress={playbackProgress}
            setPlaybackProgress={setPlaybackProgress}
            selectedStylus={selectedStylus}
            onPlaybackEnd={handlePlaybackEnd}
            playbackSpeed={playbackSpeed}
            loopPlayback={loopPlayback}
            timelinePosition={timelinePosition}
            setTimelinePosition={setTimelinePosition}
          />
        </main>
      </div>
    </div>
  );
};

export default App; 