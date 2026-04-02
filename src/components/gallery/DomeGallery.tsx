import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useDrag } from '@use-gesture/react';

interface GalleryItem {
  id: string;
  url: string;
  caption?: string;
}

interface DomeGalleryProps {
  images: GalleryItem[];
}

export const DomeGallery: React.FC<DomeGalleryProps> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(400);
  
  // Motion values for rotation
  const rotationY = useMotionValue(0);
  const rotationX = useMotionValue(-10); // Slight tilt

  // Smooth springs for rotation
  const springY = useSpring(rotationY, { stiffness: 100, damping: 30 });
  const springX = useSpring(rotationX, { stiffness: 100, damping: 30 });

  // Handle window resize for radius
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setRadius(250);
      else if (width < 1024) setRadius(350);
      else setRadius(500);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag gesture
  const bind = useDrag(({ delta: [dx, dy] }) => {
    rotationY.set(rotationY.get() + dx * 0.2);
    rotationX.set(Math.min(Math.max(rotationX.get() - dy * 0.2, -30), 10)); // Limit X tilt
  }, { pointer: { touch: true } });

  const angleStep = 360 / Math.max(images.length, 1);

  return (
    <div 
      className="relative flex h-[500px] w-full items-center justify-center overflow-hidden bg-transparent touch-none select-none cursor-grab active:cursor-grabbing"
      {...bind()}
    >
      {/* Instructions Overlay */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <div className="bg-primary/80 text-primary-foreground px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-2">
          <span>Drag to rotate</span>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-[10px] text-muted-foreground font-medium">
        Click any image to enlarge
      </div>

      {/* 3D Scene */}
      <div className="relative perspective-scene">
        <motion.div
          className="relative preserve-3d"
          style={{
            rotateY: springY,
            rotateX: springX,
            transformStyle: 'preserve-3d',
          }}
        >
          {images.map((img, i) => {
            const angle = i * angleStep;
            return (
              <motion.div
                key={img.id}
                className="absolute left-1/2 top-1/2 -ml-16 -mt-24 h-48 w-32 overflow-hidden rounded-2xl border-2 border-white/20 bg-muted shadow-2xl transition-all duration-500 hover:scale-110 hover:border-gold hover:grayscale-0 grayscale"
                style={{
                  transform: `rotateY(var(--rotate-y)) translateZ(var(--translate-z))`,
                  // @ts-ignore
                  '--rotate-y': `${angle}deg`,
                  '--translate-z': `${radius}px`,
                  backfaceVisibility: 'hidden',
                }}
                whileHover={{ y: -10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Enlarge implementation would go here (Dialog/Modal)
                }}
              >
                <img 
                  src={img.url} 
                  alt={img.caption || 'Gallery Image'} 
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {img.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-[8px] text-white backdrop-blur-sm">
                    {img.caption}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Center ambient glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -z-10" />
    </div>
  );
};
