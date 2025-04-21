import { useRef, useState, useEffect, useCallback } from 'react';
import SoundEngine, { Stroke, StrokePoint } from '../components/SoundEngine';
import { calculateSpeed } from '../utils/mapDrawingToSound';

interface UseCanvasOptions {
  strokeColor: string;
  strokeWidth: number;
  instrument: string;
  isPlaying: boolean;
  volume?: number;
  onProgressChange?: (progress: number) => void;
  stylus?: string;
  onPlaybackEnd?: () => void;
  playbackSpeed?: number;
  loopPlayback?: boolean;
  timelinePosition?: number;
  onTimelinePositionChange?: (position: number) => void;
}

export default function useCanvas(options: UseCanvasOptions) {
  const { 
    strokeColor, 
    strokeWidth, 
    instrument, 
    isPlaying, 
    volume = 0, 
    onProgressChange, 
    stylus = 'default', 
    onPlaybackEnd,
    playbackSpeed = 1,
    loopPlayback = false,
    timelinePosition = 0,
    onTimelinePositionChange
  } = options;
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const soundEngineRef = useRef<SoundEngine | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0);
  const currentStrokeRef = useRef<Stroke | null>(null);
  
  // Configure canvas based on stylus
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    // Reset canvas style
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    
    // Apply stylus-specific settings
    switch(stylus) {
      case 'brush':
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 5;
        ctx.globalAlpha = 0.7;
        break;
      case 'pencil':
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'bevel';
        // Add some pattern or texture for pencil
        ctx.lineWidth = Math.max(strokeWidth * 0.7, 1); // Thinner than regular
        break;
      case 'marker':
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 2;
        ctx.lineWidth = strokeWidth * 1.5; // Thicker than regular
        break;
      case 'watercolor':
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.6;
        break;
      default: // default pen
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        break;
    }
  }, [stylus, strokeColor, strokeWidth]);
  
  // Initialize SoundEngine
  useEffect(() => {
    if (!soundEngineRef.current) {
      soundEngineRef.current = new SoundEngine();
    }
    
    // Initialize sound engine when component mounts
    soundEngineRef.current.initialize();
    
    return () => {
      // Clean up if needed
    };
  }, []);
  
  // Handle instrument changes
  useEffect(() => {
    if (soundEngineRef.current) {
      soundEngineRef.current.setInstrument(instrument);
    }
  }, [instrument]);
  
  // Update sound engine with stylus
  useEffect(() => {
    if (soundEngineRef.current) {
      soundEngineRef.current.setStylus(stylus);
    }
  }, [stylus]);
  
  // Handle volume changes
  useEffect(() => {
    if (soundEngineRef.current) {
      soundEngineRef.current.setVolume(volume);
    }
  }, [volume]);
  
  // Handle playback speed changes
  useEffect(() => {
    if (soundEngineRef.current) {
      soundEngineRef.current.setPlaybackSpeed(playbackSpeed);
    }
  }, [playbackSpeed]);
  
  // Handle loop setting changes
  useEffect(() => {
    if (soundEngineRef.current) {
      soundEngineRef.current.setLoopPlayback(loopPlayback);
    }
  }, [loopPlayback]);
  
  // Handle timeline position changes from outside
  useEffect(() => {
    if (soundEngineRef.current && !isDrawing) {
      soundEngineRef.current.setPlaybackPosition(timelinePosition);
      setCurrentTimePosition(timelinePosition);
    }
  }, [timelinePosition, isDrawing]);
  
  // Handle play/pause
  useEffect(() => {
    if (!soundEngineRef.current) return;
    
    if (isPlaying) {
      soundEngineRef.current.play(currentTimePosition);
      
      // Set up the playback end callback
      soundEngineRef.current.setPlaybackEndCallback(() => {
        if (!loopPlayback) {
          setProgress(0);
          setCurrentTimePosition(0);
          if (onProgressChange) {
            onProgressChange(0);
          }
          if (onTimelinePositionChange) {
            onTimelinePositionChange(0);
          }
          if (onPlaybackEnd) {
            onPlaybackEnd();
          }
        }
      });
      
      // Set up progress tracking
      const updateProgress = () => {
        if (soundEngineRef.current) {
          const currentProgress = soundEngineRef.current.getProgress();
          setProgress(currentProgress);
          
          // Update timeline position
          const position = soundEngineRef.current.getPlaybackPosition();
          setCurrentTimePosition(position);
          
          if (onProgressChange) {
            onProgressChange(currentProgress);
          }
          
          if (onTimelinePositionChange) {
            onTimelinePositionChange(position);
          }
          
          if (isPlaying) {
            requestAnimationFrame(updateProgress);
          }
        }
      };
      
      requestAnimationFrame(updateProgress);
    } else {
      soundEngineRef.current.stop();
      // Don't reset progress or position when pausing
      // This allows resuming from the same position
    }
  }, [isPlaying, onProgressChange, onPlaybackEnd, loopPlayback, onTimelinePositionChange, currentTimePosition]);
  
  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions to match parent with proper scaling
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Get the display size of the canvas
        const rect = parent.getBoundingClientRect();
        
        // Set the canvas size to match its CSS size
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Account for device pixel ratio for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        if (dpr !== 1) {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(dpr, dpr);
          }
        }
        
        // Redraw all strokes on resize
        drawAllStrokes();
      }
    };
    
    // Initial resize
    resizeCanvas();
    
    // Listen for window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Set up the context
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctxRef.current = ctx;
    }
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  // Function to get correct mouse/touch coordinates relative to canvas
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | TouchEvent | MouseEvent): { x: number, y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    // Get canvas bounding rect
    const rect = canvas.getBoundingClientRect();
    
    // Get the device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    
    let x: number, y: number;
    
    // Handle touch events
    if ('touches' in e) {
      const touch = e.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      // Handle mouse events
      x = (e as MouseEvent).clientX - rect.left;
      y = (e as MouseEvent).clientY - rect.top;
    }
    
    // Account for CSS scaling if the canvas is displayed at a different size than its internal dimensions
    return { 
      x: x, 
      y: y 
    };
  };
  
  // Redraw all strokes
  const drawAllStrokes = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    
    // Draw all stored strokes
    strokes.forEach(stroke => {
      if (stroke.points.length === 0) return;
      
      // Set stroke style
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      
      // Apply stylus effect if stored in the stroke
      if (stroke.stylus) {
        // Reset canvas style
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        
        switch(stroke.stylus) {
          case 'brush':
            ctx.shadowColor = stroke.color;
            ctx.shadowBlur = 5;
            ctx.globalAlpha = 0.7;
            break;
          case 'pencil':
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'bevel';
            ctx.lineWidth = Math.max(stroke.width * 0.7, 1);
            break;
          case 'marker':
            ctx.lineCap = 'square';
            ctx.lineJoin = 'miter';
            ctx.shadowColor = stroke.color;
            ctx.shadowBlur = 2;
            ctx.lineWidth = stroke.width * 1.5;
            break;
          case 'watercolor':
            ctx.shadowColor = stroke.color;
            ctx.shadowBlur = 12;
            ctx.globalAlpha = 0.6;
            break;
          default: // default pen
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
            break;
        }
      }
      
      // Draw the stroke points
      for (let i = 1; i < stroke.points.length; i++) {
        const currentPoint = stroke.points[i];
        const prevPoint = stroke.points[i-1];
        
        if (stroke.stylus === 'brush') {
          ctx.lineWidth = stroke.width * (0.8 + Math.random() * 0.4);
          ctx.beginPath();
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(currentPoint.x, currentPoint.y);
          ctx.stroke();
        } else if (stroke.stylus === 'pencil') {
          // For pencil, create a more sketchy appearance
          for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.moveTo(
              prevPoint.x + (Math.random() - 0.5) * 1.5, 
              prevPoint.y + (Math.random() - 0.5) * 1.5
            );
            ctx.lineTo(
              currentPoint.x + (Math.random() - 0.5) * 1.5, 
              currentPoint.y + (Math.random() - 0.5) * 1.5
            );
            ctx.stroke();
          }
        } else if (stroke.stylus === 'watercolor') {
          const gradient = ctx.createLinearGradient(prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y);
          gradient.addColorStop(0, stroke.color);
          gradient.addColorStop(1, stroke.color + '99');
          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(currentPoint.x, currentPoint.y);
          ctx.stroke();
          ctx.strokeStyle = stroke.color;
        } else {
          ctx.beginPath();
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(currentPoint.x, currentPoint.y);
          ctx.stroke();
        }
      }
      
      // Reset for next stroke
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    });
  }, [strokes]);
  
  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    
    // Get the starting point coordinates
    const { x, y } = getCoordinates(e);
    
    // Create a new stroke with stylus info
    const newStroke: Stroke = {
      points: [{ x, y, time: Date.now() }],
      color: strokeColor,
      width: strokeWidth,
      stylus: stylus
    };
    
    currentStrokeRef.current = newStroke;
    
    // Start drawing on the canvas
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.moveTo(x, y);
    }
  }, [strokeColor, strokeWidth, stylus, getCoordinates]);
  
  // Draw
  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    // Get the current point coordinates
    const { x, y } = getCoordinates(e);
    
    // Create a new point
    const currentStroke = currentStrokeRef.current;
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    const newPoint: StrokePoint = { x, y, time: Date.now() };
    
    // Calculate speed if we have at least one previous point
    if (currentStroke.points.length > 0) {
      newPoint.speed = calculateSpeed(lastPoint, newPoint);
    }
    
    // Apply stylus-specific drawing techniques
    switch(stylus) {
      case 'brush':
        // For brush, create a soft, textured stroke
        ctx.lineWidth = strokeWidth * (0.8 + Math.random() * 0.4); // Vary width slightly
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
      case 'pencil':
        // For pencil, create a more sketchy appearance
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(
            lastPoint.x + (Math.random() - 0.5) * 1.5, 
            lastPoint.y + (Math.random() - 0.5) * 1.5
          );
          ctx.lineTo(
            x + (Math.random() - 0.5) * 1.5, 
            y + (Math.random() - 0.5) * 1.5
          );
          ctx.stroke();
        }
        break;
      case 'watercolor':
        // For watercolor, create a blended, soft effect
        const gradient = ctx.createLinearGradient(lastPoint.x, lastPoint.y, x, y);
        gradient.addColorStop(0, strokeColor);
        gradient.addColorStop(1, strokeColor + '99'); // Add slight transparency
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        // Reset to original color
        ctx.strokeStyle = strokeColor;
        break;
      default:
        // Default drawing method for pen and marker
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    
    // Add the point to our current stroke
    currentStroke.points.push(newPoint);
  }, [isDrawing, getCoordinates, strokeColor, strokeWidth, stylus]);
  
  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentStrokeRef.current) return;
    
    setIsDrawing(false);
    
    // Add the current stroke to our strokes array
    const currentStroke = currentStrokeRef.current;
    setStrokes(prevStrokes => [...prevStrokes, currentStroke]);
    
    // Pass the stroke to the sound engine
    if (soundEngineRef.current) {
      soundEngineRef.current.addStroke(currentStroke);
    }
    
    // Reset current stroke
    currentStrokeRef.current = null;
    
    // Reset canvas context for next stroke
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    }
  }, [isDrawing]);
  
  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    setStrokes([]);
    
    // Clear strokes in sound engine
    if (soundEngineRef.current) {
      soundEngineRef.current.clearStrokes();
    }
  }, []);
  
  return {
    canvasRef,
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    progress,
    currentTimePosition,
    setTimelinePosition: (pos: number) => {
      if (soundEngineRef.current) {
        soundEngineRef.current.setPlaybackPosition(pos);
        setCurrentTimePosition(pos);
      }
    }
  };
} 