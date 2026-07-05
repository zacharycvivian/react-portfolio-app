"use client";
import * as React from "react";

type ReactivityContextValue = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
};

const ReactivityContext = React.createContext<ReactivityContextValue | null>(null);

const STORAGE_KEY = "reactivity";

// Tuning knobs for the liquid-glass light model.
const TILT_MAX = 4.5; // max parallax tilt in degrees
const FALLOFF = 520; // px beyond a pane's edge where its light fades to nothing
const BASE_LIGHT = 0.1; // faint ambient rim so every pane reads as glass
const EASE = 0.12; // light-position smoothing per frame

// Extra non-glass surfaces that should still catch the reactive light + tilt
// (e.g. the gallery photo tiles and the home hero carousel, which use solid
// image backgrounds, not blur).
const OPT_IN_SELECTOR = '[class*="photoCard"], [class*="carouselItem"]';

export function useReactivity() {
  const ctx = React.useContext(ReactivityContext);
  if (!ctx) {
    throw new Error("useReactivity must be used within a ReactivityProvider");
  }
  return ctx;
}

function isFullScreen(r: DOMRect) {
  return r.width >= window.innerWidth * 0.985 && r.height >= window.innerHeight * 0.985;
}

function tiltEligible(r: DOMRect) {
  // The width cap (plus isFullScreen) is what keeps full-viewport background
  // panes from tilting. Height is allowed to run well past the viewport so tall
  // content cards — e.g. the 16-row Technical Skills card — still lean with the
  // cursor instead of sitting flat while their shorter neighbours tilt.
  return (
    r.width >= 180 &&
    r.height >= 110 &&
    r.width <= window.innerWidth * 0.92 &&
    r.height <= window.innerHeight * 1.6
  );
}

export function ReactivityProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = React.useState(false);

  // Hydrate from localStorage on mount.
  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "on") setEnabledState(true);
  }, []);

  // Reflect state onto <html> + persist.
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-reactive", enabled ? "on" : "off");
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  }, [enabled]);

  const setEnabled = React.useCallback((value: boolean) => {
    // iOS 13+ requires an explicit permission request from a user gesture
    // before deviceorientation events fire. Toggling is that gesture.
    if (value && typeof window !== "undefined") {
      const DOE = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      };
      if (DOE && typeof DOE.requestPermission === "function") {
        DOE.requestPermission().catch(() => {
          /* fall back to mouse-only reactivity */
        });
      }
    }
    setEnabledState(value);
  }, []);

  const toggle = React.useCallback(() => setEnabled(!enabled), [enabled, setEnabled]);

  // The light engine: discover glass surfaces, then per frame drive each one's
  // edge highlight + specular glint + parallax tilt from a shared light source.
  React.useEffect(() => {
    const root = document.documentElement;

    if (!enabled) {
      root.style.setProperty("--reactive-intensity", "0");
      return;
    }

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    root.style.setProperty("--reactive-intensity", "1");

    // Set of decorated glass elements (each owns an injected .reactive-sheen).
    const registry = new Set<HTMLElement>();

    const decorate = (el: HTMLElement) => {
      if (el.dataset.reactiveGlass || el.classList.contains("reactive-sheen")) return;
      // The header/footer bars are flat chrome with no real depth, so skip the
      // bar itself — but still let their buttons (children) catch the light.
      if (el.tagName === "HEADER" || el.tagName === "FOOTER") return;
      try {
        const cs = getComputedStyle(el);
        const bf =
          cs.backdropFilter ||
          (cs as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter ||
          "";
        const isGlass = !!bf && bf.includes("blur");
        if (!isGlass && !el.matches(OPT_IN_SELECTOR)) return;

        const r = el.getBoundingClientRect();
        if (r.width < 24 || r.height < 24 || isFullScreen(r)) return;

        el.dataset.reactiveGlass = "1";
        if (cs.position === "static") {
          el.dataset.reactivePosFix = "1";
          el.style.position = "relative";
        }
        // Only tilt in-flow panels (static/relative). Fixed/absolute glass is
        // typically centered via transform (modals, dropdowns) — leave those be.
        // Skip the gallery polaroids, whose OWN transform is driven by Framer
        // (tilt + hover); the engine and Framer would fight over el.style.transform
        // every frame. The home carousel is fine to tilt — embla positions its
        // track from offsetWidth, which a transform on the wrapper doesn't touch.
        const inFlow = cs.position === "static" || cs.position === "relative";
        const ownsTransform = el.matches('[class*="photoCard"]');
        if (!prefersReduced && inFlow && tiltEligible(r) && !ownsTransform) {
          el.dataset.reactiveTilt = "1";
          // Neutralize any transform transition so our per-frame easing reads
          // crisply, and pin the pivot to centre for a natural tip.
          el.dataset.reactiveTrans = el.style.transition;
          el.dataset.reactiveOrigin = el.style.transformOrigin;
          el.style.transition = "none";
          el.style.transformOrigin = "center center";
        }
      } catch {
        return;
      }

      const sheen = document.createElement("div");
      sheen.className = "reactive-sheen";
      sheen.setAttribute("aria-hidden", "true");
      try {
        el.appendChild(sheen);
      } catch {
        delete el.dataset.reactiveGlass;
        return;
      }
      registry.add(el);
    };

    const scan = (node: ParentNode) => {
      try {
        if (node instanceof HTMLElement) decorate(node);
        node.querySelectorAll<HTMLElement>("*").forEach(decorate);
      } catch {
        /* ignore detached / cross-origin nodes */
      }
    };

    scan(document.body);

    // Anything that can move a pane or the light marks the frame dirty; the
    // rAF loop below skips all layout reads/writes on clean, settled frames so
    // an idle page costs (almost) nothing.
    let dirty = true;
    const markDirty = () => {
      dirty = true;
    };

    // Catch glass that mounts later (modals, dropdowns, route changes, chatbot).
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLElement) scan(n);
        });
      }
      dirty = true;
    });
    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("scroll", markDirty, { passive: true, capture: true });
    window.addEventListener("resize", markDirty, { passive: true });

    // Shared light source position, in viewport percentages, eased per frame.
    let targetX = 50;
    let targetY = prefersReduced ? 6 : 18;
    let curX = targetX;
    let curY = targetY;

    const onMouse = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null && e.beta == null) return;
      const gamma = Math.max(-45, Math.min(45, e.gamma ?? 0));
      const beta = Math.max(-45, Math.min(45, (e.beta ?? 0) - 45));
      targetX = 50 + (gamma / 45) * 50;
      targetY = 50 + (beta / 45) * 50;
    };

    if (!prefersReduced) {
      window.addEventListener("mousemove", onMouse, { passive: true });
      window.addEventListener("deviceorientation", onOrient, { passive: true });
    }

    const vw = () => window.innerWidth;
    const vh = () => window.innerHeight;
    const rects = new Map<HTMLElement, DOMRect>();
    let frame = 0;

    const tick = () => {
      // Idle early-out: when the light has settled and nothing scrolled,
      // resized, or mounted since the last frame, skip the whole read/write
      // pass instead of re-measuring every pane at 60fps.
      const settled =
        Math.abs(targetX - curX) < 0.02 && Math.abs(targetY - curY) < 0.02;
      if (settled && !dirty) {
        frame = requestAnimationFrame(tick);
        return;
      }
      dirty = false;

      curX = settled ? targetX : curX + (targetX - curX) * EASE;
      curY = settled ? targetY : curY + (targetY - curY) * EASE;
      root.style.setProperty("--reactive-x", `${curX.toFixed(2)}%`);
      root.style.setProperty("--reactive-y", `${curY.toFixed(2)}%`);

      const lightX = (curX / 100) * vw();
      const lightY = (curY / 100) * vh();

      // Read phase (batch layout reads to avoid thrashing).
      rects.clear();
      for (const el of registry) {
        if (!el.isConnected) {
          registry.delete(el);
          continue;
        }
        rects.set(el, el.getBoundingClientRect());
      }

      // Write phase.
      for (const [el, r] of rects) {
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = lightX - cx;
        const dy = lightY - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;
        // Falloff is measured from the cursor to the pane's nearest EDGE (0 when
        // the cursor is over the pane), so a wide bar like the header only lights
        // up when you're actually near it — not whenever you share its column.
        const exDist = Math.max(r.left - lightX, 0, lightX - r.right);
        const eyDist = Math.max(r.top - lightY, 0, lightY - r.bottom);
        const edgeDist = Math.hypot(exDist, eyDist);
        // Broad, lantern-like falloff: 1 - x² holds near-full brightness for
        // the first half of the radius, so neighbouring panes light together
        // instead of a single pane flaring under the cursor.
        const x = Math.min(1, edgeDist / FALLOFF);
        const falloff = 1 - x * x;
        const li = Math.min(1, BASE_LIGHT + (1 - BASE_LIGHT) * falloff);
        const sx = Math.max(-20, Math.min(120, ((lightX - r.left) / r.width) * 100));
        const sy = Math.max(-20, Math.min(120, ((lightY - r.top) / r.height) * 100));

        const s = el.style;
        s.setProperty("--rg-lx", ux.toFixed(3));
        s.setProperty("--rg-ly", uy.toFixed(3));
        s.setProperty("--rg-sx", `${sx.toFixed(1)}%`);
        s.setProperty("--rg-sy", `${sy.toFixed(1)}%`);
        s.setProperty("--rg-li", li.toFixed(3));

        if (el.dataset.reactiveTilt === "1") {
          // Tip toward the cursor relative to THIS pane's centre, and fade the
          // tilt out as the cursor leaves the pane's neighbourhood — so only
          // the pane you're pointing at leans, like a physical sheet of glass.
          const nx = Math.max(-1, Math.min(1, (lightX - cx) / (r.width / 2)));
          const ny = Math.max(-1, Math.min(1, (lightY - cy) / (r.height / 2)));
          const reach = Math.max(r.width, r.height) / 2 + 320;
          const tiltScale = Math.max(0, 1 - dist / reach);
          const ry = nx * TILT_MAX * tiltScale;
          const rx = -ny * TILT_MAX * tiltScale;
          s.transform = `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
          s.willChange = "transform";
        }
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("deviceorientation", onOrient);
      window.removeEventListener("scroll", markDirty, { capture: true });
      window.removeEventListener("resize", markDirty);
      root.style.setProperty("--reactive-intensity", "0");
      // Tear down injected layers + restored inline styles immediately so a
      // quick off→on toggle never leaves orphaned sheens behind.
      for (const el of registry) {
        try {
          el.querySelectorAll(":scope > .reactive-sheen").forEach((n) => n.remove());
          delete el.dataset.reactiveGlass;
          if (el.dataset.reactivePosFix) {
            el.style.position = "";
            delete el.dataset.reactivePosFix;
          }
          if (el.dataset.reactiveTilt) {
            el.style.transform = "";
            el.style.willChange = "";
            el.style.transition = el.dataset.reactiveTrans || "";
            el.style.transformOrigin = el.dataset.reactiveOrigin || "";
            delete el.dataset.reactiveTilt;
            delete el.dataset.reactiveTrans;
            delete el.dataset.reactiveOrigin;
          }
          el.style.removeProperty("--rg-lx");
          el.style.removeProperty("--rg-ly");
          el.style.removeProperty("--rg-sx");
          el.style.removeProperty("--rg-sy");
          el.style.removeProperty("--rg-li");
        } catch {
          /* element already gone */
        }
      }
      registry.clear();
    };
  }, [enabled]);

  const value = React.useMemo(
    () => ({ enabled, setEnabled, toggle }),
    [enabled, setEnabled, toggle]
  );

  return (
    <ReactivityContext.Provider value={value}>
      {children}
      <div id="reactive-glow" aria-hidden="true" />
    </ReactivityContext.Provider>
  );
}
