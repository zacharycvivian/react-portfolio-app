"use client";
import React, { useEffect, useRef, useState } from "react";
import MatrixRain from "@/components/MatrixRain";
import styles from "./ping.module.css";

type Phase = "idle" | "arming" | "ready" | "result" | "tooSoon";

/** Flavour text for how sharp the reaction was. */
function rating(ms: number): string {
  if (ms < 150) return "godlike";
  if (ms < 200) return "elite reflexes";
  if (ms < 250) return "razor sharp";
  if (ms < 300) return "solid";
  if (ms < 400) return "average";
  return "warming up";
}

export default function Ping() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [ms, setMs] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greenAt = useRef(0);

  useEffect(() => {
    const stored = Number(localStorage.getItem("pingBest") || 0);
    if (stored > 0) setBest(stored);
    return () => {
      if (armTimer.current) clearTimeout(armTimer.current);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 80, left: 0, behavior: "smooth" });
  }, []);

  const arm = () => {
    setPhase("arming");
    const delay = 1200 + Math.random() * 3300; // 1.2s – 4.5s of suspense
    armTimer.current = setTimeout(() => {
      greenAt.current = performance.now();
      setPhase("ready");
    }, delay);
  };

  const handleStage = () => {
    if (phase === "idle" || phase === "result" || phase === "tooSoon") {
      arm();
    } else if (phase === "arming") {
      // Jumped the gun — reset.
      if (armTimer.current) clearTimeout(armTimer.current);
      setPhase("tooSoon");
    } else if (phase === "ready") {
      const reaction = Math.round(performance.now() - greenAt.current);
      setMs(reaction);
      setPhase("result");
      setBest((prev) => {
        if (prev == null || reaction < prev) {
          try {
            localStorage.setItem("pingBest", String(reaction));
          } catch {}
          return reaction;
        }
        return prev;
      });
    }
  };

  const stageClass =
    phase === "ready"
      ? styles.stageReady
      : phase === "arming"
      ? styles.stageArming
      : phase === "tooSoon"
      ? styles.stageTooSoon
      : styles.stageIdle;

  return (
    <div className={styles.matrixBackground}>
      <MatrixRain />
      <div className={styles.container}>
        <h1 className={styles.title}>Ping</h1>
        <div className={styles.score}>
          Last: {phase === "result" ? `${ms} ms` : "— ms"}
          <span className={styles.scoreDivider}>·</span>
          Best: {best != null ? `${best} ms` : "—"}
        </div>

        <div
          className={`${styles.stage} ${stageClass}`}
          onPointerDown={(e) => {
            e.preventDefault();
            handleStage();
          }}
        >
          {phase === "idle" && (
            <>
              <p className={styles.stageTitle}>NETWORK LATENCY TEST</p>
              <p className={styles.stageText}>
                Click to send a ping. The node will turn{" "}
                <span className={styles.hlGreen}>GREEN</span> after a random
                delay — click the instant it does.
              </p>
              <span className={styles.cta}>Send Ping</span>
            </>
          )}

          {phase === "arming" && (
            <>
              <p className={styles.stageTitle}>ESTABLISHING CONNECTION…</p>
              <p className={styles.stageText}>Wait for green. Don&apos;t jump.</p>
            </>
          )}

          {phase === "ready" && (
            <>
              <p className={styles.stageTitleBig}>PACKET RECEIVED</p>
              <p className={styles.stageText}>CLICK!</p>
            </>
          )}

          {phase === "result" && (
            <>
              <p className={styles.stageTitleBig}>{ms} ms</p>
              <p className={styles.stageText}>
                {rating(ms)}
                {best != null && ms <= best ? " — new best!" : ""}
              </p>
              <span className={styles.cta}>Ping Again</span>
            </>
          )}

          {phase === "tooSoon" && (
            <>
              <p className={styles.stageTitle}>TOO SOON</p>
              <p className={styles.stageText}>
                Connection reset — you clicked before the node went live.
              </p>
              <span className={styles.cta}>Retry</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
