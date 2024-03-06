"use client";
import React from "react";
import { useSession } from "next-auth/react";
import styles from "./page.module.css";
import Zach from "@/../public/Zach.jpg";
import Turbo from "@/../public/Turbo.jpeg";
import Squad from "@/../public/Squad.jpg";
import Mountains from "@/../public/Mountains.jpg";
import Logo from "@/../public/HeaderLogo.png";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to my personal website!",
};

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className={styles.layoutContainer}>
      <div className={styles.logoContainer}>
        <Image
          src={Logo}
          alt="Company Logo"
          layout="fill"
          objectFit="contain"
        />
      </div>
      <div className="container flex justify-center align-middle">
        <div className={styles.homeContainer}>
          <h1 className={styles.welcomeMessage}>
            Hello, {session?.user?.name || "Guest"}
          </h1>
          <p className={styles.instructions}>
            Click the icon on the top left to learn more about me, or download
            my Resume via the button above!
          </p>
          <div className={styles.infoContainer}>
            <h2>Welcome to my Resume Website!</h2>
            <p>
              My name is Zachary Vivian, I'm graduating the University of
              Wisconsin - Platteville in May 2024 with a degree in
              Cybersecurity. On this website, you can find out more about myself
              and leave a testimonial if you'd like to help me out by leaving a
              reference for potential future employers to learn more about how I
              can help their business.
            </p>
          </div>
          <Carousel
            className={styles.carouselItem}
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
              }),
            ]}
          >
            <CarouselContent>
              <CarouselItem className={styles.image}>
                <Image src={Mountains} alt="img" />
              </CarouselItem>
              <CarouselItem className={styles.image}>
                <Image src={Zach} alt="img" />
              </CarouselItem>
              <CarouselItem className={styles.image}>
                <Image src={Squad} alt="img" />
              </CarouselItem>
              <CarouselItem className={styles.image}>
                <Image src={Turbo} alt="img" />
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </div>
  );
}
