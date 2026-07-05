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

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const charArr = "abcdefghijklmnopqrstuvwxyz".split("");
    const fontSize = 10;
    const maxColumns = cw / fontSize;
    canvas.width = canvas2.width = cw;
    canvas.height = canvas2.height = ch;

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

    const glyphs: Glyph[] = [];
    for (let i = 0; i < maxColumns; i++) {
      glyphs.push(new Glyph(i * fontSize, randFloat(-500, 0)));
    }

    let raf = 0;
    const update = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, cw, ch);
      ctx2.clearRect(0, 0, cw, ch);
      for (let i = glyphs.length - 1; i >= 0; i--) glyphs[i].draw();
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <canvas ref={baseRef} className={styles.matrixCanvas} />
      <canvas ref={overlayRef} className={styles.matrixCanvasOverlay} />
    </>
  );
}
