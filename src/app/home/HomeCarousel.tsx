"use client";
/**
 * HomeCarousel — the auto-playing hero image carousel.
 *
 * Client component because the embla carousel + autoplay plugin run entirely
 * in the browser. The images are imported (and blur-hashed) by the Home Server
 * Component and passed in as props so this island stays purely presentational.
 */
import React, { useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import styles from "../page.module.css";

export interface CarouselSlide {
  src: StaticImageData;
  alt: string;
  /** First slide is given `priority` so it can serve as the LCP image. */
  priority?: boolean;
}

export default function HomeCarousel({ slides }: { slides: CarouselSlide[] }) {
  // The prev/next arrows derive their `disabled` state from embla, which only
  // initializes in the browser. Rendering them on the server would produce a
  // hydration mismatch, so we mount them on the client after hydration. The
  // slides themselves still server-render (keeping the first image as the LCP).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Carousel
      className={styles.carouselItem}
      opts={{ align: "start", loop: true }}
      plugins={[Autoplay({ delay: 3000 })]}
    >
      <CarouselContent>
        {slides.map((slide) => (
          <CarouselItem key={slide.alt} className={styles.image}>
            <Image
              src={slide.src}
              alt={slide.alt}
              placeholder="blur"
              priority={slide.priority}
              sizes="(max-width: 900px) 85vw, 800px"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {mounted && (
        <>
          <CarouselPrevious />
          <CarouselNext />
        </>
      )}
    </Carousel>
  );
}
