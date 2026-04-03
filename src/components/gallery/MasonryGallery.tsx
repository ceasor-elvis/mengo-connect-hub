import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import { useDrag } from "@use-gesture/react";

interface GalleryItem {
  id: string;
  url: string;
  caption?: string;
}

interface MasonryGalleryProps {
  images: GalleryItem[];
}

export const MasonryGallery: React.FC<MasonryGalleryProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  // 3D rotation values
  const rotateX = useMotionValue(-18);
  const rotateY = useMotionValue(15);
  const springX = useSpring(rotateX, { stiffness: 80, damping: 25 });
  const springY = useSpring(rotateY, { stiffness: 80, damping: 25 });

  const bind = useDrag(
    ({ delta: [dx, dy] }) => {
      rotateY.set(rotateY.get() + dx * 0.3);
      rotateX.set(Math.min(Math.max(rotateX.get() - dy * 0.3, -40), 10));
    },
    { pointer: { touch: true } }
  );

  // Build a grid — repeat images if fewer than needed
  const gridSize = 36; // 6x6
  const cols = 6;
  const gridImages: GalleryItem[] = [];
  for (let i = 0; i < gridSize; i++) {
    gridImages.push(images[i % images.length]);
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-primary">
            Live Preview
          </p>
          <h3 className="text-lg font-bold text-foreground">Event Gallery</h3>
        </div>
        <div className="bg-muted border rounded-full px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
          Drag to rotate
        </div>
      </div>

      {/* 3D Tilted Grid */}
      <div
        className="relative w-full h-[500px] sm:h-[600px] overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ perspective: "1200px" }}
        {...bind()}
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            rotateX: springX,
            rotateY: springY,
            transformStyle: "preserve-3d",
          }}
        >
          {/* The tilted grid plane */}
          <div
            className="grid gap-3 sm:gap-4"
            style={{
              gridTemplateColumns: `repeat(${cols}, 120px)`,
              gridAutoRows: "120px",
              transform: "rotate(-12deg) scale(1.1)",
            }}
          >
            {gridImages.map((img, i) => {
              const row = Math.floor(i / cols);
              const col = i % cols;
              // Slight random-looking rotation per card
              const tilt = ((row + col) % 3 - 1) * 3;

              return (
                <motion.div
                  key={`${img.id}-${i}`}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02, duration: 0.4 }}
                  whileHover={{ scale: 1.15, zIndex: 20, rotate: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(img);
                  }}
                  className="relative overflow-hidden rounded-2xl border-2 border-white/30 shadow-lg cursor-pointer group"
                  style={{ transform: `rotate(${tilt}deg)` }}
                >
                  <img
                    src={img.url}
                    alt={img.caption || "Gallery"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    draggable={false}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Soft edge fade */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-transparent to-card/80" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card via-transparent to-card" />
      </div>

      {/* Bottom text */}
      <p className="text-xs text-muted-foreground px-6 pb-4">
        Click any image to enlarge.
      </p>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </motion.button>

            <motion.img
              key={selectedImage.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              src={selectedImage.url}
              alt={selectedImage.caption || "Gallery image"}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {selectedImage.caption && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-8 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm"
              >
                {selectedImage.caption}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
