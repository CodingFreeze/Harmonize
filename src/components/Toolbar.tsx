import React, { useState } from 'react';

interface ToolbarProps {
  instrument: string;
  setInstrument: (instrument: string) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  onClear: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  showInstructions: boolean;
  setShowInstructions: (show: boolean) => void;
  fluctuateVolume: boolean;
  setFluctuateVolume: (fluctuate: boolean) => void;
  selectedStylus: string;
  setSelectedStylus: (stylus: string) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  loopPlayback: boolean;
  setLoopPlayback: (loop: boolean) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  instrument,
  setInstrument,
  isPlaying,
  onPlayToggle,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  onClear,
  volume,
  setVolume,
  showInstructions,
  setShowInstructions,
  fluctuateVolume,
  setFluctuateVolume,
  selectedStylus,
  setSelectedStylus,
  playbackSpeed,
  setPlaybackSpeed,
  loopPlayback,
  setLoopPlayback,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const instruments = [
    { id: 'synth', name: 'Synth' },
    { id: 'am-synth', name: 'AM Synth' },
    { id: 'fm-synth', name: 'FM Synth' },
    { id: 'membrane', name: 'Membrane' },
    { id: 'metal', name: 'Metal' },
  ];

  const colorOptions = [
    { value: '#38bdf8', label: 'Blue' },
    { value: '#fb7185', label: 'Red' },
    { value: '#34d399', label: 'Green' },
    { value: '#a78bfa', label: 'Purple' },
    { value: '#fbbf24', label: 'Yellow' },
    { value: '#f97316', label: 'Orange' },
    { value: '#0ea5e9', label: 'Sky Blue' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#14b8a6', label: 'Teal' },
    { value: '#f43f5e', label: 'Rose' },
    { value: '#8b5cf6', label: 'Violet' },
    { value: '#10b981', label: 'Emerald' },
  ];

  const stylusOptions = [
    { id: 'default', name: 'Default', description: 'Clean, consistent sound' },
    { id: 'brush', name: 'Brush', description: 'Softer attack, textured sound' },
    { id: 'pencil', name: 'Pencil', description: 'Sharp, detailed notes' },
    { id: 'marker', name: 'Marker', description: 'Bold, sustained notes' },
    { id: 'watercolor', name: 'Watercolor', description: 'Flowing, blended tones' },
  ];

  return (
    <aside className="bg-gray-800 p-4 w-full md:w-64 border-r border-gray-700 flex flex-col gap-6 overflow-y-auto">
      <section>
        <h3 className="text-gray-300 font-semibold mb-2">Controls</h3>
        <div className="flex flex-col gap-2">
          <button 
            className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
            onClick={onPlayToggle}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button className="btn btn-outline" onClick={onClear}>
            Clear Canvas
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-gray-300 font-semibold mb-2">Instrument</h3>
        <select 
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          className="input-control w-full"
        >
          {instruments.map((inst) => (
            <option key={inst.id} value={inst.id}>{inst.name}</option>
          ))}
        </select>
      </section>

      <section>
        <h3 className="text-gray-300 font-semibold mb-2">Volume: {volume}%</h3>
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="1"
          value={volume} 
          onChange={(e) => setVolume(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
        <div className="mt-2">
          <button 
            className={`w-full btn ${fluctuateVolume ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setFluctuateVolume(!fluctuateVolume)}
          >
            {fluctuateVolume ? 'Stop Volume Fluctuation' : 'Fluctuate Volume'}
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-gray-300 font-semibold mb-2">Playback Speed: {playbackSpeed.toFixed(1)}x</h3>
        <input 
          type="range" 
          min="0.1" 
          max="2.0" 
          step="0.1"
          value={playbackSpeed} 
          onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0.1x</span>
          <span>1.0x</span>
          <span>2.0x</span>
        </div>
      </section>

      <section>
        <h3 className="text-gray-300 font-semibold mb-2">Stylus</h3>
        <select 
          value={selectedStylus}
          onChange={(e) => setSelectedStylus(e.target.value)}
          className="input-control w-full mb-2"
        >
          {stylusOptions.map((stylus) => (
            <option key={stylus.id} value={stylus.id}>{stylus.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400">
          {stylusOptions.find(s => s.id === selectedStylus)?.description}
        </p>
      </section>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-gray-300 font-semibold">Stroke Color</h3>
          <button 
            className="text-gray-400 hover:text-white text-sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
          >
            {showColorPicker ? 'Simple View' : 'More Colors'}
          </button>
        </div>

        {showColorPicker ? (
          <div className="grid grid-cols-4 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                className={`h-8 w-8 rounded-full ${
                  strokeColor === color.value ? 'ring-2 ring-white scale-110' : ''
                } transition-all hover:scale-110`}
                style={{ backgroundColor: color.value }}
                onClick={() => setStrokeColor(color.value)}
                title={color.label}
              />
            ))}
            <div className="col-span-4 mt-2">
              <label className="block text-gray-400 text-xs mb-1">Custom Color:</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-full h-8 cursor-pointer rounded bg-gray-700"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {colorOptions.slice(0, 5).map((color) => (
              <button
                key={color.value}
                className={`h-8 w-8 rounded-full ${
                  strokeColor === color.value ? 'ring-2 ring-white' : ''
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => setStrokeColor(color.value)}
                title={color.label}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-gray-300 font-semibold mb-2">Stroke Width: {strokeWidth}px</h3>
        <input 
          type="range" 
          min="1" 
          max="20" 
          value={strokeWidth} 
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
          className="w-full"
        />
      </section>

      <section className="mt-auto">
        <div className="text-gray-400 text-sm">
          <p className="mb-2">Tips:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Draw horizontally for melody</li>
            <li>Draw vertically for dynamics</li>
            <li>Speed affects note duration</li>
            <li>Try different stylus types</li>
          </ul>
          <button 
            className="mt-4 w-full text-primary-400 hover:text-primary-300 border border-gray-700 rounded py-1 px-2 text-center"
            onClick={() => setShowInstructions(true)}
          >
            Show Instructions
          </button>
        </div>
      </section>
    </aside>
  );
};

export default Toolbar; 