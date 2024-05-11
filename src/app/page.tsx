"use client";
import { useSession, signIn } from "next-auth/react";
import styles from "./page.module.css";
import Zach from "@/../public/Zach.jpg";
import Turbo from "@/../public/Turbo.jpg";
import Squad from "@/../public/Squad.jpg";
import Mountains from "@/../public/Mountains.jpg";
import Logo from "@/../public/HeaderLogo.png";
import Image from "next/image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import React, { useState, useEffect } from "react";
import { collection, doc, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/../firebase";
import { AnimatePresence, motion } from "framer-motion";

const fadeInVariant = {
  visible: {
    opacity: 1,
    scale: 1,
    y: 0, // End at the original position
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
  hidden: { opacity: 0, scale: 0.5, x: 200, y: 200 }, // Start small from bottom right
  visible: {
    opacity: 1,
    scale: 1, // Overshoot to create a bounce effect
    x: 0,
    y: 0,
    transition: {
      type: "spring", // Using spring physics for the bounce
      stiffness: 400,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    x: 200,
    y: 200, // Move out towards bottom right
    transition: { duration: 0.5 }, // Smoother exit without bounce
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
  return "Skilled";
};

// SkillBar component displays a skill and its proficiency level visually
const SkillBar: React.FC<Skill> = ({ skill, level }) => {
  const levelLabel = getSkillLevelLabel(level);

  return (
    // A row for each skill showing the skill name and a visual representation of the level
    <div className={styles.skillRow}>
      <div className={styles.skillName}>{skill}</div>
      <div className={styles.skillLevelInfo}>
        <div className={styles.skillBar}>
          <div
            className={styles.skillLevel}
            style={{ width: `${level}%` }}
            role="progressbar"
            aria-valuenow={level}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
        <div className={styles.skillLevelLabel}>{levelLabel}</div>
      </div>
    </div>
  );
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
  const [index, setIndex] = useState(0);
  const [displayWord, setDisplayWord] = useState(texts[0]);
  const [transitionIndex, setTransitionIndex] = useState(0);

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
      }, 75); // Adjust the speed of the character transitions as needed

      return () => clearTimeout(timeoutId);
    } else {
      // After completing the transition to the next word, add a pause
      const pauseTimeoutId = setTimeout(() => {
        setIndex((index + 1) % texts.length);
        setTransitionIndex(0);
        setDisplayWord(nextWord); // Ensure displayWord is fully transitioned to nextWord
      }, 2000); // 2-second delay after each word completes its transition

      return () => clearTimeout(pauseTimeoutId);
    }
  }, [transitionIndex, index, texts]);

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
            "/help - Shows a list of commands\n" +
              "/connect - Share a message/job opportunity with me\n" +
              "/ask <question> - Ask a Chatbot a question about this site\n" +
              "/play <game> - Play one of my games!\n" +
              "/bug <report> - Leave notice of a bug you found\n" +
              "/feedback <suggestion> - Suggest improvements\n"
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
                  } else if (doc.exists() && doc.data().error) {
                    setTerminalOutput("Error: " + doc.data().error);
                    setIsLoading(false); // Stop loading animation
                    unsubscribe();
                  }
                },
                (err) => {
                  console.error("Error fetching chat response:", err);
                  setTerminalOutput("Error: " + err.message);
                  setIsLoading(false); // Ensure loading stops on error
                }
              );
            });
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
          break;
        case "/play":
          setTerminalOutput(
            "A thrill-seeker I see! I have a few options for you!\n" +
              "You must specify a game after '/play'. For example,\n" +
              "\n" +
              "'/play CyberWordle'\n" +
              "\n" +
              "CyberWordle, Pong, Snake\n" +
              "More games coming in the future!"
          );
          break;
        case "/connect":
          setTerminalOutput("PROVIDE NAME, EMAIL, MESSAGE--CONFIRM MESSAGE\n");
          break;
        case "/bug":
          setTerminalOutput(
            "Ah! You found a pesky bug, did you?\n" +
              "Please provide a report after '/bug'. For example, \n" +
              "\n" +
              "'/bug Profile information not updating after saving changes'\n" +
              "\n" +
              "You submit the report, I'll get to squishing!"
          );
          break;
        case "/feedback":
          setTerminalOutput(
            "Creative genius! You want to suggest improvements?\n" +
              "Please provide a suggestion after '/feedback'. For example, \n" +
              "\n" +
              "'/feedback Add some new games!'\n" +
              "\n" +
              "I'm always open to suggestions!"
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

  const handleDownloadClick = () => {
    if (session) {
      // Logic for opening the resume in a new tab
      window.open("@/../zcvivian_Resume.pdf", "_blank"); // Adjust the file path as needed
    } else {
      // If the user is not logged in, redirect to the signIn page and then back to the /about page
      signIn("google", { callbackUrl: `${window.location.origin}/` }); // Adjust the provider as needed
    }
  };

  const technicalSkills = [
    { skill: "C/C++/Java", level: 75 },
    { skill: "Python", level: 65 },
    { skill: "Windows Powershell", level: 70 },
    { skill: "Office 365", level: 90 },
    { skill: "MacOS + Terminal", level: 90 },
    { skill: "Kali Linux + Tools", level: 80 },
    { skill: "Proxmox VE and Docker", level: 75 },
    { skill: "React/Next.js", level: 60 },
    { skill: "Angular", level: 40 },
    { skill: "MongoDB/MySQL/Firebase", level: 85 },
    { skill: "GitHub & GitLab", level: 75 },
  ];

  const handleContactClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    if (!session) {
      e.preventDefault(); // Stop the link from navigating
      signIn("google", { callbackUrl: "/contact" }); // Redirect to signIn and then to the contact page
    } else {
    }
  };

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
            exit="hidden" // Ensure the terminal animates out when removed
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
                to bolster your business's security. Want to learn more about
                me? Scroll below!. Questions? Press 'Chat' in the lower right
                corner.
              </p>
              <div className={styles.buttonContainer}>
                <Link
                  className={styles.button}
                  href={session ? "/contact" : "#"}
                  onClick={(e) => {
                    if (!session) {
                      e.preventDefault(); // Stop the link from navigating
                      signIn(); // Redirect to signIn and then to the contact page
                    } else {
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
                  <Image
                    src={Turbo}
                    priority
                    alt="Image of Zach Vivian's dog, Turbo"
                  />
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
                {" "}
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
                {" "}
                <p>
                  <strong>About Me: </strong>My academic journey has fueled a
                  passion for specializing in either penetration testing or
                  incident response, with the goal of safeguarding your
                  organization against sophisticated cyber threats and
                  vulnerabilities. As a diligent and quick learner, I am keen on
                  employing advanced analytical tools to thoroughly evaluate
                  potential security breaches. My
                  proficiency in applying cybersecurity frameworks and
                  conducting comprehensive risk assessments enables me to
                  develop strategic approaches to bolster your cybersecurity
                  posture. My ambition is to contribute to your team by not only
                  preempting and mitigating cyber attacks through robust
                  security protocols but also ensuring a resilient and adaptive
                  security infrastructure.
                </p>
              </motion.div>
              <motion.div
                className={styles.card}
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {" "}
                <p>
                  <strong>Senior Project:</strong> Our senior project integrates
                  our cumulative knowledge of the software development
                  lifecycle, focusing on creating virtual labs for educational
                  use. My team's role involves developing scalable containers
                  and pre-configured virtual machines for Windows and Linux,
                  utilizing Proxmox VE. This allows professors to effortlessly
                  assign and auto-grade lab assignments, providing a practical,
                  hands- on learning experience for students. This initiative
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
                    style={{ textDecoration: "none", color: "teal" }}
                  >
                    this link
                  </a>
                  . Login with usernames <strong>student</strong> or{" "}
                  <strong>teacher</strong> and the secure password,{" "}
                  <strong>password</strong>, to view this template built in
                  Angular. This does not have any security implementations, the
                  MySQL database, or the Proxmox VE environment built in with it
                  since it's being deployed on my GitHub profile.
                </p>
              </motion.div>
              <motion.div
                className={styles.card}
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {" "}
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
                {" "}
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
                {" "}
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
                {" "}
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
                {" "}
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
