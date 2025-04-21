import React, { useState, useEffect } from 'react';
import SoundEngine from './SoundEngine';

interface AudioInitializerProps {
  soundEngine: SoundEngine;
  onInitialized?: () => void;
}

const AudioInitializer: React.FC<AudioInitializerProps> = ({ soundEngine, onInitialized }) => {
  const [audioState, setAudioState] = useState<'unknown' | 'initializing' | 'success' | 'error'>('unknown');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    // Check audio status on mount
    const checkAudio = async () => {
      try {
        const result = await soundEngine.testAudio();
        if (result.success) {
          setAudioState('success');
          if (onInitialized) onInitialized();
        } else {
          setAudioState('error');
          setErrorMessage(result.message);
        }
      } catch (error) {
        setAudioState('error');
        setErrorMessage((error as Error).message || 'Unknown error checking audio');
      }
    };
    
    checkAudio();
  }, [soundEngine, onInitialized]);
  
  const handleInitializeClick = soundEngine.createAudioInitializer(
    // Success callback
    () => {
      setAudioState('success');
      if (onInitialized) onInitialized();
    },
    // Error callback
    (err) => {
      setAudioState('error');
      setErrorMessage(err);
    }
  );
  
  if (audioState === 'success') {
    return null; // Don't show anything if audio is working
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: audioState === 'error' ? '#ffeeee' : '#eeffee',
      padding: '10px 20px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      zIndex: 1000,
      maxWidth: '90%',
      textAlign: 'center'
    }}>
      {audioState === 'error' ? (
        <div>
          <p style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>
            <strong>Audio not available</strong>
          </p>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.9em' }}>{errorMessage}</p>
          <button 
            onClick={handleInitializeClick}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Enable Sound
          </button>
        </div>
      ) : (
        <div>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong>Click to enable audio</strong>
          </p>
          <button 
            onClick={handleInitializeClick}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Enable Sound
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioInitializer; 