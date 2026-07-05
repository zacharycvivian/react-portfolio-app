"use client";
/**
 * Chatbot — the floating terminal assistant on the Home page.
 *
 * This is the most interactive part of the page, so it's isolated into its own
 * client island. Keeping it here means the heavy Firebase/Firestore SDK is
 * lazy-loaded (see `loadFirestoreDeps`) and only ships once a visitor actually
 * opens the terminal, rather than blocking the initial Home render.
 *
 * Commands: /help, /ask, /message, /play, /bug, /feedback.
 */
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import type { Firestore } from "firebase/firestore";
import styles from "../page.module.css";

/* Gel morph: the terminal buds out of the chat button in the corner and
 * wobbles into place like a droplet (underdamped spring), then gets sucked
 * back into the button on close. transformOrigin is set on the element. */
const chatBotVariant = {
  hidden: {
    opacity: 0,
    scale: 0.12,
    y: 24,
    transition: { type: "spring" as const, stiffness: 380, damping: 30 },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 270, damping: 16, mass: 0.9 },
  },
  exit: {
    opacity: 0,
    scale: 0.12,
    y: 24,
    transition: { duration: 0.3 },
  },
};

type FirestoreDeps = {
  db: Firestore;
  collection: typeof import("firebase/firestore").collection;
  addDoc: typeof import("firebase/firestore").addDoc;
  doc: typeof import("firebase/firestore").doc;
  onSnapshot: typeof import("firebase/firestore").onSnapshot;
  serverTimestamp: typeof import("firebase/firestore").serverTimestamp;
};

let firestoreDepsPromise: Promise<FirestoreDeps> | null = null;

/** Lazily imports Firebase + Firestore the first time the chatbot needs them. */
const loadFirestoreDeps = async (): Promise<FirestoreDeps> => {
  if (!firestoreDepsPromise) {
    firestoreDepsPromise = Promise.all([
      import("@/../firebase"),
      import("firebase/firestore"),
    ]).then(([firebaseClient, firestore]) => ({
      db: firebaseClient.db as Firestore,
      collection: firestore.collection,
      addDoc: firestore.addDoc,
      doc: firestore.doc,
      onSnapshot: firestore.onSnapshot,
      serverTimestamp: firestore.serverTimestamp,
    }));
  }
  return firestoreDepsPromise;
};

// Best-effort: ask the server to stamp the IP + signed-in identity onto a doc
// the client just created. Defined at module scope so it never disrupts the
// chat flow. The server derives IP/identity itself — we only send what to tag.
const auditDoc = (collection: string, id: string): void => {
  void fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collection, id }),
  }).catch(() => {
    // Auditing failures are intentionally swallowed.
  });
};

export default function Chatbot() {
  const { data: session } = useSession();
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [messageStep, setMessageStep] = useState(0);
  const [messageData, setMessageData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [askTimestamps, setAskTimestamps] = useState<number[]>([]);

  // Firestore helpers
  const addFeedback = async (feedback: string): Promise<void> => {
    const { db, collection, addDoc, serverTimestamp } = await loadFirestoreDeps();
    const email = session?.user?.email || "user not logged in";
    const ref = await addDoc(collection(db, "feedback"), {
      email,
      feedback,
      time: serverTimestamp(),
    });
    auditDoc("feedback", ref.id);
  };

  const addBugReport = async (bugDescription: string): Promise<void> => {
    const { db, collection, addDoc, serverTimestamp } = await loadFirestoreDeps();
    const email = session?.user?.email || "user not logged in";
    const ref = await addDoc(collection(db, "bugs"), {
      email,
      bugs: bugDescription,
      time: serverTimestamp(),
    });
    auditDoc("bugs", ref.id);
  };

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
          `Confirm sending this message (Y/N):\nName: ${messageData.name}\nEmail: ${messageData.email}\nMessage: \n${input}`,
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
        "/play <game> - Launch a game (or just /play to open the arcade)\n" +
        "/bug <report> - Leave notice of a bug you found\n" +
        "/feedback <suggestion> - Suggest improvements\n",
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
          "This utilizes Google Gemini with custom instructions to answer most questions you may have!",
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
        "You've hit the limit for now. Please wait a few minutes before sending another question.",
      );
      return;
    }

    setAskTimestamps([...recent, now]);
    setIsLoading(true);
    let unsubscribe: (() => void) | undefined;

    try {
      // Create the chat server-side so the IP rate limit + validation can't be
      // bypassed; the server stamps IP/identity and returns the new doc id.
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: argument }),
      });

      if (res.status === 429) {
        setTerminalOutput(
          "You've hit the limit for now. Please wait a few minutes before sending another question.",
        );
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to submit your question.");

      const { id } = (await res.json()) as { id: string };
      const { db, doc, onSnapshot } = await loadFirestoreDeps();

      unsubscribe = onSnapshot(doc(db, "generate", id), (snap) => {
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
    // No game specified — open the arcade hub with all the games.
    if (!argument) {
      window.location.href = "/games";
      return;
    }
    const routes: Record<string, string> = {
      cyberwordle: "/cyberwordle",
      wordle: "/cyberwordle",
      snake: "/snake",
      pong: "/pong",
      cyberbird: "/cyberbird",
      "cyber bird": "/cyberbird",
      flappy: "/cyberbird",
      "cyber runner": "/cyber-runner",
      cyberrunner: "/cyber-runner",
      jetpack: "/cyber-runner",
      joyride: "/cyber-runner",
      runner: "/cyber-runner",
      "trace run": "/trace-run",
      tracerun: "/trace-run",
      "temple run": "/trace-run",
      temple: "/trace-run",
      trace: "/trace-run",
      "data flow": "/data-flow",
      dataflow: "/data-flow",
      flow: "/data-flow",
      "stack jump": "/stack-jump",
      stackjump: "/stack-jump",
      doodle: "/stack-jump",
      "doodle jump": "/stack-jump",
      "packet siege": "/packet-siege",
      packetsiege: "/packet-siege",
      siege: "/packet-siege",
      "angry birds": "/packet-siege",
      angrybirds: "/packet-siege",
      "malware sweeper": "/malware-sweeper",
      malwaresweeper: "/malware-sweeper",
      minesweeper: "/malware-sweeper",
      sweeper: "/malware-sweeper",
      sudoku: "/sudoku",
      "word search": "/word-search",
      wordsearch: "/word-search",
      "cipher cross": "/cipher-cross",
      ciphercross: "/cipher-cross",
      crossword: "/cipher-cross",
      ping: "/ping",
      "binary breach": "/binary-breach",
      binarybreach: "/binary-breach",
      "2048": "/binary-breach",
      "access sequence": "/access-sequence",
      accesssequence: "/access-sequence",
      simon: "/access-sequence",
      "packet breaker": "/packet-breaker",
      packetbreaker: "/packet-breaker",
      breakout: "/packet-breaker",
      "decryption terminal": "/decryption-terminal",
      decryptionterminal: "/decryption-terminal",
      decrypt: "/decryption-terminal",
      typing: "/decryption-terminal",
    };
    const dest = routes[argument.toLowerCase().trim()];
    if (dest) {
      window.location.href = dest;
    } else {
      setTerminalOutput(
        "Unknown game. Type '/play' on its own to open the arcade, or try:\n" +
          "Trace Run, Cyber Runner, Stack Jump, Packet Siege, Data Flow,\n" +
          "Malware Sweeper, Sudoku, Word Search, Cipher Cross, Ping,\n" +
          "Binary Breach, Access Sequence, Packet Breaker, Decryption Terminal,\n" +
          "Cyber Bird, CyberWordle, Snake, Pong.",
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
          "You submit the report, I'll get to squishing!",
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
          "I'm always open to suggestions!",
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
        setTerminalOutput("Unknown command. Type /help for a list of commands.");
    }
    setCurrentInput("");
  };

  const resetMessageProcess = () => {
    setMessageStep(0);
    setMessageData({ name: "", email: "", message: "" });
  };

  const handleSubmitMessage = async () => {
    try {
      const { db, collection, addDoc, serverTimestamp } = await loadFirestoreDeps();
      const ref = await addDoc(collection(db, "connect"), {
        name: messageData.name,
        email: messageData.email,
        message: messageData.message,
        time: serverTimestamp(),
      });
      auditDoc("connect", ref.id);
      setTerminalOutput("Message sent successfully!");
      resetMessageProcess();
    } catch (error) {
      console.error("Failed to send message:", error);
      setTerminalOutput("Failed to send message. Please try again.");
      resetMessageProcess();
    }
  };

  const chatButtonOffset = 20;
  const chatButtonSize = 50;
  const chatSpacing = 16;
  const terminalOffset = chatButtonOffset + chatButtonSize + chatSpacing;
  const terminalId = "chatbotTerminal";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const applyFixedPositions = () => {
      const btn = document.getElementById("chatbotButton");
      const terminal = document.getElementById(terminalId);
      if (btn) {
        btn.style.position = "fixed";
        btn.style.bottom = `${chatButtonOffset}px`;
        btn.style.right = "20px";
        btn.style.left = "";
        btn.style.top = "";
        btn.style.zIndex = "1200";
      }
      if (terminal) {
        terminal.style.position = "fixed";
        terminal.style.bottom = `${terminalOffset}px`;
        terminal.style.right = "20px";
        terminal.style.left = "";
        terminal.style.top = "";
        terminal.style.zIndex = "1100";
      }
    };
    // Add a style tag as a final override to survive unexpected CSS
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-chatbot-style", "true");
    styleEl.innerHTML = `
#chatbotButton { position: fixed !important; bottom: ${chatButtonOffset}px !important; right: 20px !important; z-index: 1200 !important; }
#${terminalId} { position: fixed !important; bottom: ${terminalOffset}px !important; right: 20px !important; z-index: 1100 !important; }
`;
    document.head.appendChild(styleEl);

    applyFixedPositions();
    window.addEventListener("scroll", applyFixedPositions);
    window.addEventListener("resize", applyFixedPositions);
    return () => {
      window.removeEventListener("scroll", applyFixedPositions);
      window.removeEventListener("resize", applyFixedPositions);
      document.head.removeChild(styleEl);
    };
  }, [chatButtonOffset, terminalOffset, terminalId]);

  const formatUsername = (username: string | null | undefined): string => {
    return username ? username.toLowerCase().replace(/ /g, "") : "guest";
  };

  if (!isMounted) return null;

  return createPortal(
    <>
      <motion.button
        id="chatbotButton"
        className={styles.chatbotbutton}
        style={{
          position: "fixed",
          bottom: chatButtonOffset,
          right: 20,
          zIndex: 1200,
        }}
        onClick={() => setIsChatVisible(!isChatVisible)}
        whileTap={{ scale: 0.82 }}
        transition={{ type: "spring", stiffness: 500, damping: 14 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092a10 10 0 1 0-4.777-4.719"/>
        </svg>
      </motion.button>
      <motion.div
        id={terminalId}
        className={styles.terminalcontainer}
        style={{
          position: "fixed",
          bottom: terminalOffset,
          right: 20,
          zIndex: 1100,
          pointerEvents: isChatVisible ? "auto" : "none",
          // Grow from the bottom-right corner, where the chat button lives.
          transformOrigin: "100% 110%",
        }}
        variants={chatBotVariant}
        initial="hidden"
        animate={isChatVisible ? "visible" : "hidden"}
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
    </>,
    document.body,
  );
}
