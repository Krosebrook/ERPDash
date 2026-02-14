import React from 'react';

interface VideoResultProps {
  videoUrl: string;
  onClose: () => void;
}

const VideoResult: React.FC<VideoResultProps> = ({ videoUrl, onClose }) => {
  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 animate-in zoom-in-95">
      <video 
        src={videoUrl} 
        controls 
        autoPlay 
        loop
        className="w-full h-full object-cover"
      />
      <div className="absolute top-4 left-4 flex gap-2">
         <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20">
            VEO-3.1 GENERATED
         </div>
      </div>
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};

export default VideoResult;
