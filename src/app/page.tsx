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
  const [terminalTop, setTerminalTop] = useState(0); // To track the terminal's top position
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const terminalHeight = 300;

  const handleEnterKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setLastCommand(currentInput);
      switch (currentInput.trim()) {
        case "/help":
          setTerminalOutput(
            "/help - Show a list of commands\n" +
              "/ls - Lists all files within the current directory\n" +
              "/cat - View the contents of a specified file within the current directory\n" +
              "/cd - Changes the current directory, letting you navigate deeper into this website's files one step at a time\n" +
              "/ask - Ask an AI bot a question about this website\n" +
              "/about - Learn more about this website's frameworks\n" +
              "/play - Play a game within the command line\n"
          );
          break;
        case "/ask":
          setTerminalOutput(
            "This command is currently a work in progress. Eventually, it will display a custom AI chat model which will let the user ask questions regarding Zach Vivian, his website, and any other basic questions they may have!\n"
          );
          break;
        case "/about":
          setTerminalOutput(
            "This website was built with the following tools--Frameworks: React/Next.js/Tailwind CSS, Database: Google Firebase, UI Elements: Shadcn.ui (Sidebar, Dropdowns), Radix-ui (Icons), Code Help and Image Generation: ChatGPT-4/DALLE-3, Hosting: Domain from Squarespace & Hosted on Vercel.\n" +
              "\n" +
              "This website and its contents are protected under United States Copyright Law (except artifical-intelligence generated images and text, Shadcn.ui elements, and Radix-ui icons; I do not claim those to be of my own work). You are welcome to use my code (provided on my GitHub profile) as a resource for inspiration, but direct plagiarism will NOT be tolerated. If you have suggestions for improvements or bug fixes, please log in and submit feedback/report bugs under your profile."
          );
          break;
        case "/play":
          setTerminalOutput(
            "Unknown command. Were you trying to play a game?\n" +
              "\n" +
              "Correct usage: '/play <game>'\n" +
              "\n" +
              "You must specify a game to play (game1, game2, game3). This command is currently a work in progress, eventually it will let the user play text-based games within the CLI, with one game utilizing AI for a decision-based story game."
          );
          break;
        case "/ls":
          setTerminalOutput(
            "This command is currently a work in progress. It will let the user list all the files in the 'main' directory of this website's GitHub repo, or specified directory if they navigate to it first."
          );
          break;
        case "/cat":
          setTerminalOutput(
            "Unknown command. Were you trying to see the contents of a file?\n" +
            "\n" +
            "Correct usage: '/cat <file>'\n" +
            "\n" +
            "This command is currently a work in progress. It will let the user view the code for a specified file in the current directory"
          );
          break;
        case "/cd":
          setTerminalOutput(
            "Unknown command. Were you trying to navigate to a new directory?\n" +
            "\n" +
            "Correct usage: '/cd <path>'\n" +
            "\n" +
            "To go back to the previous directory: '/cd ..'\n" +
            "\n" +
            "This command is currently a work in progress. It will let the user change to a new directory from the listed files of the current directory they are in. "
          );
          break;
        default:
          setTerminalOutput(
            "Unknown command. Type /help for a list of commands."
          );
      }

      setCurrentInput("");
    }
  };

  useEffect(() => {
    const initialPosition = window.innerHeight - 190;
    setTerminalTop(initialPosition);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setButtonTop(window.scrollY + window.innerHeight - 70);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const formatUsername = (username: string | null | undefined): string => {
    return username ? username.toLowerCase().replace(/ /g, "") : "guest";
  };

  return (
    <>
      <button
        id="chatbotButton"
        className={styles.chatbotbutton}
        style={{ top: `${buttonTop}px` }}
        onClick={() => setIsChatVisible(!isChatVisible)}
      >
        Chat
      </button>
      {isChatVisible && (
        <div
          className={styles.terminalcontainer}
          style={{
            top: `${buttonTop - terminalHeight}px`,
            right: "20px",
            position: "fixed",
            zIndex: 1100,
          }}
        >
          <div className={styles.terminal_toolbar}>
            <div className={styles.butt}>
              <button
                className={`${styles.btn} ${styles["btn-color"]}`}
              ></button>
              <button className={styles.btn}></button>
              <button className={styles.btn}></button>
            </div>
            <p className={styles.user}>
              {formatUsername(session?.user?.name)}@chatbot: ~
            </p>

            <div className={styles.add_tab}>+</div>
          </div>
          <div className={styles.terminal_body}>
            <div className={styles.terminal_prompt}>
              <span className={styles.terminal_user}>
                {formatUsername(session?.user?.name)}@chatbot/main/:
              </span>
              <span className={styles.terminal_location}>~</span>
              <span className={styles.terminal_bling}>$</span>
              <span>{lastCommand}</span>
            </div>
            <div className={styles.terminal_output}>
              <pre className={styles.output_text}>{terminalOutput}</pre>
            </div>
            <div className={styles.terminal_input}>
              <input
                placeholder="Type '/help' here to get started..."
                className={styles.input_text}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleEnterKey}
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
