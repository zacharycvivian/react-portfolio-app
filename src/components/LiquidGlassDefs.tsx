"use client";
/**
 * LiquidGlassDefs — the refraction lens behind the site's liquid-glass theme.
 *
 * Real liquid glass (à la iOS 26) is not just frosted blur: light entering the
 * pane REFRACTS, so the backdrop visibly bends around the pane's edges. On the
 * web that's done with an SVG displacement map applied through
 * `backdrop-filter: url(#glass-lens)`.
 *
 * The displacement map encodes per-pixel offsets in its channels
 * (R = x-shift, G = y-shift, 128 = neutral). It's generated on a canvas so the
 * interior is *exactly* neutral and only a band near each edge bends the
 * backdrop, like the bezel of a lens. feImage stretches the one map to each
 * element's bounds, so a single filter serves every glass surface.
 *
 * Dispersion: the filter displaces R/G/B by slightly different amounts and
 * recombines them, so the bent edge splits into a genuine chromatic fringe.
 *
 * Only Chromium can use SVG filters inside backdrop-filter, so we feature-gate
 * at runtime and set `data-liquid-glass="on"` on <html>; globals.css swaps the
 * `--glass-filter*` recipes over to the lens. Everything else (Safari,
 * Firefox) keeps the blur+saturate fallback and never references the filter.
 */
import * as React from "react";

const MAP_SIZE = 256;
const EDGE = 58; // px of refractive bezel on the 256px reference map

/** How far the backdrop bends at the very edge of a pane. The filter uses
 * objectBoundingBox primitive units, so this is a fraction of the element's
 * normalized diagonal (≈0.22 → roughly 40–55px on a typical card). */
const REFRACTION_STRENGTH = 0.22;

/** Per-channel dispersion: red refracts hardest, blue least, so the bent edge
 * splits into a rainbow fringe — real chromatic aberration, not a painted-on
 * shadow. Ratios are relative to REFRACTION_STRENGTH. */
const DISPERSION_R = 1.12;
const DISPERSION_B = 0.88;

/** feColorMatrix rows that isolate one channel (keeping alpha). */
const KEEP_R = "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0";
const KEEP_G = "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0";
const KEEP_B = "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0";

/**
 * Paint the displacement map. Each edge contributes a displacement pointing
 * outward (so the lens samples the backdrop from beyond its own bounds —
 * a convex, magnifying bezel) with a squared profile: strongest at the very
 * edge, easing to zero at the inner end of the band. Corners blend both axes.
 */
function buildDisplacementMap(): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = MAP_SIZE;
  canvas.height = MAP_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const img = ctx.createImageData(MAP_SIZE, MAP_SIZE);
  const data = img.data;
  const profile = (t: number) => (1 - t) * (1 - t); // t: 0 at edge → 1 at band's inner end

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      let dirX = 0;
      if (x < EDGE) dirX = -profile(x / EDGE);
      else if (x >= MAP_SIZE - EDGE) dirX = profile((MAP_SIZE - 1 - x) / EDGE);

      let dirY = 0;
      if (y < EDGE) dirY = -profile(y / EDGE);
      else if (y >= MAP_SIZE - EDGE) dirY = profile((MAP_SIZE - 1 - y) / EDGE);

      const i = (y * MAP_SIZE + x) * 4;
      data[i] = Math.round(128 + dirX * 127); // R: x displacement
      data[i + 1] = Math.round(128 + dirY * 127); // G: y displacement
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

export default function LiquidGlassDefs() {
  const [mapUrl, setMapUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Respect users who asked the OS for less transparency.
    if (window.matchMedia("(prefers-reduced-transparency: reduce)").matches) return;
    // SVG filters in backdrop-filter only render in Chromium engines; other
    // browsers parse the value but paint nothing, so gate hard on the engine.
    const nav = navigator as Navigator & {
      userAgentData?: { brands?: { brand: string }[] };
    };
    const isChromium =
      nav.userAgentData?.brands?.some((b) => /Chromium/i.test(b.brand)) ??
      (/Chrome\//.test(navigator.userAgent) && !/EdgiOS|CriOS/.test(navigator.userAgent));
    if (!isChromium) return;

    const url = buildDisplacementMap();
    if (!url) return;
    setMapUrl(url);
    // Flip the theme over to the lens only once the filter can render.
    document.documentElement.setAttribute("data-liquid-glass", "on");
  }, []);

  if (!mapUrl) return null;

  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id="glass-lens"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
          primitiveUnits="objectBoundingBox"
        >
          {/* objectBoundingBox units pin the map exactly to each element's
              bounds — percentage feImage sizing does NOT stretch reliably in
              Chromium's backdrop-filter, which smears displacement (and CA)
              across the whole pane instead of just the bezel. */}
          <feImage
            href={mapUrl}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="map"
          />
          {/* Displace each colour channel by a slightly different amount and
              recombine additively — the edge bend splits into a spectrum. */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={REFRACTION_STRENGTH * DISPERSION_R}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispR"
          />
          <feColorMatrix in="dispR" type="matrix" values={KEEP_R} result="chanR" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={REFRACTION_STRENGTH}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispG"
          />
          <feColorMatrix in="dispG" type="matrix" values={KEEP_G} result="chanG" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={REFRACTION_STRENGTH * DISPERSION_B}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispB"
          />
          <feColorMatrix in="dispB" type="matrix" values={KEEP_B} result="chanB" />
          <feComposite in="chanR" in2="chanG" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="chanRG" />
          <feComposite in="chanRG" in2="chanB" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
        </filter>
      </defs>
    </svg>
  );
}
