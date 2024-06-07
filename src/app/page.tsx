"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, model } from "@/../firebase";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "@/../public/HeaderLogo.png";
import Zach from "@/../public/Zach.jpg";
import Turbo from "@/../public/Turbo.jpg";
import Squad from "@/../public/Squad.jpg";
import Mountains from "@/../public/Mountains.jpg";

// Variants for animations
const fadeInVariant = {
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
  hidden: {
    opacity: 0,
    scale: 1,
    y: 100,
    transition: { duration: 0.15 },
  },
};

const chatBotVariant = {
  hidden: { opacity: 0, scale: 0.5, x: 200, y: 200 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
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

// Get label for skill level
const getSkillLevelLabel = (level: number): string => {
  if (level <= 40) return "Beginner";
  if (level <= 60) return "Intermediate";
  if (level <= 85) return "Advanced";
  return "Proficient";
};

// SkillBar component to display skill level
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

export default function Home() {
  const { data: session } = useSession();
  const [buttonTop, setButtonTop] = useState(20);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const texts = [
    "INCIDENT RESPONSE",
    "ASSET PROTECTION",
    "THREAT INTELLIGENCE",
    "VULNERABILITY ASSESSMENT",
    "PENETRATION TESTING",
    "RISK MANAGEMENT",
    "DATA PROTECTION",
    "NETWORK SECURITY",
  ];
  const [displayWord, setDisplayWord] = useState(texts[0]);
  const [transitionIndex, setTransitionIndex] = useState(0);
  const terminalHeight = 300;
  const [messageStep, setMessageStep] = useState(0);
  const [messageData, setMessageData] = useState({
    name: "",
    email: "",
    message: "",
  });

  // Add feedback to Firestore
  const addFeedback = async (feedback: string): Promise<void> => {
    const email = session?.user?.email || "user not logged in";
    await addDoc(collection(db, "feedback"), {
      email,
      feedback,
      time: serverTimestamp(),
    });
  };

  // Add bug report to Firestore
  const addBugReport = async (bugDescription: string): Promise<void> => {
    const email = session?.user?.email || "user not logged in";
    await addDoc(collection(db, "bugs"), {
      email,
      bugs: bugDescription,
      time: serverTimestamp(),
    });
  };

  // Effect to handle text transitions
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

  // Effect to handle loading animation
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
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading]);

  // Handle enter key for terminal input
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

  // Handle message input for different steps
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
          `Confirm sending this message (Y/N):\nName: ${messageData.name}\nEmail: ${messageData.email}\nMessage: ${input}`
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
          setTerminalOutput(
            "Invalid input. Please type 'Y' to confirm or 'N' to cancel."
          );
        }
        break;
      default:
        setTerminalOutput("An error occurred. Please try the command again.");
        resetMessageProcess();
        break;
    }
  };

  // Handler for the /help command
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

  // Handler for the /ask command
  const handleAskCommand = async (argument: string) => {
    if (argument) {
      setIsLoading(true);
      try {
        // Add prompt instructions
        const promptInstructions = `
          I want you to act as a helpful and friendly AI assistant on Zachary Vivian's website homepage. Zach is a University of Wisconsin - Platteville graduate, with a bachelor of science degree in Cybersecurity and minor in Business Administration. Your goal is to help direct the user towards any information they’d like to learn about him. Please refrain from assisting them with other tasks other than basic questions about Zach or information they can find on the internet. Do not assist the user with code generation, rather direct them towards a resource like ChatGPT/Zach’s GPT that he designed called the ‘All-in-One Programming Assistant’ (https://chat.openai.com/g/g-N5n358sXE-all-in-one-programming-assistant).  

          LOGGING IN: The purpose of logging in on this website is to provide Zach with the user’s information to verify it and contact them, and to have their occupation and employer visible if they choose to leave a testimonial. They can log in by pressing the user icon in the top right of the page, in the header, and then sign in with their Google account. After logging in, they can click on their profile picture in the same spot to edit their profile and add more information if they choose to do so. 
          HOME PAGE: This is the default landing page, where you can view basic information about Zach such as his resume, skillset, and experience. 
          ABOUT PAGE: If the user wants to view more information about frameworks for his website, they can head to the ‘about’ page by clicking on the 'About this Website' button in the footer or click menu icon in the top left of the page to open the sidebar and click on the ‘about’ button to view this information.   
          CONTACT PAGE: The contact page is also available in the sidebar (or the user can click on 'Contact' from the top of the home page), but requires authentication to view that sensitive information. If they prefer to not sign in, there are still a few links you may provide them with. If the user asks for his LinkedIn: https://www.linkedin.com/in/zacharycvivian If the user asks for his GitHub: https://github.com/zacharycvivian If the user asks for his Twitter/X: https://twitter.com/zacharycvivian If the user asks for his phone number or email, please let them know that they must log in to the website with Google in order to view that information. Once they view this page, they can also scroll to the bottom and add him as a contact with a click of a button.  
          BLOG PAGE: If the user navigates to the blog page from the sidebar, they can find a list of blogs that Zach has posted to learn more about what he is up to and continues to learn about.  TESTIMONIALS PAGE: This page shows all of the professional reviews left by his peers! If the user would like to add one themselves, they must be signed in and add an occupation and employer to their profile so it can be visible in the testimonial!   
          GAMES: In the terminal of the website there are various games available to play using the ‘/play <game>’ command! CyberWordle (a typescript spin-off of the New York Times original game), Snake (a typescript version of the 1970’s original), and Pong (another 70’s classic brought to life in typescript). 
          FEEDBACK/BUGS: The user can submit feedback/suggestions or a bug report through the terminal as well using the '/feedback <suggestion>' or '/bug <report>' commands. 
          MESSAGING: The user can send Zach a message, such as a job opportunity, though the '/message' command. This will guide the user through a step by step process to provide Zach with necessary information to share a message and allow him to get in contact with them. 

          Please end your prompt with an emoji that represents the overall message of your prompt to convey feelings of emotion to the user.
        `;
        const prompt = `${promptInstructions}\n\n${argument}`;

        const result = await model.generateContent(prompt);
        const response = await result.response.text();
        setTerminalOutput("Website Support: " + response);
      } catch (error) {
        if (error instanceof Error) {
          setTerminalOutput("Error: " + error.message);
        } else {
          setTerminalOutput("An unknown error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setTerminalOutput(
        "Glad you'd like to learn more!\n" +
          "Please provide a question after '/ask'. For example, \n" +
          "\n" +
          "'/ask How do I leave a testimonial?'\n" +
          "\n" +
          "This utilizes Google Gemini with custom instructions to answer most questions you may have!"
      );
    }
  };

  // Handler for the /message command
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

  // Handler for the /play command
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

  // Handler for the /bug command
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

  // Handler for the /feedback command
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

  // Process terminal commands
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

  // Reset message process
  const resetMessageProcess = () => {
    setMessageStep(0);
    setMessageData({ name: "", email: "", message: "" });
  };

  // Handle message submission
  const handleSubmitMessage = async () => {
    try {
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

  // Set initial terminal position
  useEffect(() => {
    const initialPosition = window.innerHeight - 190;
    setButtonTop(initialPosition);
  }, []);

  // Handle scroll to adjust button position
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

  // Format username for terminal
  const formatUsername = (username: string | null | undefined): string => {
    return username ? username.toLowerCase().replace(/ /g, "") : "guest";
  };

  // Handle download click
  const handleDownloadClick = () => {
    if (session) {
      window.open("@/../zcvivian_Resume.pdf", "_blank");
    } else {
      signIn("google", { callbackUrl: `${window.location.origin}/` });
    }
  };

  const technicalSkills = [
    { skill: "Windows", level: 70 },
    { skill: "MacOS", level: 95 },
    { skill: "Kali Linux", level: 80 },
    { skill: "Virtualization/Containers", level: 75 },
    { skill: "Risk Management", level: 90 },
    { skill: "Vulnerability Scanning", level: 75 },
    { skill: "Intrusion Detection", level: 65 },
    { skill: "Incident Response", level: 65 },
    { skill: "Python", level: 75 },
    { skill: "Web Development", level: 75 },
    { skill: "Database", level: 75 },
    { skill: "Git", level: 75 },
    { skill: "Office 365", level: 95 },
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
            loading="eager"
          />
        </motion.div>
        <div>
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
              Hi, I'm <strong>Zachary Vivian</strong>
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
                I am a cybersecurity professional looking for new opportunities
                to bolster your business's security. Click{" "}
                <a
                  href="#"
                  onClick={() =>
                    window.open("@/../Risk_Management_Plan.pdf", "_blank")
                  }
                  className={styles.hyperlink}
                >
                  here
                </a>{" "}
                to view a Risk Management Plan I developed relating to a
                real-life company and its assets. Want to learn more about me?
                Scroll below! Questions? Press 'Chat' in the lower right corner
                to open a terminal window and discover new features.
              </p>

              <div className={styles.buttonContainer}>
                <Link
                  className={styles.button}
                  href={session ? "/contact" : "#"}
                  onClick={(e) => {
                    if (!session) {
                      e.preventDefault();
                      signIn();
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
                  <Suspense fallback={<div>Loading...</div>}>
                    <Image
                      src={Mountains}
                      alt="A photo of Zach Vivian at the Garden of the Gods overlooking Pike's Peak in Colorado Springs, Colorado"
                      loading="lazy"
                    />
                  </Suspense>
                </CarouselItem>
                <CarouselItem className={styles.image}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Image
                      src={Zach}
                      alt="A picture of Zach Vivian on a hike near Fish Creek Falls in Steamboat Springs, Colorado"
                      loading="lazy"
                    />
                  </Suspense>
                </CarouselItem>
                <CarouselItem className={styles.image}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Image
                      src={Squad}
                      alt="Zach Vivian and his buddies on a hike near Nederland, Colorado"
                      loading="lazy"
                    />
                  </Suspense>
                </CarouselItem>
                <CarouselItem className={styles.image}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Image
                      src={Turbo}
                      alt="Image of Zach Vivian's dog, Turbo"
                      loading="lazy"
                    />
                  </Suspense>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </motion.div>
          <div className={styles.secondarySection}>
            <div className={styles.leftColumn}>
              <motion.div
                className={styles.card}
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <p>
                  <strong>Education:</strong> The University of Wisconsin -
                  Platteville, Bachelor of Science in Cybersecurity, Minor in
                  Business Administration
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
                  skills.
                </p>
              </motion.div>
            </div>
            <div className={styles.rightColumn}>
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
                  <strong>Lands' End -- Orderfiller (2022-2024):</strong> Worked
                  independently in a fast-paced environment picking orders and
                  sorting clothing. Also worked in shipping loading truck
                  trailers with packed merchandise.
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
                    Blain's Farm & Fleet -- Automotive Sales Associate
                    (2019-2023):{" "}
                  </strong>
                  Supervised and trained department employees on customer
                  service, special orders, and planograms. Worked alongside
                  management to implement a new warehouse management system.
                  Forklift Certified and DOT Hazards trained, assisted in the
                  warehouse unloading freight trucks, loading customer vehicles,
                  and building equipment and floor models. Also worked in the
                  Automotive Service Center as an advisor to set up vehicle
                  appointments and order tires.
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
                    House on the Rock -- Food Service Worker (2017-2019):{" "}
                  </strong>
                  Worked at the popular tourist attraction directing guests and
                  answering questions. General housekeeping and cleaning
                  displays as well as changing themes for seasonal events.
                  Worked in the pizza restaurant and the ice cream shop serving
                  guests.
                </p>
              </motion.div>
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
      </div>
    </>
  );
}
