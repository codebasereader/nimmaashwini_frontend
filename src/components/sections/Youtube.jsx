import { useState } from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import LeafMark from "../icons/LeafMark";
import { iconProps } from "../../lib/icons";

import {
  defaultTransition,
  fadeUp,
  scaleIn,
  staggerContainer,
  viewportOnce,
} from "../../lib/motion";

const MAIN_VIDEO_ID = "7gSw5YUHZdo";

const MORE_VIDEOS = [
  { id: "r7zTqmSDdOU", label: "Ashwini story video 1" },
  { id: "QPUGVJfYhv4", label: "Ashwini story video 2" },
  { id: "vKD4zjloZ40", label: "Ashwini story video 3" },
];

const ALL_VIDEOS = [
  { id: MAIN_VIDEO_ID, label: "Featured Nimma Ashwini video" },
  ...MORE_VIDEOS,
];

function SectionDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto mt-4 flex max-w-xs items-center gap-3 sm:mt-5"
    >
      <span className="h-px flex-1 bg-linear-to-r from-transparent via-olive-600/70 to-olive-600/30" />
      <LeafMark className="h-3.5 w-3.5 text-olive-600" size={14} />
      <span className="h-px flex-1 bg-linear-to-l from-transparent via-olive-600/70 to-olive-600/30" />
    </div>
  );
}

function PlayIcon({ className = "h-10 w-10" }) {
  return <Play {...iconProps(40)} className={`fill-current ${className}`} />;
}

function VideoPlayer({ videoId, title }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-cream-300 bg-brown-900 shadow-[0_20px_50px_-24px_rgb(58_53_48_/_0.45)]">
      <iframe
        key={videoId}
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

function VideoThumbnail({ video, isActive, isFeatured = false, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(video.id)}
      aria-label={`Play ${video.label}`}
      aria-pressed={isActive}
      className={`group focus-ring relative overflow-hidden rounded-xl border bg-brown-900 text-left transition-all duration-300 ${
        isActive
          ? "border-olive-600 ring-2 ring-olive-600/35 shadow-md"
          : "border-cream-300 hover:border-olive-500/60 hover:shadow-sm"
      }`}
    >
      <div className="relative aspect-video">
        <img
          src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-linear-to-t from-brown-950/55 via-brown-900/15 to-transparent" />
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            isActive ? "opacity-100" : "opacity-90 group-hover:opacity-100"
          }`}
        >
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-md transition-colors sm:h-12 sm:w-12 ${
              isActive
                ? "bg-olive-700 text-cream-100"
                : "bg-cream-100/95 text-olive-800 group-hover:bg-gold-200"
            }`}
          >
            <PlayIcon className="h-4 w-4 translate-x-0.5 sm:h-5 sm:w-5" />
          </span>
        </div>
        {isFeatured && !isActive ? (
          <span className="absolute top-2 left-2 rounded-full bg-gold-500/95 px-2 py-0.5 text-[0.6rem] font-semibold tracking-wide text-brown-950 uppercase">
            Featured
          </span>
        ) : null}
        {isActive ? (
          <span className="absolute top-2 left-2 rounded-full bg-olive-700 px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wide text-cream-100 uppercase">
            Now Playing
          </span>
        ) : null}
      </div>
    </button>
  );
}

export default function Youtube() {
  const [activeVideoId, setActiveVideoId] = useState(MAIN_VIDEO_ID);

  const activeVideo =
    ALL_VIDEOS.find((video) => video.id === activeVideoId) ?? ALL_VIDEOS[0];

  return (
    <section id="videos" className="relative overflow-hidden bg-cream-100 section-padding">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-olive-300/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-gold-300/10 blur-3xl"
      />

      <div className="container-ashwini relative">
        <motion.header
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.p
            className="section-label mb-4 flex items-center justify-center gap-2 sm:mb-5"
            variants={fadeUp}
            transition={defaultTransition}
          >
            <LeafMark />
            <span>Our Channel</span>
            <LeafMark />
          </motion.p>

          <motion.h2
            className="text-display-sm sm:text-display-md text-balance text-brown-900"
            variants={fadeUp}
            transition={defaultTransition}
          >
            Stories from Nimma Ashwini
          </motion.h2>

          <motion.div variants={fadeUp} transition={defaultTransition}>
            <SectionDivider />
          </motion.div>

          <motion.p
            className="mt-5 text-body-sm text-brown-600 sm:text-body"
            variants={fadeUp}
            transition={defaultTransition}
          >
            Watch how tradition, natural ingredients, and Natural care come
            together in every Nimma Ashwini product.
          </motion.p>
        </motion.header>

        <motion.div
          className="mx-auto max-w-5xl"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div variants={scaleIn} transition={defaultTransition}>
            <VideoPlayer
              videoId={activeVideoId}
              title={activeVideo.label}
            />
          </motion.div>

          <motion.div
            className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4"
            variants={staggerContainer}
          >
            {ALL_VIDEOS.map((video) => (
              <motion.div
                key={video.id}
                variants={scaleIn}
                transition={defaultTransition}
              >
                <VideoThumbnail
                  video={video}
                  isActive={video.id === activeVideoId}
                  onSelect={setActiveVideoId}
                  isFeatured={video.id === MAIN_VIDEO_ID}
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            className="mt-6 text-center text-body-sm text-brown-500"
            variants={fadeUp}
            transition={defaultTransition}
          >
            <a
              href="https://www.youtube.com/@nimmaashwini09/videos"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring font-medium text-olive-700 underline decoration-olive-600/30 underline-offset-4 transition-colors hover:text-olive-800 hover:decoration-olive-700/50"
            >
              View more on YouTube
            </a>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
