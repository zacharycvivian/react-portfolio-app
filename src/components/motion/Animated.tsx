"use client";
/**
 * Animated — small, reusable Framer Motion wrappers.
 *
 * These are the ONLY pieces that need to run on the client for our scroll-in
 * card animations. By isolating them here, pages like the Home and About routes
 * can stay Server Components: their text/markup is rendered to HTML on the
 * server (better FCP/LCP) and only these thin wrappers hydrate on the client.
 *
 * A Server Component may import and render these directly — the animated
 * `children` are still rendered on the server and passed through as props.
 */
import React from "react";
import { motion } from "framer-motion";

/** Shared fade-in + slight rise/scale used across the site's cards. */
export const fadeInVariant = {
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
  hidden: { opacity: 0, scale: 0.97, y: 32 },
};

/** Viewport config so each element animates once when scrolled into view. */
const viewport = { once: true, margin: "-60px" } as const;

interface WithChildren {
  children: React.ReactNode;
  className?: string;
}

/** Generic animated `div`. Use for card/section containers. */
export function AnimatedDiv({ children, className }: WithChildren) {
  return (
    <motion.div
      className={className}
      variants={fadeInVariant}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
    >
      {children}
    </motion.div>
  );
}

/** Card-shaped animated container (alias of {@link AnimatedDiv} for readability). */
export const AnimatedCard = AnimatedDiv;

/** Animated page title (`h2`). */
export function AnimatedTitle({ children, className }: WithChildren) {
  return (
    <motion.h2
      className={className}
      variants={fadeInVariant}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
    >
      {children}
    </motion.h2>
  );
}

// ─── Staggered "load top-to-bottom" group ────────────────────────────────────
// Mirrors the sidebar's nav reveal: a parent flips hidden→visible when scrolled
// into view, and each child fades in with a delay based on its position, so the
// cards cascade down the page one after another.

const STAGGER_BASE = 0.05; // delay before the first item (seconds)
const STAGGER_STEP = 0.08; // additional delay per item (seconds)

/**
 * Orchestrator for a staggered group. It only propagates the hidden/visible
 * state to its descendant {@link AnimatedItem}s — it has no visual effect of its
 * own — so the items can be nested arbitrarily (e.g. inside the timeline).
 */
export function AnimatedStagger({ children, className }: WithChildren) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: {}, visible: {} }}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
    >
      {children}
    </motion.div>
  );
}

/**
 * A single item within an {@link AnimatedStagger}. Its `index` (0-based, top to
 * bottom) determines how long it waits before fading in. It inherits the
 * hidden/visible state from the nearest AnimatedStagger ancestor.
 */
export function AnimatedItem({
  children,
  className,
  index = 0,
}: WithChildren & { index?: number }) {
  const variants = {
    hidden: { opacity: 0, scale: 0.97, y: 32 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        delay: STAGGER_BASE + index * STAGGER_STEP,
      },
    },
  };
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

/** Animated uppercase section label (`p`). */
export function AnimatedGroupHeader({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <motion.p
      className={className}
      variants={fadeInVariant}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
    >
      {label}
    </motion.p>
  );
}
