"use client";

import { useEffect, useRef, useState } from "react";

const SRC = "/media/hero-teknologi.mp4";
const POSTER = "/media/hero-teknologi-poster.jpg";
/** Slower than the original 5 s clip so the background stays calm. */
const PLAYBACK_RATE = 0.6;
/** Seconds of clip time over which the next copy fades in. */
const CROSSFADE = 0.9;
const VIDEO_CLASS =
  "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out";

/** Whether the background should animate on this device. */
function shouldAnimate(): boolean {
  if (typeof window === "undefined") return false;
  const root = document.documentElement;
  if (root.dataset.reducedMotion === "true") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return false;
  // Phones and data-saver: show the still image only (saves ~1.5 MB).
  if (!window.matchMedia("(min-width: 768px)").matches) return false;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return !connection?.saveData;
}

/**
 * Decorative hero background (Mixkit item 99786, Free License; see
 * public/media/LICENSES.md). Two copies cross-fade so the loop has no jump.
 * Muted, hidden from assistive technology, and never autoplayed when the
 * learner or system asks for reduced motion.
 */
export function HeroVideo() {
  const first = useRef<HTMLVideoElement>(null);
  const second = useRef<HTMLVideoElement>(null);
  const [animate, setAnimate] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const update = () => setAnimate(shouldAnimate());
    update();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const width = window.matchMedia("(min-width: 768px)");
    motion.addEventListener("change", update);
    width.addEventListener("change", update);
    // The profile preference "Kurangi animasi" changes a data attribute.
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduced-motion"],
    });
    return () => {
      motion.removeEventListener("change", update);
      width.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const videos = [first.current, second.current];
    if (!animate) {
      videos.forEach((v) => v?.pause());
      return;
    }
    const current = videos[active];
    const next = videos[1 - active];
    if (!current || !next) return;
    current.playbackRate = PLAYBACK_RATE;
    void current.play().catch(() => setAnimate(false));
    let handedOver = false;
    const onTime = () => {
      if (handedOver || !current.duration) return;
      if (current.duration - current.currentTime <= CROSSFADE) {
        handedOver = true;
        next.currentTime = 0;
        next.playbackRate = PLAYBACK_RATE;
        void next.play().catch(() => undefined);
        setActive(1 - active);
      }
    };
    current.addEventListener("timeupdate", onTime);
    return () => current.removeEventListener("timeupdate", onTime);
  }, [animate, active]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {animate ? (
        <>
          <video
            ref={first}
            src={SRC}
            poster={POSTER}
            muted
            playsInline
            preload="auto"
            tabIndex={-1}
            className={`${VIDEO_CLASS} ${active === 0 ? "opacity-100" : "opacity-0"}`}
          />
          <video
            ref={second}
            src={SRC}
            muted
            playsInline
            preload="auto"
            tabIndex={-1}
            className={`${VIDEO_CLASS} ${active === 1 ? "opacity-100" : "opacity-0"}`}
          />
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={POSTER}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
