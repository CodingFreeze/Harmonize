import { StrokePoint } from '../components/SoundEngine';

/**
 * Maps X position on the canvas to a musical note
 * 
 * @param x - X position on the canvas
 * @param canvasWidth - Width of the canvas
 * @param scale - Musical scale to use (default: pentatonic)
 * @returns The musical note as a string (e.g., 'C4')
 */
export function mapXToNote(
  x: number, 
  canvasWidth: number, 
  scale: string[] = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5']
): string {
  const index = Math.floor((x / canvasWidth) * scale.length);
  return scale[Math.min(index, scale.length - 1)];
}

/**
 * Maps Y position on the canvas to velocity/volume
 * 
 * @param y - Y position on the canvas
 * @param canvasHeight - Height of the canvas
 * @param minVelocity - Minimum velocity (0.0-1.0)
 * @param maxVelocity - Maximum velocity (0.0-1.0)
 * @returns The velocity as a number between 0.0-1.0
 */
export function mapYToVelocity(
  y: number, 
  canvasHeight: number,
  minVelocity: number = 0.2,
  maxVelocity: number = 1.0
): number {
  // Invert Y because canvas Y grows downward, but we want higher = more velocity
  return minVelocity + (maxVelocity - minVelocity) * (1 - (y / canvasHeight));
}

/**
 * Maps drawing speed to note duration
 * 
 * @param speed - The speed of movement
 * @returns Duration as a note value (e.g., '8n', '4n')
 */
export function mapSpeedToDuration(speed: number | undefined): string {
  if (speed === undefined) return '8n';
  
  // Very fast = short notes, slow = longer notes
  if (speed > 20) return '16n';
  if (speed > 10) return '8n';
  if (speed > 5) return '4n';
  return '2n';
}

/**
 * Calculates the speed between two stroke points
 * 
 * @param p1 - First point
 * @param p2 - Second point
 * @returns The speed value
 */
export function calculateSpeed(p1: StrokePoint, p2: StrokePoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dt = p2.time - p1.time;
  
  // Avoid division by zero
  if (dt === 0) return 0;
  
  return Math.sqrt(dx * dx + dy * dy) / dt;
}

/**
 * Maps stroke color to different sound characteristics
 * 
 * @param color - CSS color string
 * @returns An object with filter and effect settings
 */
export function mapColorToSoundCharacteristics(color: string): { 
  filter: number;
  reverb: number;
  delay: number;
} {
  // This is a simple implementation - could be enhanced with color parsing
  // For now, we'll just use a fixed mapping of common colors
  
  const colorMap: Record<string, { filter: number, reverb: number, delay: number }> = {
    '#38bdf8': { filter: 200, reverb: 0.3, delay: 0.2 },  // Blue
    '#fb7185': { filter: 800, reverb: 0.5, delay: 0.4 },  // Red
    '#34d399': { filter: 400, reverb: 0.2, delay: 0.1 },  // Green
    '#a78bfa': { filter: 600, reverb: 0.6, delay: 0.3 },  // Purple
    '#fbbf24': { filter: 300, reverb: 0.4, delay: 0.2 },  // Yellow
  };
  
  // Return the mapped values or default
  return colorMap[color] || { filter: 500, reverb: 0.3, delay: 0.2 };
} 