import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { iconProps } from "../../lib/icons";
import { springSnappy } from "../../lib/motion";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function ZoomLightbox({
  images,
  activeIndex,
  alt,
  onClose,
  onChangeIndex,
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const stageRef = useRef(null);
  const image = images[activeIndex];
  const canNavigate = images.length > 1;

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetView();
  }, [activeIndex, resetView]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (event) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        setZoom((current) => clamp(current + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
      } else {
        setZoom((current) => {
          const next = clamp(current - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
          if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
          return next;
        });
      }
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && canNavigate) {
        onChangeIndex((activeIndex - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight" && canNavigate) {
        onChangeIndex((activeIndex + 1) % images.length);
      }
      if (event.key === "+" || event.key === "=") {
        setZoom((current) => clamp(current + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
      }
      if (event.key === "-") {
        setZoom((current) => {
          const next = clamp(current - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
          if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
          return next;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, canNavigate, images.length, onChangeIndex, onClose]);

  const zoomIn = () =>
    setZoom((current) => clamp(current + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));

  const zoomOut = () =>
    setZoom((current) => {
      const next = clamp(current - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
      return next;
    });

  const handlePointerDown = (event) => {
    if (zoom <= MIN_ZOOM) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current || zoom <= MIN_ZOOM) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setOffset({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    });
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  };

  return (
    <motion.div
      className="fixed inset-0 z-[var(--z-lightbox)] flex flex-col bg-brown-950/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label="Product image zoom"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="text-body-sm text-cream-200">
          {activeIndex + 1} / {images.length}
          <span className="ml-3 tabular-nums text-cream-300">
            {Math.round(zoom * 100)}%
          </span>
        </p>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-cream-300/40 bg-cream-50/10 text-cream-100 transition-colors hover:bg-cream-50/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ZoomOut {...iconProps(18)} />
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-cream-300/40 bg-cream-50/10 text-cream-100 transition-colors hover:bg-cream-50/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ZoomIn {...iconProps(18)} />
          </button>
          <button
            type="button"
            aria-label="Reset zoom"
            onClick={resetView}
            className="focus-ring hidden h-10 items-center rounded-full border border-cream-300/40 bg-cream-50/10 px-3 text-caption font-semibold tracking-wider text-cream-100 uppercase transition-colors hover:bg-cream-50/20 sm:inline-flex"
          >
            Reset
          </button>
          <button
            type="button"
            aria-label="Close zoom view"
            onClick={onClose}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-cream-300/40 bg-cream-50/10 text-cream-100 transition-colors hover:bg-cream-50/20"
          >
            <X {...iconProps(18)} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-4 sm:px-10">
        {canNavigate ? (
          <button
            type="button"
            aria-label="Previous image"
            onClick={() =>
              onChangeIndex((activeIndex - 1 + images.length) % images.length)
            }
            className="focus-ring absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-cream-300/40 bg-cream-50/10 text-cream-100 transition-colors hover:bg-cream-50/20 sm:left-4"
          >
            <ChevronLeft {...iconProps(22)} />
          </button>
        ) : null}

        <div
          ref={stageRef}
          className={`relative flex h-full w-full max-w-5xl items-center justify-center overflow-hidden rounded-2xl bg-cream-50/5 ${
            zoom > MIN_ZOOM ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={() => {
            if (zoom > MIN_ZOOM) resetView();
            else setZoom(2);
          }}
        >
          <motion.img
            src={image}
            alt={alt}
            draggable={false}
            className="max-h-[min(78vh,52rem)] max-w-full select-none object-contain p-4 sm:p-6"
            animate={{ scale: zoom, x: offset.x, y: offset.y }}
            transition={{ duration: 0.15 }}
          />
        </div>

        {canNavigate ? (
          <button
            type="button"
            aria-label="Next image"
            onClick={() => onChangeIndex((activeIndex + 1) % images.length)}
            className="focus-ring absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-cream-300/40 bg-cream-50/10 text-cream-100 transition-colors hover:bg-cream-50/20 sm:right-4"
          >
            <ChevronRight {...iconProps(22)} />
          </button>
        ) : null}
      </div>

      {canNavigate ? (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-5">
          {images.map((thumb, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={thumb}
                type="button"
                aria-label={`View image ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => onChangeIndex(index)}
                className={`focus-ring shrink-0 overflow-hidden rounded-lg border-2 bg-cream-50 p-1 transition-colors ${
                  isActive
                    ? "border-gold-400"
                    : "border-cream-300/50 hover:border-cream-200"
                }`}
              >
                <img
                  src={thumb}
                  alt=""
                  className="h-12 w-12 object-contain sm:h-14 sm:w-14"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </motion.div>
  );
}

export default function ProductImageGallery({ images = [], alt }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images.length) {
    return (
      <div className="product-gallery-main flex aspect-square items-center justify-center rounded-2xl border border-cream-300 bg-cream-50 text-body-sm text-brown-400">
        No image
      </div>
    );
  }

  const openLightbox = (index = activeIndex) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        {images.length > 1 && (
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible">
            {images.map((image, index) => {
              const isActive = index === activeIndex;
              return (
                <motion.button
                  key={image}
                  type="button"
                  aria-label={`View image ${index + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setActiveIndex(index)}
                  className={`focus-ring overflow-hidden rounded-lg border-2 bg-cream-50 p-1.5 transition-colors ${
                    isActive
                      ? "border-olive-700"
                      : "border-cream-300 hover:border-olive-400"
                  }`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={springSnappy}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-14 w-14 object-contain sm:h-16 sm:w-16"
                  />
                </motion.button>
              );
            })}
          </div>
        )}

        <div className="order-1 flex-1 sm:order-2">
          <motion.div
            key={images[activeIndex]}
            className="product-gallery-main relative overflow-hidden rounded-2xl border border-cream-300 bg-cream-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button
              type="button"
              aria-label="Open image zoom"
              onClick={() => openLightbox(activeIndex)}
              className="focus-ring group relative block w-full cursor-zoom-in"
            >
              <img
                src={images[activeIndex]}
                alt={alt}
                className="aspect-square w-full object-contain p-6 sm:p-8"
              />
              <span className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full border border-cream-300 bg-cream-50/95 px-3 py-1.5 text-caption font-semibold tracking-wider text-brown-800 uppercase shadow-soft transition-opacity sm:opacity-90 group-hover:opacity-100">
                <ZoomIn {...iconProps(14)} />
                Zoom
              </span>
            </button>
          </motion.div>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {lightboxOpen ? (
            <ZoomLightbox
              images={images}
              activeIndex={activeIndex}
              alt={alt}
              onClose={() => setLightboxOpen(false)}
              onChangeIndex={setActiveIndex}
            />
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
