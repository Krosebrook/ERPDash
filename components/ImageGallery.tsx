
import React from 'react';

const ImageGallery: React.FC<{ images: string[] }> = ({ images }) => {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {images.map((src, i) => (
        <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
          <img src={src} alt="AI Concept Visualization" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
             <p className="text-[10px] text-white/60 font-mono">GEN_ID: 2.5-FLASH-IMAGE_{i}</p>
          </div>
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = src;
              link.download = `epb-concept-${i}.png`;
              link.click();
            }}
            className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ImageGallery;
