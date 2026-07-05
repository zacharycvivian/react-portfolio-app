"use client";
import React, { useEffect, useRef } from "react";
import styles from "./MatrixRain.module.css";

/**
 * The falling-glyph "matrix rain" backdrop shared by the game pages.
 *
 * Renders two stacked canvases — a trailing ghost layer that fades toward black
 * and a crisp top layer — and animates them with requestAnimationFrame. It's
 * self-contained: drop it inside any `position: relative` wrapper and it fills
 * that wrapper, sitting behind whatever you render next.
 *
 * Re-seeds on window resize (so it never stretches), and honours
 * `prefers-reduced-motion` by rendering a single static frame instead of the
 * animation.
 */
export default function MatrixRain() {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = baseRef.current;
    const canvas2 = overlayRef.current;
    if (!canvas || !canvas2) return;
    const ctx = canvas.getContext("2d");
    const ctx2 = canvas2.getContext("2d");
    if (!ctx || !ctx2) return;

    const charArr = "abcdefghijklmnopqrstuvwxyz".split("");
    const fontSize = 10;

    let cw = 0;
    let ch = 0;

    const randInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min) + min);
    const randFloat = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    class Glyph {
      x: number;
      y: number;
      value: string;
      speed: number;
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.value = charArr[randInt(0, charArr.length - 1)].toUpperCase();
        this.speed = randFloat(1, 5);
      }
      draw() {
        ctx2!.fillStyle = "rgba(255,255,255,0.8)";
        ctx2!.font = fontSize + "px sans-serif";
        ctx2!.fillText(this.value, this.x, this.y);

        ctx!.fillStyle = "#c6d6f6";
        ctx!.font = fontSize + "px sans-serif";
        ctx!.fillText(this.value, this.x, this.y);

        this.y += this.speed;
        if (this.y > ch) {
          this.y = randFloat(-100, 0);
          this.speed = randFloat(2, 5);
        }
      }
    }

    let glyphs: Glyph[] = [];

    // (Re)size both canvases to the viewport and seed a column per font cell.
    const seed = (spread = false) => {
      cw = window.innerWidth;
      ch = window.innerHeight;
      canvas.width = canvas2.width = cw;
      canvas.height = canvas2.height = ch;
      const maxColumns = cw / fontSize;
      glyphs = [];
      for (let i = 0; i < maxColumns; i++) {
        // `spread` fills the screen for a good static (reduced-motion) frame;
        // otherwise start above the fold so the rain falls in.
        glyphs.push(new Glyph(i * fontSize, spread ? randFloat(0, ch) : randFloat(-500, 0)));
      }
    };

    const drawFrame = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, cw, ch);
      ctx2.clearRect(0, 0, cw, ch);
      for (let i = glyphs.length - 1; i >= 0; i--) glyphs[i].draw();
    };

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      // One static, screen-filling frame — no animation loop.
      seed(true);
      drawFrame();
      const onResize = () => {
        seed(true);
        drawFrame();
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    seed();
    let raf = 0;
    const update = () => {
      drawFrame();
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => seed(), 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <canvas ref={baseRef} className={styles.matrixCanvas} />
      <canvas ref={overlayRef} className={styles.matrixCanvasOverlay} />
    </>
  );
}
