"use client";
import React from "react";
import styles from "./about.module.css";
import { motion } from "framer-motion";

const fadeInVariant = {
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 28,
  },
};

const vp = { once: true, margin: "-60px" } as const;

function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className={styles.card}
      variants={fadeInVariant}
      initial="hidden"
      whileInView="visible"
      viewport={vp}
    >
      {children}
    </motion.div>
  );
}

function GroupHeader({ label }: { label: string }) {
  return (
    <motion.p
      className={styles.groupHeader}
      variants={fadeInVariant}
      initial="hidden"
      whileInView="visible"
      viewport={vp}
    >
      {label}
    </motion.p>
  );
}

const AboutPage = () => {
  return (
    <div className={styles.container}>
      <motion.h2
        className={styles.sectionTitle}
        variants={fadeInVariant}
        initial="hidden"
        whileInView="visible"
        viewport={vp}
      >
        About This Website:
      </motion.h2>
      <div className={styles.section}>

        {/* ── Frontend Framework ── */}
        <GroupHeader label="Frontend" />

        <Card>
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg viewBox="0 0 256 228" width="40" height="40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="currentColor">
                <path d="M210.483 73.824a171.49 171.49 0 0 0-8.24-2.597c.465-1.9.893-3.777 1.273-5.621 6.238-30.281 2.16-54.676-11.769-62.708-13.355-7.7-35.196.329-57.254 19.526a171.23 171.23 0 0 0-6.375 5.848 155.866 155.866 0 0 0-4.241-3.917C100.759 3.829 77.587-4.822 63.673 3.233 50.33 10.957 46.379 33.89 51.995 62.588a170.974 170.974 0 0 0 1.892 8.48c-3.28.932-6.445 1.924-9.474 2.98C17.309 83.498 0 98.307 0 113.668c0 15.865 18.582 31.778 46.812 41.427a145.52 145.52 0 0 0 6.921 2.165 167.467 167.467 0 0 0-2.01 9.138c-5.354 28.2-1.173 50.591 12.134 58.266 13.744 7.926 36.812-.22 59.273-19.855a145.567 145.567 0 0 0 5.342-4.923 168.064 168.064 0 0 0 6.92 6.314c21.758 18.722 43.246 26.282 56.54 18.586 13.731-7.949 18.194-32.003 12.4-61.268a145.016 145.016 0 0 0-1.535-6.842c1.62-.48 3.21-.974 4.76-1.488 29.348-9.723 48.443-25.443 48.443-41.52 0-15.417-17.868-30.326-45.517-39.844Zm-6.365 70.984c-1.4.463-2.836.91-4.3 1.345-3.24-10.257-7.612-21.163-12.963-32.432 5.106-11 9.31-21.767 12.459-31.957 2.619.758 5.16 1.557 7.61 2.4 23.69 8.156 38.14 20.213 38.14 29.504 0 9.896-15.606 22.743-40.946 31.14Zm-10.514 20.834c2.562 12.94 2.927 24.64 1.23 33.787-1.524 8.219-4.59 13.698-8.382 15.893-8.067 4.67-25.32-1.4-43.927-17.412a156.726 156.726 0 0 1-6.437-5.87c7.214-7.889 14.423-17.06 21.459-27.246 12.376-1.098 24.068-2.894 34.671-5.345.522 2.107.986 4.173 1.386 6.193ZM87.276 214.515c-7.882 2.783-14.16 2.863-17.955.675-8.075-4.657-11.432-22.636-6.853-46.752a156.923 156.923 0 0 1 1.869-8.499c10.486 2.32 22.093 3.988 34.498 4.994 7.084 9.967 14.501 19.128 21.976 27.15a134.668 134.668 0 0 1-4.877 4.492c-9.933 8.682-19.886 14.842-28.658 17.94ZM50.35 144.747c-12.483-4.267-22.792-9.812-29.858-15.863-6.35-5.437-9.555-10.836-9.555-15.216 0-9.322 13.897-21.212 37.076-29.293 2.813-.98 5.757-1.905 8.812-2.773 3.204 10.42 7.406 21.315 12.477 32.332-5.137 11.18-9.399 22.249-12.634 32.792a134.718 134.718 0 0 1-6.318-1.979Zm12.378-84.26c-4.811-24.587-1.616-43.134 6.425-47.789 8.564-4.958 27.502 2.111 47.463 19.835a144.318 144.318 0 0 1 3.841 3.545c-7.438 7.987-14.787 17.08-21.808 26.988-12.04 1.116-23.565 2.908-34.161 5.309a160.342 160.342 0 0 1-1.76-7.887Zm110.427 27.268a347.8 347.8 0 0 0-7.785-12.803c8.168 1.033 15.994 2.404 23.343 4.08-2.206 7.072-4.956 14.465-8.193 22.045a381.151 381.151 0 0 0-7.365-13.322Zm-45.032-43.861c5.044 5.465 10.096 11.566 15.065 18.186a322.04 322.04 0 0 0-30.257-.006c4.974-6.559 10.069-12.652 15.192-18.18ZM82.802 87.83a323.167 323.167 0 0 0-7.227 13.238c-3.184-7.553-5.909-14.98-8.134-22.152 7.304-1.634 15.093-2.97 23.209-3.984a321.524 321.524 0 0 0-7.848 12.897Zm8.081 65.352c-8.385-.936-16.291-2.203-23.593-3.793 2.26-7.3 5.045-14.885 8.298-22.6a321.187 321.187 0 0 0 7.257 13.246c2.594 4.48 5.28 8.868 8.038 13.147Zm37.542 31.03c-5.184-5.592-10.354-11.779-15.403-18.433 4.902.192 9.899.29 14.978.29 5.218 0 10.376-.117 15.453-.343-4.985 6.774-10.018 12.97-15.028 18.486Zm52.198-57.817c3.422 7.8 6.306 15.345 8.596 22.52-7.422 1.694-15.436 3.058-23.88 4.071a382.417 382.417 0 0 0 7.859-13.026 347.403 347.403 0 0 0 7.425-13.565Zm-16.898 8.101a358.557 358.557 0 0 1-12.281 19.815 329.4 329.4 0 0 1-23.444.823c-7.967 0-15.716-.248-23.178-.732a310.202 310.202 0 0 1-12.513-19.846h.001a307.41 307.41 0 0 1-10.923-20.627 310.278 310.278 0 0 1 10.89-20.637l-.001.001a307.318 307.318 0 0 1 12.413-19.761c7.613-.576 15.42-.876 23.31-.876H128c7.926 0 15.743.303 23.354.883a329.357 329.357 0 0 1 12.335 19.695 358.489 358.489 0 0 1 11.036 20.54 329.472 329.472 0 0 1-11 20.722Zm22.56-122.124c8.572 4.944 11.906 24.881 6.52 51.026-.344 1.668-.73 3.367-1.15 5.09-10.622-2.452-22.155-4.275-34.23-5.408-7.034-10.017-14.323-19.124-21.64-27.008a160.789 160.789 0 0 1 5.888-5.4c18.9-16.447 36.564-22.941 44.612-18.3ZM128 90.808c12.625 0 22.86 10.235 22.86 22.86s-10.235 22.86-22.86 22.86-22.86-10.235-22.86-22.86 10.235-22.86 22.86-22.86Z" />
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>React</h3>
              <p>React is a declarative, efficient, and flexible JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called &ldquo;components&rdquo;.</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="40" height="40" viewBox="0 0 48 48">
                <linearGradient id="nxtjs-gr1" x1="24" x2="24" y1="43.734" y2="4.266" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="currentColor" stopOpacity="0.8"></stop>
                  <stop offset="1" stopColor="currentColor"></stop>
                </linearGradient>
                <circle cx="24" cy="24" r="19.734" fill="url(#nxtjs-gr1)"></circle>
                <rect width="3.023" height="15.996" x="15.992" y="16.027" fill="var(--secondary-color)"></rect>
                <linearGradient id="nxtjs-gr2" x1="30.512" x2="30.512" y1="33.021" y2="18.431" gradientUnits="userSpaceOnUse">
                  <stop offset=".377" stopColor="var(--secondary-color)" stopOpacity="0"></stop>
                  <stop offset=".666" stopColor="var(--secondary-color)" stopOpacity=".3"></stop>
                  <stop offset=".988" stopColor="var(--secondary-color)"></stop>
                </linearGradient>
                <rect width="2.953" height="14.59" x="29.035" y="15.957" fill="url(#nxtjs-gr2)"></rect>
                <linearGradient id="nxtjs-gr3" x1="22.102" x2="36.661" y1="21.443" y2="40.529" gradientUnits="userSpaceOnUse">
                  <stop offset=".296" stopColor="var(--secondary-color)"></stop>
                  <stop offset=".521" stopColor="var(--secondary-color)" stopOpacity=".5"></stop>
                  <stop offset=".838" stopColor="var(--secondary-color)" stopOpacity="0"></stop>
                </linearGradient>
                <polygon fill="url(#nxtjs-gr3)" points="36.781,38.094 34.168,39.09 15.992,16.027 19.508,16.027"></polygon>
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>Next.js</h3>
              <p>Next.js is a React framework that enables functionality such as server-side rendering and generating static websites for React-based web applications.</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              {/* TypeScript – monochrome: bg uses currentColor, letters use page bg color */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="40" height="40">
                <rect width="256" height="256" rx="16" fill="currentColor" />
                <path
                  style={{ fill: "var(--secondary-color)" }}
                  d="M150.8 200.3v27.6c4.5 2.3 9.8 4 15.9 5.2 6.1 1.2 12.6 1.7 19.4 1.7 6.6 0 12.9-.6 18.9-1.9 6-1.3 11.2-3.4 15.7-6.3 4.5-2.9 8-6.8 10.7-11.7 2.6-4.9 3.9-10.8 3.9-17.8 0-5.2-.8-9.8-2.3-13.8-1.6-4-3.8-7.5-6.7-10.7-2.9-3.2-6.3-6-10.4-8.6-4-2.5-8.5-5-13.4-7.3-3.6-1.6-6.9-3.1-9.8-4.6-2.9-1.5-5.3-3-7.3-4.5-2-1.5-3.6-3.2-4.7-4.9-1.1-1.7-1.7-3.8-1.7-6.1 0-2.1.5-3.9 1.6-5.6 1-1.7 2.5-3.1 4.3-4.3 1.8-1.2 3.9-2.2 6.4-2.9 2.4-.7 5-.1 7.8-.1 2.1 0 4.2.2 6.4.5 2.2.3 4.4.8 6.7 1.4 2.3.6 4.5 1.5 6.6 2.5 2.1 1 4.1 2.2 6 3.5v-26c-4-1.5-8.3-2.7-13-3.4-4.7-.7-10.1-1.1-16.1-1.1-6.6 0-12.8.7-18.6 2.1-5.9 1.4-11 3.6-15.6 6.5-4.5 3-8.1 6.8-10.7 11.6-2.6 4.8-3.9 10.5-3.9 17.1 0 8.5 2.4 15.7 7.3 21.8 4.9 6.1 12.3 11.2 22.3 15.4 3.7 1.5 7.2 3 10.5 4.5 3.3 1.5 6.1 3 8.6 4.6 2.4 1.6 4.4 3.4 5.8 5.3 1.5 1.9 2.2 4.2 2.2 6.7 0 2-.5 3.8-1.4 5.4-.9 1.6-2.3 3-4.1 4.2-1.8 1.2-4 2.1-6.6 2.8-2.6.7-5.5 1-8.8 1-5.8 0-11.5-1-17.2-3-5.7-2-10.9-5.1-15.7-9.2zM88 128.1H66.5v-27H134v27h-21.5V224H88z"
                />
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>TypeScript</h3>
              <p>TypeScript is a strongly typed superset of JavaScript that adds static type checking. It catches errors at compile time, improves code quality, and provides excellent IDE tooling — making large codebases much easier to maintain.</p>
            </div>
          </div>
        </Card>

        {/* ── Styling & UI ── */}
        <GroupHeader label="Styling & UI" />

        <Card>
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg viewBox="0 0 256 154" width="40" height="40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                <defs>
                  <linearGradient x1="-2.778%" y1="32%" x2="100%" y2="67.556%" id="tw-grad">
                    <stop stopColor="currentColor" offset="0%"></stop>
                    <stop stopColor="currentColor" offset="100%"></stop>
                  </linearGradient>
                </defs>
                <path d="M128 0C93.867 0 72.533 17.067 64 51.2 76.8 34.133 91.733 27.733 108.8 32c9.737 2.434 16.697 9.499 24.401 17.318C145.751 62.057 160.275 76.8 192 76.8c34.133 0 55.467-17.067 64-51.2-12.8 17.067-27.733 23.467-44.8 19.2-9.737-2.434-16.697-9.499-24.401-17.318C174.249 14.743 159.725 0 128 0ZM64 76.8C29.867 76.8 8.533 93.867 0 128c12.8-17.067 27.733-23.467 44.8-19.2 9.737 2.434 16.697 9.499 24.401 17.318C81.751 138.857 96.275 153.6 128 153.6c34.133 0 55.467-17.067 64-51.2-12.8 17.067-27.733 23.467-44.8 19.2-9.737-2.434-16.697-9.499-24.401-17.318C110.249 91.543 95.725 76.8 64 76.8Z" fill="currentColor"></path>
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>Tailwind CSS</h3>
              <p>Tailwind CSS is a highly customizable, low-level CSS framework that gives you all of the building blocks you need to build bespoke designs without any annoying opinionated styles you have to fight to override.</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-10 w-10">
                <rect width="256" height="256" fill="none"></rect>
                <line x1="208" y1="128" x2="128" y2="208" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                <line x1="192" y1="40" x2="40" y2="192" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>Shadcn/UI</h3>
              <p>Shadcn/UI is a modern UI library providing lightweight, flexible components built on Radix UI primitives. It powers the sidebar, dropdowns, and sheet components throughout the site.</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="40" height="40" fill="currentColor">
                <path d="M4 18L11 7L18 18L11 29L4 18ZM18 18L25 7L32 18L25 29L18 18Z" />
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>Framer Motion</h3>
              <p>Framer Motion is a production-ready animation library for React. It powers the smooth fade-in and slide-up animations throughout this site using spring-physics easing for natural, high-quality motion.</p>
            </div>
          </div>
        </Card>

        {/* ── Backend & Auth ── */}
        <GroupHeader label="Backend & Auth" />

        <Card>
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg viewBox="0 0 256 262" width="40" height="40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="currentColor" />
                <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="currentColor" />
                <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="currentColor" />
                <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>Google Firebase</h3>
              <p>Google Firebase provides the backend infrastructure for this site — Firestore for the real-time NoSQL database, Firebase Storage for photo uploads in the gallery, and server-side admin authentication via the Firebase Admin SDK.</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="40" height="40" fill="none">
                <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.0749 12.975 13.8623 12.975 13.5999C12.975 11.72 12.4778 10.2794 11.4959 9.31167C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>NextAuth.js</h3>
              <p>NextAuth.js handles Google OAuth sign-in, session management, and secure callback flows — allowing users to log in with their Google account to access features like submitting feedback, leaving comments, and liking photos.</p>
            </div>
          </div>
        </Card>

        {/* ── Deployment ── */}
        <GroupHeader label="Deployment" />

        <Card>
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg viewBox="0 0 256 222" width="40" height="40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                <path fill="currentColor" d="m128 0 128 221.705H0z" />
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>Vercel</h3>
              <p>Vercel is the cloud platform this site is deployed on. It provides instant deployments on every Git push, automatic HTTPS, edge caching, and zero-configuration hosting perfectly suited for Next.js applications.</p>
            </div>
          </div>
        </Card>

        {/* ── AI Tooling ── */}
        <GroupHeader label="AI Development" />

        <Card>
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              {/* Claude product icon — 5-arm asterisk mark */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="40" height="40" fill="currentColor">
                <g transform="translate(18,18)">
                  <rect x="-2.5" y="-16" width="5" height="13" rx="2.5" transform="rotate(0)" />
                  <rect x="-2.5" y="-16" width="5" height="13" rx="2.5" transform="rotate(72)" />
                  <rect x="-2.5" y="-16" width="5" height="13" rx="2.5" transform="rotate(144)" />
                  <rect x="-2.5" y="-16" width="5" height="13" rx="2.5" transform="rotate(216)" />
                  <rect x="-2.5" y="-16" width="5" height="13" rx="2.5" transform="rotate(288)" />
                </g>
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>Claude (Anthropic)</h3>
              <p>Claude is an AI assistant built by Anthropic. Claude assisted throughout the development of this website — from writing and debugging code to architecting features, refining UI interactions, and ensuring best practices across the entire codebase.</p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default AboutPage;
