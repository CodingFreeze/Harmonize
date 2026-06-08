import React, { useEffect, useRef, MutableRefObject } from 'react';
import useCanvas from '../hooks/useCanvas';

interface CanvasProps {
  instrument: string;
  strokeColor: string;
  strokeWidth: number;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  onClearRequest: () => void;
  setClearCanvasRef: React.MutableRefObject<() => void>;
  volume: number;
  showInstructions: boolean;
  setShowInstructions: (show: boolean) => void;
  playbackProgress: number;
  setPlaybackProgress: (progress: number) => void;
  selectedStylus: string;
  onPlaybackEnd: () => void;
  playbackSpeed: number;
  loopPlayback: boolean;
  timelinePosition: number;
  setTimelinePosition: (position: number) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  instrument,
  strokeColor,
  strokeWidth,
  isPlaying,
  setIsPlaying,
  onClearRequest,
  setClearCanvasRef,
  volume,
  showInstructions,
  setShowInstructions,
  playbackProgress,
  setPlaybackProgress,
  selectedStylus,
  onPlaybackEnd,
  playbackSpeed,
  loopPlayback,
  timelinePosition,
  setTimelinePosition,
}) => {
  const { 
    canvasRef, 
    startDrawing, 
    draw, 
    stopDrawing, 
    clearCanvas,
    progress
  } = useCanvas({
    instrument,
    strokeColor,
    strokeWidth,
    isPlaying,
    volume,
    onProgressChange: setPlaybackProgress,
    stylus: selectedStylus,
    onPlaybackEnd,
    playbackSpeed,
    loopPlayback,
    timelinePosition,
    onTimelinePositionChange: setTimelinePosition
  });

  // Update progress from the hook
  useEffect(() => {
    setPlaybackProgress(progress);
  }, [progress, setPlaybackProgress]);

  // Provide the clearCanvas function to the parent component
  useEffect(() => {
    setClearCanvasRef.current = clearCanvas;
  }, [clearCanvas, setClearCanvasRef]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // Remove auto-start playing when drawing
    
    if (typeof setShowInstructions === 'function' && showInstructions) {
      setShowInstructions(false);
    }
    startDrawing(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    draw(e);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling when drawing
    // Remove auto-start playing when drawing
    
    if (typeof setShowInstructions === 'function' && showInstructions) {
      setShowInstructions(false);
    }
    startDrawing(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling when drawing
    draw(e);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="bg-[var(--surface-0)] rounded-2xl overflow-hidden flex-1 border border-[var(--hairline)] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7),0_0_60px_-30px_rgba(56,189,248,0.25)] relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        />
        
        {/* Stylus indicator */}
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-[var(--surface-2)]/70 backdrop-blur-sm rounded-full text-xs font-medium text-gray-300 border border-[var(--hairline)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          {selectedStylus === 'default' ? 'Default Pen' : 
           selectedStylus === 'brush' ? 'Brush' : 
           selectedStylus === 'pencil' ? 'Pencil' :
           selectedStylus === 'marker' ? 'Marker' : 
           selectedStylus === 'watercolor' ? 'Watercolor' : 'Drawing Tool'}
        </div>
        
        {/* Overlay for instructions */}
        {showInstructions && (
          <div
            className="absolute inset-0 flex items-center justify-center p-4 bg-[var(--surface-0)]/70 backdrop-blur-md"
            style={{ transition: 'opacity 0.5s var(--ease-out)' }}
          >
            <div className="text-center p-8 max-w-xl mx-auto rounded-2xl border border-[var(--hairline)] bg-gradient-to-b from-[var(--surface-2)]/90 to-[var(--surface-1)]/90 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
              <span className="grid place-items-center w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary-400/20 to-secondary-500/20 ring-1 ring-primary-400/30">
                <svg className="w-8 h-8 text-primary-300 animate-pulse-slow" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </span>

              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white via-primary-200 to-secondary-300 bg-clip-text text-transparent">Welcome to HarMonize</h3>
              <p className="text-gray-400 mb-6">
                Create music by drawing on the canvas. Here's how it works:
              </p>
              <ul className="text-gray-300 text-left space-y-2.5 mb-7">
                <li className="flex gap-2.5"><span className="text-primary-400 mt-0.5">›</span> Just draw on the canvas to start creating music</li>
                <li className="flex gap-2.5"><span className="text-primary-400 mt-0.5">›</span> Draw horizontally to create melody (left = low notes, right = high notes)</li>
                <li className="flex gap-2.5"><span className="text-primary-400 mt-0.5">›</span> Draw vertically to change dynamics (top = louder, bottom = softer)</li>
                <li className="flex gap-2.5"><span className="text-primary-400 mt-0.5">›</span> Drawing speed affects note duration (faster = shorter notes)</li>
                <li className="flex gap-2.5"><span className="text-primary-400 mt-0.5">›</span> Try different stylus types for varied sound textures</li>
                <li className="flex gap-2.5"><span className="text-primary-400 mt-0.5">›</span> Adjust volume using the volume slider in the toolbar</li>
                <li className="flex gap-2.5"><span className="text-primary-400 mt-0.5">›</span> Use the volume fluctuation button for interesting effects</li>
              </ul>
              <button
                className="btn btn-primary px-8"
                onClick={() => {
                  if (typeof setShowInstructions === 'function') {
                    setShowInstructions(false);
                  }
                }}
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas; 