import { motion } from "motion/react";
import LeafMark from "../icons/LeafMark";
import TraditionalSectionDecor from "./TraditionalSectionDecor";
import {
  defaultTransition,
  fadeUp,
  staggerContainer,
  viewportOnce,
} from "../../lib/motion";

/** Multigrain Malt Powder — making videos from the brand YouTube channel. */
export const MALT_MAKING_VIDEOS = [
  {
    id: "b9hk9Eju6gY",
    title: "For Weight Gain",
    url: "https://youtu.be/b9hk9Eju6gY?si=92rOZTTEPDNgtQgj",
  },
  {
    id: "ug2D_cxCK00",
    title: "For Weight Loss",
    url: "https://youtu.be/ug2D_cxCK00?si=Yjktb6SvWshZWEYp",
  },
  {
    id: "1BdRvIOiIwk",
    title: "Normal Making Video",
    url: "https://youtube.com/shorts/1BdRvIOiIwk?si=I9ba4Mls_zJQdUsf",
  },
];

/** Herbal Hair Oil — hair care video. */
export const HAIR_CARE_VIDEOS = [
  {
    id: "AmOF1Yff5xU",
    title: "Hair Care Video",
    url: "https://youtu.be/AmOF1Yff5xU?si=kKs5NO2tMAaeb9cm",
  },
];

function VideoCard({ video }) {
  return (
    <article className="min-w-0 flex-1">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-cream-300 bg-brown-900 shadow-soft">
        <iframe
          src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          loading="lazy"
        />
      </div>
      <h3 className="mt-3 font-display text-base font-semibold text-brown-900 sm:text-lg">
        {video.title}
      </h3>
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-body-sm text-olive-800 underline-offset-2 hover:underline"
      >
        Watch on YouTube
      </a>
    </article>
  );
}

/**
 * Product how-to videos. Multiple videos stay in a single row.
 */
export default function ProductMakingVideos({
  label = "How to Make",
  title = "Malt Making Videos",
  description = "Watch how to prepare Nimma Ashwini Multigrain Malt for weight gain, weight loss, or everyday use.",
  videos = MALT_MAKING_VIDEOS,
}) {
  if (!videos?.length) return null;

  const count = videos.length;
  const gridClass =
    count === 1
      ? "mx-auto grid max-w-3xl grid-cols-1 gap-4"
      : count === 2
        ? "grid min-w-[28rem] grid-cols-2 gap-4 lg:min-w-0 lg:gap-5"
        : "grid min-w-[42rem] grid-cols-3 gap-4 lg:min-w-0 lg:gap-5";

  return (
    <section className="product-section-cream relative overflow-hidden border-t border-cream-300/80 section-padding">
      <TraditionalSectionDecor motif="vine" />
      <motion.div
        className="container-ashwini relative"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} transition={defaultTransition}>
          <p className="section-label mb-3 flex items-center gap-2">
            <LeafMark size={14} className="h-3.5 w-3.5 text-olive-600" />
            <span>{label}</span>
          </p>
          <h2 className="font-display text-display-sm text-brown-900 sm:text-display-md">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 max-w-2xl text-body-sm text-brown-600 sm:text-body">
              {description}
            </p>
          ) : null}
        </motion.div>

        <motion.div
          className="mt-8 overflow-x-auto pb-1"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.06 }}
        >
          <div className={gridClass}>
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
