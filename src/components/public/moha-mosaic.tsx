"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type MosaicTile = {
  id: number;
  left: number;
  top: number;
  width: number;
  height: number;
  driftX: number;
  driftY: number;
  rotate: number;
  label: string;
};

const mosaicTiles: MosaicTile[] = [
  {
    id: 1,
    left: 2,
    top: 1,
    width: 25,
    height: 27,
    driftX: -28,
    driftY: -24,
    rotate: -6,
    label: "Soft glam",
  },
  {
    id: 2,
    left: 4,
    top: 33,
    width: 25,
    height: 27,
    driftX: -38,
    driftY: 6,
    rotate: 4,
    label: "French tips",
  },
  {
    id: 3,
    left: 7,
    top: 65,
    width: 25,
    height: 27,
    driftX: -25,
    driftY: 28,
    rotate: -5,
    label: "Clean finish",
  },
  {
    id: 4,
    left: 27,
    top: 10,
    width: 22,
    height: 25,
    driftX: -10,
    driftY: -32,
    rotate: 7,
    label: "Chrome",
  },
  {
    id: 5,
    left: 39,
    top: 28,
    width: 22,
    height: 25,
    driftX: 0,
    driftY: -18,
    rotate: -4,
    label: "MOHA",
  },
  {
    id: 6,
    left: 51,
    top: 10,
    width: 22,
    height: 25,
    driftX: 12,
    driftY: -32,
    rotate: 6,
    label: "Nail art",
  },
  {
    id: 7,
    left: 73,
    top: 1,
    width: 25,
    height: 27,
    driftX: 28,
    driftY: -24,
    rotate: 6,
    label: "Acrylic",
  },
  {
    id: 8,
    left: 71,
    top: 33,
    width: 25,
    height: 27,
    driftX: 38,
    driftY: 6,
    rotate: -4,
    label: "Pedicure",
  },
  {
    id: 9,
    left: 68,
    top: 65,
    width: 25,
    height: 27,
    driftX: 25,
    driftY: 28,
    rotate: 5,
    label: "Your set",
  },
];

export function MohaMosaic({ images }: { images: string[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let frame = 0;

    const updateScrollProgress = () => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const nextProgress = Math.min(
          1,
          Math.max(0, (window.scrollY - 80) / 620),
        );

        setScrollProgress(nextProgress);
      });
    };

    updateScrollProgress();

    window.addEventListener("scroll", updateScrollProgress, {
      passive: true,
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrollProgress);
    };
  }, []);

  function handlePointerMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = rootRef.current?.getBoundingClientRect();

    if (!rect) return;

    setPointer({
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    });
  }

  function resetPointer() {
    setPointer({ x: 0, y: 0 });
  }

  return (
    <div
      ref={rootRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPointer}
      className="relative mx-auto aspect-[4/5] w-full max-w-[560px] select-none"
    >
      <div className="absolute inset-[11%] rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#2a1720] via-[#151217] to-[#0d0c0e] blur-[1px]" />

      <div className="absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0d0c0e]/85 text-[#d97b98] shadow-2xl backdrop-blur">
        <Sparkles className="h-7 w-7" />
      </div>

      {mosaicTiles.map((tile, index) => {
        const image = images.length ? images[index % images.length] : null;

        const direction = index % 2 === 0 ? 1 : -1;
        const parallaxX = pointer.x * direction * (index + 5);
        const parallaxY = pointer.y * direction * (index + 3);

        const translateX = tile.driftX * scrollProgress + parallaxX;
        const translateY = tile.driftY * scrollProgress + parallaxY;
        const rotation = tile.rotate * scrollProgress;

        return (
          <div
            key={tile.id}
            className="absolute z-10"
            style={{
              left: `${tile.left}%`,
              top: `${tile.top}%`,
              width: `${tile.width}%`,
              height: `${tile.height}%`,
              transform: `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotation}deg)`,
              transition: "transform 180ms ease-out",
            }}
          >
            <div
              className="moha-tile-inner group relative h-full w-full overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#171218] shadow-[0_20px_45px_rgba(0,0,0,0.34)]"
              style={{
                animationDelay: `${index * 90}ms`,
              }}
            >
              {image ? (
                <Image
                  src={image}
                  alt={`${tile.label} nail set by MOHA`}
                  fill
                  sizes="(max-width: 768px) 30vw, 180px"
                  className="object-cover transition duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,123,152,0.8),transparent_33%),radial-gradient(circle_at_75%_72%,rgba(215,176,122,0.55),transparent_38%),linear-gradient(145deg,#3d1f2b,#171218_64%)]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />

              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/65">
                  MOHA
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {tile.label}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
