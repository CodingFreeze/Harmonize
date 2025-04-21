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
      <div className="bg-gray-900 rounded-lg overflow-hidden flex-1 border border-gray-700 shadow-xl relative">
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
        <div className="absolute top-2 right-2 px-2 py-1 bg-gray-800 bg-opacity-70 rounded text-xs text-gray-300">
          {selectedStylus === 'default' ? 'Default Pen' : 
           selectedStylus === 'brush' ? 'Brush' : 
           selectedStylus === 'pencil' ? 'Pencil' :
           selectedStylus === 'marker' ? 'Marker' : 
           selectedStylus === 'watercolor' ? 'Watercolor' : 'Drawing Tool'}
        </div>
        
        {/* Overlay for instructions */}
        {showInstructions && (
          <div 
            className="absolute inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center"
            style={{ 
              opacity: 0.9,
              transition: 'opacity 0.5s ease-in-out'
            }}
          >
            <div className="text-center p-6 max-w-xl mx-auto">
              <svg className="w-16 h-16 text-primary-400 mx-auto mb-4 animate-pulse-slow" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
              
              <h3 className="text-xl font-bold text-white mb-2">Welcome to HarMonize!</h3>
              <p className="text-gray-300 mb-4">
                Create music by drawing on the canvas. Here's how to use it:
              </p>
              <ul className="text-gray-300 text-left space-y-2 mb-6">
                <li>• Just draw on the canvas to start creating music</li>
                <li>• Draw horizontally to create melody (left = low notes, right = high notes)</li>
                <li>• Draw vertically to change dynamics (top = louder, bottom = softer)</li>
                <li>• Drawing speed affects note duration (faster = shorter notes)</li>
                <li>• Try different stylus types for varied sound textures</li>
                <li>• Adjust volume using the volume slider in the toolbar</li>
                <li>• Use the volume fluctuation button for interesting effects</li>
              </ul>
              <button 
                className="btn btn-primary"
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