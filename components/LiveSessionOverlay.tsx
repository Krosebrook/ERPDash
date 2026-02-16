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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const serviceRef = useRef<LiveSessionService | null>(null);

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
      serviceRef.current?.disconnect();
      serviceRef.current = null;
    }

    return () => {
      serviceRef.current?.disconnect();
    };
  }, [isOpen]);

  // Visualizer Loop
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
      
      {/* Header */}
      <div className="absolute top-8 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full border border-slate-800">
          <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            {status === 'active' ? 'Gemini Live Session' : 'Establishing Uplink...'}
          </span>
        </div>
      </div>

      {/* Visualizer */}
      <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
        <canvas ref={canvasRef} width={600} height={600} className="w-full h-full" />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-20 text-center space-y-2">
        <h3 className="text-2xl font-bold text-white">Listening...</h3>
        <p className="text-slate-400">"Navigate to Cost"</p>
        <p className="text-slate-400">"How is the Finance Copilot doing?"</p>
      </div>

      {/* Controls */}
      <button 
        onClick={onClose}
        className="absolute bottom-8 p-4 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-full transition-all border border-red-500/50"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};

export default LiveSessionOverlay;