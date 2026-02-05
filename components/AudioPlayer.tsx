import React, { useEffect, useState, useRef } from 'react';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | null;
  audioContext: AudioContext | null;
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBuffer, audioContext, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0); // When the current playback segment started (AC time)
  const pausedAtRef = useRef<number>(0); // How far into the buffer we are (seconds)
  const animationFrameRef = useRef<number>(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Cleanup on unmount or when buffer changes
  useEffect(() => {
    return () => {
      stop();
      if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioBuffer]);

  const play = async () => {
    if (!audioBuffer || !audioContext) return;

    // Handle Autoplay Policy
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (err) {
        console.error("Failed to resume AudioContext:", err);
        return;
      }
    }

    // Create a new source node (nodes are one-time use)
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    // Start playing from the paused position
    // Ensure offset is within bounds
    let offset = pausedAtRef.current;
    if (offset >= audioBuffer.duration) offset = 0;

    source.start(0, offset);
    
    sourceRef.current = source;
    // Calculate the "start time" relative to AudioContext time
    startTimeRef.current = audioContext.currentTime - offset;
    
    source.onended = () => {
        // Check if we reached the end naturally vs stopped manually
        // We allow a small tolerance (0.1s) for floating point timing differences
        if (isPlaying && Math.abs(audioContext.currentTime - startTimeRef.current - audioBuffer.duration) < 0.2) {
             setIsPlaying(false);
             pausedAtRef.current = 0;
             setProgress(0);
             setCurrentTime(0);
             if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    };

    setIsPlaying(true);
    updateProgress();
  };

  const pause = () => {
    if (sourceRef.current && audioContext) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sourceRef.current.disconnect();
      // Calculate where we were when we paused
      pausedAtRef.current = audioContext.currentTime - startTimeRef.current;
      sourceRef.current = null;
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const stop = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) { /* ignore */ }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setIsPlaying(false);
    pausedAtRef.current = 0;
    setProgress(0);
    setCurrentTime(0);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioBuffer || !progressBarRef.current || !audioContext) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const seekTime = percentage * audioBuffer.duration;

    // Update state
    pausedAtRef.current = seekTime;
    setCurrentTime(seekTime);
    setProgress(percentage * 100);

    // If currently playing, restart source at new time
    if (isPlaying) {
       if (sourceRef.current) {
         try { sourceRef.current.stop(); } catch(e){}
         sourceRef.current.disconnect();
       }
       
       const source = audioContext.createBufferSource();
       source.buffer = audioBuffer;
       source.connect(audioContext.destination);
       source.start(0, seekTime);
       sourceRef.current = source;
       startTimeRef.current = audioContext.currentTime - seekTime;
       
       source.onended = () => {
         if (Math.abs(audioContext.currentTime - startTimeRef.current - audioBuffer.duration) < 0.1) {
             setIsPlaying(false);
             pausedAtRef.current = 0;
             setProgress(0);
             setCurrentTime(0);
             if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
       };
    }
  };

  const updateProgress = () => {
    if (!audioBuffer || !audioContext) return;
    
    // If playing, calculate from context time. If paused, use pausedAtRef.
    let current = 0;
    if (isPlaying) {
      current = audioContext.currentTime - startTimeRef.current;
    } else {
      current = pausedAtRef.current;
    }

    const duration = audioBuffer.duration;
    
    // Clamp
    if (current > duration) current = duration;
    if (current < 0) current = 0;
    
    setCurrentTime(current);
    setProgress((current / duration) * 100);
    
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 bg-slate-800 border border-slate-700 p-3 rounded-xl animate-in slide-in-from-top-2 shadow-2xl w-full max-w-md ring-1 ring-white/10">
       <button 
        onClick={isPlaying ? pause : play}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-all shadow-lg shadow-blue-600/20 active:scale-95"
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>

      <div className="flex-1 space-y-1.5 select-none">
        <div className="flex justify-between text-[10px] font-mono text-slate-400 font-medium">
          <span>{formatTime(currentTime)}</span>
          <span>{audioBuffer ? formatTime(audioBuffer.duration) : '0:00'}</span>
        </div>
        <div 
            ref={progressBarRef}
            onClick={seek}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full bg-slate-700 h-2 rounded-full overflow-hidden cursor-pointer group relative"
        >
          <div 
            className="bg-blue-500 h-full transition-all duration-75 ease-linear group-hover:bg-blue-400" 
            style={{ width: `${progress}%` }}
          >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-sm transform translate-x-1/2"></div>
          </div>
        </div>
      </div>

      <button onClick={onClose} aria-label="Close Audio Player" className="text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-700 rounded-lg transition-colors">
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};

export default AudioPlayer;