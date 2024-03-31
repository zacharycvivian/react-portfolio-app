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
import { useState, useEffect } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [buttonTop, setButtonTop] = useState(20);
  const [isChatVisible, setIsChatVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Keep the button 20px from the bottom of the viewport regardless of scroll position
      setButtonTop(window.scrollY + window.innerHeight - 70); // Adjust 70px based on your button's size and desired offset
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Initial placement adjust on load
    handleScroll();

    return () => {
      // Clean up event listener
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <button
        id="chatbotButton"
        className={styles.chatbotbutton}
        style={{ top: `${buttonTop}px` }} // Keep dynamic positioning
        onClick={() => setIsChatVisible(!isChatVisible)} // Toggle visibility
      >
        Chat
      </button>
      {isChatVisible && (
        <div
          className={styles.container} // Ensure your module CSS includes the styles provided
          style={{
            top: `${buttonTop - 135}px`,
            right: "20px",
            position: "absolute",
            zIndex: 1100, 
          }} // Example positioning
        >
          <div className={styles.terminal_toolbar}>
            <div className={styles.butt}>
              <button
                className={`${styles.btn} ${styles["btn-color"]}`}
              ></button>
              <button className={styles.btn}></button>
              <button className={styles.btn}></button>
            </div>
            <p className={styles.user}>{session?.user?.name || "guest"}@chatbot: ~</p>
            <div className={styles.add_tab}>+</div>
          </div>
          <div className={styles.terminal_body}>
            <div className={styles.terminal_prompt}>
              <span className={styles.terminal_user}>{session?.user?.name || "guest"}@chatbot:</span>
              <span className={styles.terminal_location}>~</span>
              <span className={styles.terminal_bling}>$</span>
              <span className={styles.terminal_cursor}></span>
            </div>
            <div className={styles.terminal_output}>
              <pre className={styles.output_text}>AI Chatbot Assistant</pre>
            </div>
            <div className={styles.terminal_input}>
              <input
                placeholder="Type your question here...(Coming Soon!)"
                className={styles.input_text}
                type="text"
              />
            </div>
          </div>
        </div>
      )}

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
              Click the icon on the top left to learn more about me and download
              a copy of my resume!
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
                opportunity to collaborate or if you're familiar with my work
                and dedication, I warmly invite you to leave a testimonial. Your
                support as a reference could greatly assist me in connecting
                with future employers and opportunities.
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
    </>
  );
}
