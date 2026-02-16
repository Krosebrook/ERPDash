
import React, { useEffect, useRef, useState } from 'react';
import { LiveSessionService } from '../services/liveSessionService';
import { Agent } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  navigate: (view: string) => void;
  metrics: any;
  agents: Agent[];
}

const LiveSessionOverlay: React.FC<Props> = ({ isOpen, onClose, navigate, metrics, agents }) => {
  const [status, setStatus] = useState<'connecting' | 'active' | 'error'>('connecting');
  const [volume, setVolume] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const serviceRef = useRef<LiveSessionService | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const init = async () => {
        try {
          setStatus('connecting');
          const service = new LiveSessionService();
          
          service.bindActions(
            navigate,
            () => metrics,
            () => agents
          );

          service.onVolumeUpdate = (vol) => setVolume(vol);

          await service.connect();
          serviceRef.current = service;
          setStatus('active');
        } catch (e) {
          console.error(e);
          setStatus('error');
        }
      };
      init();
    } else {
      stopCamera();
      serviceRef.current?.disconnect();
      serviceRef.current = null;
    }

    return () => {
      stopCamera();
      serviceRef.current?.disconnect();
    };
  }, [isOpen]);

  const toggleCamera = async () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        
        // Start sending frames
        frameIntervalRef.current = window.setInterval(captureAndSendFrame, 1000); // 1 FPS
      }
    } catch (e) {
      console.error("Failed to start camera", e);
    }
  };

  const stopCamera = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureAndSendFrame = () => {
    if (!videoRef.current || !serviceRef.current || !isCameraActive) return;
    
    // Create a temporary canvas for frame capture
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      if (base64) {
        serviceRef.current.sendVideoFrame(base64);
      }
    }
  };

  // Audio Visualizer Loop
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const draw = () => {
      if (!canvasRef.current) return;
      const { width, height } = canvasRef.current;
      ctx.clearRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Base circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 50 + volume * 100, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // Blue-500
      ctx.fill();

      // Inner Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40 + volume * 50, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();

      // Orbital Rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const radius = 60 + (i * 20) + (Math.sin(phase + i) * 10) + (volume * 50);
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      phase += 0.05;
      animId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, volume]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
      
      {/* Hidden Video Element for Capture */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full border border-slate-800">
          <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            {status === 'active' ? 'Gemini Live Session' : 'Establishing Uplink...'}
          </span>
        </div>
      </div>

      {/* Main Visualizer / Camera Feed */}
      <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
        {isCameraActive ? (
             <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-blue-500/50 shadow-[0_0_100px_rgba(59,130,246,0.3)] animate-in zoom-in">
                  {/* Create a live mirror using canvas to crop to circle if needed, or simple video styling */}
                  <video 
                     ref={(el) => {
                         if (el && videoRef.current && videoRef.current.srcObject) {
                             el.srcObject = videoRef.current.srcObject;
                             el.play();
                         }
                     }} 
                     className="w-full h-full object-cover transform scale-x-[-1]" 
                     muted 
                  />
                  {/* Overlay Visualizer on top of video? Optional. Keeping it separate for now. */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-full border-[20px] border-blue-500/10 rounded-full"></div>
                  </div>
             </div>
        ) : (
             <canvas ref={canvasRef} width={600} height={600} className="w-full h-full" />
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-32 text-center space-y-2">
        <h3 className="text-2xl font-bold text-white">{isCameraActive ? 'Watching...' : 'Listening...'}</h3>
        <p className="text-slate-400">"Navigate to Cost"</p>
        <p className="text-slate-400">"What do you see?"</p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 flex gap-6">
        <button 
          onClick={toggleCamera}
          className={`p-4 rounded-full transition-all border ${isCameraActive ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.4)]' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
        >
          {isCameraActive ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          )}
        </button>
        
        <button 
          onClick={onClose}
          className="p-4 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-full transition-all border border-red-500/50"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};

export default LiveSessionOverlay;
