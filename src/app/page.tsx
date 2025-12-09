"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import type { Firestore } from "firebase/firestore";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./page.module.css";
import Logo from "@/../public/HeaderLogo.png";
import Zach from "@/../public/Zach.jpg";
import Turbo from "@/../public/Turbo.jpg";
import Squad from "@/../public/Squad.jpg";
import Mountains from "@/../public/Mountains.jpg";

// Animation variants
const fadeInVariant = {
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
  hidden: { opacity: 0, scale: 1, y: 100, transition: { duration: 0.15 } },
};

const chatBotVariant = {
  hidden: { opacity: 0, scale: 0.5, x: 200, y: 200 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 20 },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    x: 200,
    y: 200,
    transition: { duration: 0.5 },
  },
};

interface Skill {
  skill: string;
  level: number;
}

const getSkillLevelLabel = (level: number): string => {
  if (level <= 40) return "Beginner";
  if (level <= 60) return "Intermediate";
  if (level <= 85) return "Advanced";
  return "Proficient";
};

const SkillBar: React.FC<Skill> = ({ skill, level }) => {
  const levelLabel = getSkillLevelLabel(level);
  return (
    <div className={styles.skillRow}>
      <div className={styles.skillNameContainer}>
        <div className={styles.skillName}>{skill}</div>
        <div className={styles.skillLevelLabel}>{levelLabel}</div>
      </div>
      <div className={styles.skillBarContainer}>
        <progress
          className={styles.skillBar}
          value={level}
          max={100}
        ></progress>
      </div>
    </div>
  );
};

type FirestoreDeps = {
  db: Firestore;
  collection: typeof import("firebase/firestore").collection;
  addDoc: typeof import("firebase/firestore").addDoc;
  onSnapshot: typeof import("firebase/firestore").onSnapshot;
  serverTimestamp: typeof import("firebase/firestore").serverTimestamp;
};

let firestoreDepsPromise: Promise<FirestoreDeps> | null = null;

const loadFirestoreDeps = async (): Promise<FirestoreDeps> => {
  if (!firestoreDepsPromise) {
    firestoreDepsPromise = Promise.all([
      import("@/../firebase"),
      import("firebase/firestore"),
    ]).then(([firebaseClient, firestore]) => ({
      db: firebaseClient.db as Firestore,
      collection: firestore.collection,
      addDoc: firestore.addDoc,
      onSnapshot: firestore.onSnapshot,
      serverTimestamp: firestore.serverTimestamp,
    }));
  }
  return firestoreDepsPromise;
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function Home() {
  const { data: session } = useSession();
  const greeting = useMemo(() => getTimeGreeting(), []);
  const [buttonTop, setButtonTop] = useState(20);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const texts = useMemo(
    () => [
      "SOFTWARE IMPLEMENTATION",
      "RISK MANAGEMENT",
      "IT/CUSTOMER SUPPORT",
      "TECHNICAL TRAINING",
      "DOCUMENTATION",
      "SQL DATABASES",
      "WINDOWS + SERVER",
      "NETWORKING",
    ],
    []
  );
  const [displayWord, setDisplayWord] = useState(texts[0]);
  const [transitionIndex, setTransitionIndex] = useState(0);
  const terminalHeight = 300;
  const [messageStep, setMessageStep] = useState(0);
  const [messageData, setMessageData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [askTimestamps, setAskTimestamps] = useState<number[]>([]);

  // Firestore helpers
  const addFeedback = async (feedback: string): Promise<void> => {
    const { db, collection, addDoc, serverTimestamp } =
      await loadFirestoreDeps();
    const email = session?.user?.email || "user not logged in";
    await addDoc(collection(db, "feedback"), {
      email,
      feedback,
      time: serverTimestamp(),
    });
  };

  const addBugReport = async (bugDescription: string): Promise<void> => {
    const { db, collection, addDoc, serverTimestamp } =
      await loadFirestoreDeps();
    const email = session?.user?.email || "user not logged in";
    await addDoc(collection(db, "bugs"), {
      email,
      bugs: bugDescription,
      time: serverTimestamp(),
    });
  };

  // Hero text transitions
  useEffect(() => {
    const currentWord = texts[index];
    const nextWord = texts[(index + 1) % texts.length];
    const maxTransitionLength = Math.max(currentWord.length, nextWord.length);

    if (transitionIndex <= maxTransitionLength) {
      const timeoutId = setTimeout(() => {
        const newChars =
          nextWord.slice(0, transitionIndex) +
          currentWord.slice(transitionIndex);
        setDisplayWord(newChars);
        setTransitionIndex(transitionIndex + 1);
      }, 75);
      return () => clearTimeout(timeoutId);
    } else {
      const pauseTimeoutId = setTimeout(() => {
        setIndex((index + 1) % texts.length);
        setTransitionIndex(0);
        setDisplayWord(nextWord);
      }, 2000);
      return () => clearTimeout(pauseTimeoutId);
    }
  }, [transitionIndex, index, texts]);

  // Loading animation for chatbot
  useEffect(() => {
    let dotCount = 0;
    let intervalId: NodeJS.Timeout | undefined;
    if (isLoading) {
      intervalId = setInterval(() => {
        dotCount = (dotCount % 3) + 1;
        setTerminalOutput("Generating Response" + ".".repeat(dotCount));
      }, 500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading]);

  // Terminal input handling
  const handleEnterKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (messageStep > 0) {
        handleMessageInput();
      } else {
        processCommand();
      }
      setCurrentInput("");
    }
  };

  const handleMessageInput = () => {
    const input = currentInput.trim();
    switch (messageStep) {
      case 1:
        setMessageData({ ...messageData, name: input });
        setTerminalOutput("Please enter your email:");
        setMessageStep(2);
        break;
      case 2:
        setMessageData({ ...messageData, email: input });
        setTerminalOutput("Please enter your message:");
        setMessageStep(3);
        break;
      case 3:
        setMessageData({ ...messageData, message: input });
        setTerminalOutput(
          `Confirm sending this message (Y/N):\nName: ${messageData.name}\nEmail: ${messageData.email}\nMessage: \n${input}`
        );
        setMessageStep(4);
        break;
      case 4:
        if (input.toLowerCase() === "y") {
          handleSubmitMessage();
        } else if (input.toLowerCase() === "n") {
          setTerminalOutput("Message sending canceled.");
          resetMessageProcess();
        } else {
          setTerminalOutput("Invalid input. Please type 'Y' or 'N'.");
        }
        break;
      default:
        setTerminalOutput("An error occurred. Please try the command again.");
        resetMessageProcess();
        break;
    }
  };

  const handleHelpCommand = () => {
    setTerminalOutput(
      "/help - Shows a list of commands\n" +
        "/message - Share a message/job opportunity with me\n" +
        "/ask <question> - Ask a Chatbot a question about this site\n" +
        "/play <game> - Play one of my games\n" +
        "/bug <report> - Leave notice of a bug you found\n" +
        "/feedback <suggestion> - Suggest improvements\n"
    );
  };

  // Ask command: write prompt to Firestore and wait for response
  const handleAskCommand = async (argument: string) => {
    const MAX_PROMPT_LENGTH = 1200;
    const MAX_REQUESTS = 5;
    const WINDOW_MS = 5 * 60 * 1000;

    if (!argument) {
      setTerminalOutput(
        "Glad you'd like to learn more!\n" +
          "Please provide a question after '/ask'. For example, \n" +
          "\n" +
          "'/ask How do I leave a testimonial?'\n" +
          "\n" +
          "This utilizes Google Gemini with custom instructions to answer most questions you may have!"
      );
      return;
    }

    if (argument.length > MAX_PROMPT_LENGTH) {
      setTerminalOutput("Please shorten your question (max ~1200 characters).");
      return;
    }

    const now = Date.now();
    const recent = askTimestamps.filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_REQUESTS) {
      setTerminalOutput(
        "You've hit the limit for now. Please wait a few minutes before sending another question."
      );
      return;
    }

    setAskTimestamps([...recent, now]);
    setIsLoading(true);
    let unsubscribe: (() => void) | undefined;

    try {
      const { db, collection, addDoc, onSnapshot, serverTimestamp } =
        await loadFirestoreDeps();
      const prompt = argument;
      const docRef = await addDoc(collection(db, "generate"), {
        prompt,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      unsubscribe = onSnapshot(docRef, (snap) => {
        const data = snap.data();
        if (!data) return;
        if (data.error) {
          setTerminalOutput("Error: " + data.error);
          setIsLoading(false);
          unsubscribe?.();
          return;
        }
        if (data.response) {
          setTerminalOutput("Website Support: " + data.response);
          setIsLoading(false);
          unsubscribe?.();
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        setTerminalOutput("Error: " + error.message);
      } else {
        setTerminalOutput("An unknown error occurred.");
      }
      setIsLoading(false);
    }
  };

  const handleMessageCommand = () => {
    if (session?.user?.email) {
      setMessageData({
        name: session.user.name || "",
        email: session.user.email,
        message: "",
      });
      setTerminalOutput("Please enter your message:");
      setMessageStep(3);
    } else {
      setTerminalOutput("Please enter your name:");
      setMessageStep(1);
    }
  };

  const handlePlayCommand = (argument: string) => {
    if (argument) {
      switch (argument.toLowerCase()) {
        case "cyberwordle":
          window.location.href = "/cyberwordle";
          break;
        case "snake":
          window.location.href = "/snake";
          break;
        case "pong":
          window.location.href = "/pong";
          break;
        default:
          setTerminalOutput(
            "Unknown game. Available games: CyberWordle, Snake, Pong."
          );
      }
    } else {
      setTerminalOutput(
        "A thrill-seeker I see! I have a few options for you!\n" +
          "You must specify a game after '/play'. For example,\n" +
          "\n" +
          "'/play CyberWordle'\n" +
          "\n" +
          "CyberWordle, Pong, Snake\n" +
          "More games coming in the future!"
      );
    }
  };

  const handleBugCommand = (argument: string) => {
    if (argument) {
      addBugReport(argument).then(() => {
        setTerminalOutput(`Bug report submitted! Your report: ${argument}`);
      });
    } else {
      setTerminalOutput(
        "Ah! You found a pesky bug, did you?\n" +
          "Please provide a report after '/bug'. For example, \n" +
          "\n" +
          "'/bug Profile information not updating after saving changes'\n" +
          "\n" +
          "You submit the report, I'll get to squishing!"
      );
    }
  };

  const handleFeedbackCommand = (argument: string) => {
    if (argument) {
      addFeedback(argument).then(() => {
        setTerminalOutput(`Feedback submitted! Your suggestion: ${argument}`);
      });
    } else {
      setTerminalOutput(
        "Creative genius! You want to suggest improvements?\n" +
          "Please provide a suggestion after '/feedback'. For example, \n" +
          "\n" +
          "'/feedback Add some new games!'\n" +
          "\n" +
          "I'm always open to suggestions!"
      );
    }
  };

  const processCommand = () => {
    setLastCommand(currentInput);
    const inputParts = currentInput.trim().split(" ");
    const command = inputParts[0];
    const argument = inputParts.slice(1).join(" ");

    switch (command) {
      case "/help":
        handleHelpCommand();
        break;
      case "/ask":
        handleAskCommand(argument);
        break;
      case "/message":
        handleMessageCommand();
        break;
      case "/play":
        handlePlayCommand(argument);
        break;
      case "/bug":
        handleBugCommand(argument);
        break;
      case "/feedback":
        handleFeedbackCommand(argument);
        break;
      default:
        setTerminalOutput(
          "Unknown command. Type /help for a list of commands."
        );
    }
    setCurrentInput("");
  };

  const resetMessageProcess = () => {
    setMessageStep(0);
    setMessageData({ name: "", email: "", message: "" });
  };

  const handleSubmitMessage = async () => {
    try {
      const { db, collection, addDoc, serverTimestamp } =
        await loadFirestoreDeps();
      await addDoc(collection(db, "connect"), {
        name: messageData.name,
        email: messageData.email,
        message: messageData.message,
        time: serverTimestamp(),
      });
      setTerminalOutput("Message sent successfully!");
      resetMessageProcess();
    } catch (error) {
      console.error("Failed to send message:", error);
      setTerminalOutput("Failed to send message. Please try again.");
      resetMessageProcess();
    }
  };

  // Chat button positioning
  useEffect(() => {
    const initialPosition = window.innerHeight - 190;
    setButtonTop(initialPosition);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setButtonTop(window.scrollY + window.innerHeight - 70);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatUsername = (username: string | null | undefined): string => {
    return username ? username.toLowerCase().replace(/ /g, "") : "guest";
  };

  const handleDownloadClick = () => {
    if (session) {
      window.open("/api/resume", "_blank");
    } else {
      signIn("google", {
        callbackUrl: `${window.location.origin}/`,
        prompt: "select_account",
      });
    }
  };

  const technicalSkills = [
    { skill: "Custom Software Implementation", level: 85 },
    { skill: "IT/Customer Support", level: 90 },
    { skill: "Technical Training", level: 90 },
    { skill: "Virtualization/Lab Environment", level: 75 },
    { skill: "Networking", level: 65 },
    { skill: "Risk Management", level: 80 },
    { skill: "Installation and Support Documentation", level: 85 },
    { skill: "Oracle Simphony POS/EMC", level: 65 },
    { skill: "Support Ticket/Implementation Tracking", level: 65 },
    { skill: "Javascript, HTML, Tailwind CSS", level: 75 },
    { skill: "SQLExpress, MySQL, SQLLite", level: 75 },
    { skill: "Google Firebase", level: 75 },
    { skill: "Scripting (Batch, SQL, PowerShell, Python)", level: 75 },
    { skill: "Office 365 Suite", level: 95 },
    { skill: "Windows 7 + Up, Windows Server 2016 + Up", level: 90 },
    { skill: "Ubuntu, Kali Linux", level: 80 },
  ];

  return (
    <>
      <motion.button
        id="chatbotButton"
        className={styles.chatbotbutton}
        style={{ top: `${buttonTop}px` }}
        onClick={() => setIsChatVisible(!isChatVisible)}
        variants={chatBotVariant}
        initial="visible"
        viewport={{ once: true }}
      >
        Chat
      </motion.button>
      <AnimatePresence>
        {isChatVisible && (
          <motion.div
            className={styles.terminalcontainer}
            style={{
              top: `${buttonTop - terminalHeight}px`,
              right: "20px",
              position: "fixed",
              zIndex: 1100,
            }}
            variants={chatBotVariant}
            initial="hidden"
            animate="visible"
            exit="hidden"
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
      </AnimatePresence>

      <div className={styles.layoutContainer}>
        <div className={styles.heroSection}>
          <motion.div
            className={styles.logoContainer}
            variants={fadeInVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Image
              src={Logo}
              alt="Zach Vivian's Logo"
              fill
              sizes="(max-width: 900px) 70vw, 420px"
              placeholder="blur"
              priority
              style={{ objectFit: "contain" }}
            />
          </motion.div>

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
              {greeting}, I'm <strong>Zachary Vivian</strong>
            </motion.h1>
            <motion.div
              className={styles.infoContainer}
              variants={fadeInVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className={styles.textLoopContainer}>
                <h2>
                  <strong>{displayWord}</strong>
                </h2>
              </div>
              <p className={styles.infoContainerText}>
                I am a cybersecurity professional currently working for On The
                Mark Solutions as an Implementation and Support Specialist.
                Click{" "}
                <a
                  href="#"
                  onClick={() =>
                    window.open("@/../Risk_Management_Plan.pdf", "_blank")
                  }
                  className={styles.hyperlink}
                >
                  here
                </a>{" "}
                to view a Risk Management Plan final project I completed during
                college relating to a real-life company and its assets. If you'd
                like to learn more about my experience, projects, and technical
                skills, scroll below. Questions? Press 'Chat' in the lower right
                corner to open a terminal window to ask a bot any questions you
                have about my site.
              </p>

              <div className={styles.buttonContainer}>
                <Link
                  className={styles.button}
                  href={session ? "/contact" : "#"}
                  onClick={(e) => {
                    if (!session) {
                      e.preventDefault();
                      signIn("google", {
                        callbackUrl: "/contact",
                        prompt: "select_account",
                      });
                    }
                  }}
                >
                  Contact
                </Link>
                <Link href="/testimonials" passHref>
                  <button className={styles.button}>Testimonials</button>
                </Link>
                <Link href="/blog" passHref>
                  <button className={styles.button}>Blog</button>
                </Link>
              </div>
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
                    alt="A photo of Zachary Vivian at the Garden of the Gods overlooking Pike's Peak in Colorado Springs, Colorado"
                    placeholder="blur"
                    priority
                    sizes="(max-width: 900px) 85vw, 800px"
                  />
                </CarouselItem>
                <CarouselItem className={styles.image}>
                  <Image
                    src={Zach}
                    alt="A picture of Zachary Vivian on a hike near Fish Creek Falls in Steamboat Springs, Colorado"
                    placeholder="blur"
                    sizes="(max-width: 900px) 85vw, 800px"
                  />
                </CarouselItem>
                <CarouselItem className={styles.image}>
                  <Image
                    src={Squad}
                    alt="Zachary Vivian and his buddies on a hike near Nederland, Colorado"
                    placeholder="blur"
                    sizes="(max-width: 900px) 85vw, 800px"
                  />
                </CarouselItem>
                <CarouselItem className={styles.image}>
                  <Image
                    src={Turbo}
                    alt="Image of Zachary Vivian's dog, Turbo"
                    placeholder="blur"
                    sizes="(max-width: 900px) 85vw, 800px"
                  />
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </motion.div>
        </div>

        <div className={styles.secondarySection}>
          <div className={styles.cardsGrid}>
            <div className={styles.cardsColumn}>
              <motion.div
                className={styles.card}
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <p>
                  <strong>Education: </strong>I graduated from The University of Wisconsin -
                  Platteville, with a Bachelor of Science in Cybersecurity and a Minor in
                  Business Administration in May 2024.
                </p>
              </motion.div>
              <motion.div
                className={styles.card}
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <p>
                  <strong>About Me: </strong>My academic journey has fueled a
                  passion for specializing in either penetration testing or
                  incident response, with the goal of safeguarding your
                  organization against sophisticated cyber threats and
                  vulnerabilities. As a diligent and quick learner, I am keen on
                  employing advanced analytical tools to thoroughly evaluate
                  potential security breaches. My proficiency in applying
                  cybersecurity frameworks and conducting comprehensive risk
                  assessments enables me to develop strategic approaches to
                  bolster your cybersecurity posture. My ambition is to
                  contribute to your team by not only preempting and mitigating
                  cyber attacks through robust security protocols but also
                  ensuring a resilient and adaptive security infrastructure.
                </p>
              </motion.div>
              <motion.div
                className={styles.card}
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <p>
                  <strong>Senior Project:</strong> Our senior project integrates
                  our cumulative knowledge of the software development
                  lifecycle, focusing on creating virtual labs for educational
                  use. My team's role involves developing scalable containers
                  and pre-configured virtual machines for Windows and Linux,
                  utilizing Proxmox VE. This allows professors to effortlessly
                  assign and auto-grade lab assignments, providing a practical,
                  hands-on learning experience for students. This initiative
                  highlights our capability to apply theoretical concepts to
                  real-world challenges, enhancing the educational toolkit for
                  future academic use. Due to some difficulties the team had
                  with the UI towards the end of the project, I quickly remade
                  the entire UI with the experience I had gained from making
                  this website. If you'd like to check out the template, visit
                  my GitHub profile from the 'Contact' page or simply click{" "}
                  <a
                    href="https://angular-cyberlabs-app.vercel.app/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.hyperlink}
                  >
                    this link
                  </a>
                  . Login with usernames <strong>student</strong> or{" "}
                  <strong>teacher</strong> and the secure password,{" "}
                  <strong>password</strong>, to view this template built in
                  Angular. This does not have any security implementations, the
                  MySQL database, or the Proxmox VE environment built in with it
                  since it's being shown publicly on my GitHub profile.
                </p>
              </motion.div>
              <motion.div
                className={styles.card}
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <p>
                  <strong>Hobbies:</strong> In my leisure hours, I'm passionate
                  about exploring the great outdoors, often found backpacking
                  with my friends and my dog, Turbo, by my side. Beyond these
                  adventures, I have a keen interest in photography and
                  longboarding, which allows me to appreciate the world's beauty
                  from different perspectives. Additionally, I dedicate time to
                  personal projects, like developing this website, which not
                  only fuels my creativity but also sharpens my technical
                  skills. Besides that, I enjoy spending the rest of my time
                  playing video games and spending time with family and friends.
                </p>
              </motion.div>
              <motion.div
                className={styles.card}
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <p>
                  <strong>
                    On The Mark Solutions -- Implementation and Support
                    Specialist (2024-Current):
                  </strong>{" "}
                  The primary point of contact for OTMS's clients throughout the
                  implementation process + ongoing support. Creating accurate
                  documentation for user guides and troubleshooting resources,
                  configuring POS software to meet client-specific requirements,
                  providing technical training to clients, and
                  resolving/troubleshooting issues. Also responsible for
                  planning implementation timelines, coordinating with
                  cross-functional teams, and ensuring a smooth transition for
                  clients adopting new software solutions.
                </p>
              </motion.div>
              <motion.div
                className={styles.card}
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <p>
                  <strong>Lands' End -- Orderfiller (2022-2024):</strong> Worked
                  independently in a fast-paced environment picking clothing
                  orders and sorting pieces. Also worked in the shipping
                  department loading truck trailers with packed merchandise.
                </p>
              </motion.div>
            </div>
            <div className={styles.cardsColumn}>
              <motion.div
                className={styles.card}
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h3 className={styles.skillSectionTitle}>
                  <strong>Technical Skills:</strong>
                </h3>
                {technicalSkills.map((techSkill) => (
                  <SkillBar
                    key={techSkill.skill}
                    skill={techSkill.skill}
                    level={techSkill.level}
                  />
                ))}
              </motion.div>
              <motion.div
                className={styles.card}
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <p>
                  <strong>
                    Blain's Farm & Fleet -- Automotive Sales Associate
                    (2019-2023):
                  </strong>{" "}
                  During most of my college, I worked part time at F&F
                  supervising and training the automotive sales department
                  employees on customer service, special orders, and planograms.
                  Worked alongside management to implement the new warehouse
                  management system. Forklift Certified and DOT Hazards trained,
                  assisted in the warehouse unloading freight trucks, loading
                  customer vehicles, and building equipment and floor models.
                  Also worked in the Automotive Service Center as an advisor to
                  set up vehicle appointments and order tires.
                </p>
              </motion.div>
              <motion.div
                className={styles.card}
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <p>
                  <strong>
                    House on the Rock -- Food Service Worker (2017-2019):
                  </strong>{" "}
                  Between my Junior and Senior years of high school, I worked at
                  the popular tourist attraction and resort directing guests and
                  answering questions, performed general housekeeping and
                  cleaning displays as well as changing decorational themes for
                  seasonal events. Ended up working in the pizza restaurant as
                  well as the ice cream shop serving guests.
                </p>
              </motion.div>
            </div>
          </div>

          <motion.div
            className={styles.buttonContainer}
            variants={fadeInVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <button
              onClick={handleDownloadClick}
              className={styles.downloadResumeButton}
            >
              {session ? "Download Resume" : "Log In to Download Resume"}
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
