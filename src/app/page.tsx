"use client";
import { useSession } from "next-auth/react";
import styles from "./page.module.css";
import Zach from "@/../public/Zach.jpg";
import Turbo from "@/../public/Turbo.jpg";
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
import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  addDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/../firebase";
import { motion } from "framer-motion";
 
const fadeInVariant = {
  visible: {
    opacity: 1,
    scale: 1,
    y: 0, // End at the original position
    transition: { duration: 0.2 },
  },
  hidden: {
    opacity: 0,
    scale: 0.65,
    y: 50,
  },
};

export default function Home() {
  const { data: session } = useSession();
  const [buttonTop, setButtonTop] = useState(20);
  const [terminalTop, setTerminalTop] = useState(0); // To track the terminal's top position
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const terminalHeight = 300;
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let dotCount = 0;
    let intervalId: NodeJS.Timeout | undefined; // Explicitly declare the type

    if (isLoading) {
      intervalId = setInterval(() => {
        dotCount = (dotCount % 3) + 1; // Cycle through 1 to 3
        setTerminalOutput("Generating Response" + ".".repeat(dotCount));
      }, 500); // Update every 500 milliseconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading]);

  const handleEnterKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setLastCommand(currentInput);
      const inputParts = currentInput.trim().split(" ");
      const command = inputParts[0];
      const prompt = inputParts.slice(1).join(" ");

      switch (command) {
        case "/help":
          setTerminalOutput(
            "/help - Show a list of commands\n" +
              "/ask - Ask a Google Gemini AI a question\n" +
              "/about - Learn more about this website's frameworks\n" 
              //"/ls - (WIP) Lists all files within the current directory\n" +
              //"/cat - (WIP) View the contents of a specified file within the current directory\n" +
              //"/cd - (WIP) Changes the current directory, letting you navigate deeper into this website's files one step at a time\n" +
              //"/play - (WIP) Play a game within the command line\n"
          );
          break;
        case "/ask":
          if (prompt) {
            setIsLoading(true); // Start loading animation
            const docRef = addDoc(collection(db, "generate"), {
              prompt: prompt,
            }).then((ref) => {
              const unsubscribe = onSnapshot(
                doc(db, "generate", ref.id),
                (doc) => {
                  if (doc.exists() && doc.data().response) {
                    setTerminalOutput("Chatbot: " + doc.data().response);
                    setIsLoading(false); // Stop loading animation
                    unsubscribe();
                  }
                },
                (err) => {
                  console.error("Error fetching chat response:", err);
                  setIsLoading(false); // Ensure loading stops on error
                }
              );
            });
          } else {
            setTerminalOutput(
              "Please provide a question after '/ask'. For example, '/ask How are you today?'"
            );
          }
          break;
        case "/about":
          setTerminalOutput(
            "This website was built with the following tools--Frameworks: React/Next.js/Tailwind CSS, Database: Google Firebase, AI Chatbot: Google Gemini, UI Elements: Shadcn.ui (Sidebar, Dropdowns), Radix-ui (Icons), Code Help and Image Generation: ChatGPT-4/DALLE-3, Hosting: Domain from Squarespace & Hosted on Vercel, Other Tools: Google Search Console (Sitemapping)\n" +
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
      <motion.button
        id="chatbotButton"
        className={styles.chatbotbutton}
        style={{ top: `${buttonTop}px` }}
        onClick={() => setIsChatVisible(!isChatVisible)}
        variants={fadeInVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        Chat
      </motion.button>
      {isChatVisible && (
        <motion.div
          className={styles.terminalcontainer}
          style={{
            top: `${buttonTop - terminalHeight}px`,
            right: "20px",
            position: "fixed",
            zIndex: 1100,
          }}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.terminal_toolbar}>
            <div className={styles.close_button}>
              <button
                className={`${styles.btn} ${styles["btn-color"]}`}
                onClick={() => setIsChatVisible(!isChatVisible)}
              ></button>
              <button className={styles.btn}></button>
              <button className={styles.btn}></button>
            </div>
            <p className={styles.user}>
              {formatUsername(session?.user?.name)}@terminal: ~
            </p>

            <div className={styles.add_tab}>+</div>
          </div>
          <div className={styles.terminal_body}>
            <div className={styles.terminal_prompt}>
              <span className={styles.terminal_user}>
                {formatUsername(session?.user?.name)}@terminal/main/:
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
        </motion.div>
      )}

      <div className={styles.layoutContainer}>
        <motion.div
          className={styles.logoContainer}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Image
          className={styles.logoContainer}
            src={Logo}
            alt="Zach Vivian's Logo"
            layout="fill"
            objectFit="contain"
            priority
          />
        </motion.div>
        <div className="container flex justify-center align-middle">
          <motion.div
            className={styles.homeContainer}
            variants={fadeInVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h1
              className={styles.welcomeMessage}
              variants={fadeInVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <strong>Hello, {session?.user?.name ?? "Guest"}</strong>
            </motion.h1>
            <motion.p
              className={styles.instructions}
              variants={fadeInVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              Click the icon on the top left to learn more about me and download
              a copy of my resume!
            </motion.p>
            <motion.div
              className={styles.infoContainer}
              variants={fadeInVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h2>
                <strong>Welcome to my Portfolio Website!</strong>
              </h2>
              <p className={styles.infoContainerText}>
                My name is Zachary Vivian, and I am set to graduate from the
                University of Wisconsin-Platteville in May 2024, with a degree
                specializing in Cybersecurity. This website serves as a digital
                portfolio where you can explore my professional journey,
                discover more about my passions and projects, and understand the
                skills I bring to the cybersecurity domain. If we've had the
                opportunity to collaborate or if you're familiar with my work
                and dedication, I welcome you to leave a testimonial. Your
                support as a reference could greatly assist me in connecting
                with future employers and opportunities! To create a
                testimonial, click the icon in the top right and log in with
                your Google account. Then, click your profile icon and add your
                occupation and employer and head to the testimonials tab to
                leave a professional reference!
              </p>
            </motion.div>
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
                    priority
                    alt="A photo of Zach Vivian at the Garden of the Gods overlooking Pike's Peak in Colorado Springs, Colorado "
                  />
                </CarouselItem>
                <CarouselItem className={styles.image}>
                  <Image
                    src={Zach}
                    priority
                    alt="A picture of Zach Vivian on a hike near Fish Creek Falls in Steamboat Springs, Colorado"
                  />
                </CarouselItem>
                <CarouselItem className={styles.image}>
                  <Image
                    src={Squad}
                    priority
                    alt="Zach Vivian and his buddies on a hike near Nederland, Colorado"
                  />
                </CarouselItem>
                <CarouselItem className={styles.image}>
                  <Image src={Turbo} priority alt="Image of Zach Vivian's dog, Turbo" />
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </motion.div>
        </div>
      </div>
    </>
  );
}
