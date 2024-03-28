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

const metadata: Metadata = {
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
          alt="Zach Vivian's Logo"
          layout="fill"
          objectFit="contain"
        />
      </div>
      <div className="container flex justify-center align-middle">
        <div className={styles.homeContainer}>
          <h1 className={styles.welcomeMessage}>
            <strong>Hello, {session?.user?.name || "Guest"}</strong>
          </h1>
          <p className={styles.instructions}>
            Click the icon on the top left to learn more about me and download a
            copy of my resume!
          </p>
          <div className={styles.infoContainer}>
            <h2>
              <strong>Welcome to my Personal Website!</strong>
            </h2>
            <p>
              My name is Zachary Vivian, and I am set to graduate from the
              University of Wisconsin-Platteville in May 2024, with a degree
              specializing in Cybersecurity. This website serves as a digital
              portfolio where you can delve into my professional journey,
              discover more about my passions and projects, and understand the
              skills I bring to the cybersecurity domain. If we've had the
              opportunity to collaborate or if you're familiar with my work and
              dedication, I warmly invite you to leave a testimonial. Your
              support as a reference could greatly assist me in connecting with
              future employers and opportunities.
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
                delay: 3000,
              }),
            ]}
          >
            <CarouselContent>
              <CarouselItem className={styles.image}>
                <Image
                  src={Mountains}
                  alt="A photo of Zach Vivian at the Garden of the Gods overlooking Pike's Peak in Colorado Springs, Colorado "
                />
              </CarouselItem>
              <CarouselItem className={styles.image}>
                <Image
                  src={Zach}
                  alt="A picture of Zach Vivian on a hike near Fish Creek Falls in Steamboat Springs, Colorado"
                />
              </CarouselItem>
              <CarouselItem className={styles.image}>
                <Image
                  src={Squad}
                  alt="Zach Vivian and his buddies on a hike near Nederland, Colorado"
                />
              </CarouselItem>
              <CarouselItem className={styles.image}>
                <Image src={Turbo} alt="Image of Zach Vivian's dog, Turbo" />
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
