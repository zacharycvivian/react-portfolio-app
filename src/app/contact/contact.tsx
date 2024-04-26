"use client";
import React, { useEffect } from "react";
import styles from "./contact.module.css";
import { useSession, signIn } from "next-auth/react";
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

// Function to trigger the download of a vCard (.vcf file) for contact information
const downloadVCard = () => {
  const link = document.createElement("a");
  link.href = "@/../zcvivian_ContactCard.vcf";
  link.download = "ZacharyVivian.vcf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// The ContactPage component that renders the contact information section of the website
const ContactPage = () => {
  const { data: session, status } = useSession();

  // Effect hook to redirect unauthenticated users to sign-in page
  useEffect(() => {
    if (status !== "loading" && !session) {
      signIn();
    }
  }, [session, status]);

  if (status === "loading" || !session) {
    // Using inline styles for troubleshooting
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          position: "fixed",
          top: 0,
          left: 0,
          backgroundColor: "#fff",
          color: "#000",
          fontSize: "24px",
          zIndex: 1000,
        }}
      >
        Loading...
      </div>
    );
  }

  const handleExternalNavigation = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const handleMailTo = (emailAddress: string) => {
    window.location.href = `mailto:${emailAddress}`;
  };

  const handleTel = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };
  return (
    <div className={styles.container}>
      <motion.h2
        className={styles.sectionTitle}
        variants={fadeInVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        Contact Me:
        <span className={styles.subtext}>Click a Card to Visit</span>
      </motion.h2>
      <div className={styles.section}>
        <motion.div
          className={styles.card}
          onClick={() => handleMailTo("zacharycvivian@icloud.com")}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg
                viewBox="0 0 15 15"
                width="30" // Scaled up to match other icons
                height="30" // Scaled up to match other icons
                fill="currentColor" // Using currentColor to adapt to CSS color settings
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 2C0.447715 2 0 2.44772 0 3V12C0 12.5523 0.447715 13 1 13H14C14.5523 13 15 12.5523 15 12V3C15 2.44772 14.5523 2 14 2H1ZM1 3L14 3V3.92494C13.9174 3.92486 13.8338 3.94751 13.7589 3.99505L7.5 7.96703L1.24112 3.99505C1.16621 3.94751 1.0826 3.92486 1 3.92494V3ZM1 4.90797V12H14V4.90797L7.74112 8.87995C7.59394 8.97335 7.40606 8.97335 7.25888 8.87995L1 4.90797Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <p>
              <strong>Email:</strong> zacharycvivian@icloud.com
              <br />
              <span className={styles.subtext}>
                Personal Email for Job Opportunities Only
              </span>
            </p>
          </div>
        </motion.div>
        <motion.div
          className={styles.card}
          onClick={() => handleTel("+16085740816")}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg
                viewBox="0 0 15 15"
                width="30" // Scaled up to match other icons
                height="30" // Scaled up to match other icons
                fill="currentColor" // Using currentColor to adapt to CSS color settings
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 2.5C4 2.22386 4.22386 2 4.5 2H10.5C10.7761 2 11 2.22386 11 2.5V12.5C11 12.7761 10.7761 13 10.5 13H4.5C4.22386 13 4 12.7761 4 12.5V2.5ZM4.5 1C3.67157 1 3 1.67157 3 2.5V12.5C3 13.3284 3.67157 14 4.5 14H10.5C11.3284 14 12 13.3284 12 12.5V2.5C12 1.67157 11.3284 1 10.5 1H4.5ZM6 11.65C5.8067 11.65 5.65 11.8067 5.65 12C5.65 12.1933 5.8067 12.35 6 12.35H9C9.1933 12.35 9.35 12.1933 9.35 12C9.35 11.8067 9.1933 11.65 9 11.65H6Z" />
              </svg>
            </div>
            <p>
              <strong>Phone:</strong> +1 608-574-0816
              <br />
              <span className={styles.subtext}>Personal Cell Phone</span>
            </p>
          </div>
        </motion.div>
        <motion.div
          className={styles.card}
          onClick={() =>
            handleExternalNavigation(
              "https://www.linkedin.com/in/zacharycvivian"
            )
          }
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg
                width="30"
                height="30"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid"
                viewBox="0 0 256 256"
              >
                <path
                  d="M218.123 218.127h-37.931v-59.403c0-14.165-.253-32.4-19.728-32.4-19.756 0-22.779 15.434-22.779 31.369v60.43h-37.93V95.967h36.413v16.694h.51a39.907 39.907 0 0 1 35.928-19.733c38.445 0 45.533 25.288 45.533 58.186l-.016 67.013ZM56.955 79.27c-12.157.002-22.014-9.852-22.016-22.009-.002-12.157 9.851-22.014 22.008-22.016 12.157-.003 22.014 9.851 22.016 22.008A22.013 22.013 0 0 1 56.955 79.27m18.966 138.858H37.95V95.967h37.97v122.16ZM237.033.018H18.89C8.58-.098.125 8.161-.001 18.471v219.053c.122 10.315 8.576 18.582 18.89 18.474h218.144c10.336.128 18.823-8.139 18.966-18.474V18.454c-.147-10.33-8.635-18.588-18.966-18.453"
                  fill="currentColor" // Using currentColor to adapt to CSS color settings
                  />
              </svg>
            </div>
            <p>
              <strong>LinkedIn:</strong> zacharycvivian
              <br />
              <span className={styles.subtext}>Connect With Me</span>
            </p>
          </div>
        </motion.div>
        <motion.div
          className={styles.card}
          onClick={() =>
            handleExternalNavigation("https://twitter.com/zacharycvivian")
          }
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30" // Setting width to 40 for consistency
                height="30" // Setting height to 40 for consistency
                viewBox="0 0 1200 1227" // Original viewbox retained
                preserveAspectRatio="xMidYMid meet"
                fill="currentColor" // Using currentColor to adapt to CSS color settings
              >
                <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z" />
              </svg>
            </div>
            <p>
              <strong>X: </strong>zacharycvivian
              <br />
              <span className={styles.subtext}>Follow Me on X</span>
            </p>
          </div>
        </motion.div>
        <motion.div
          className={styles.card}
          onClick={() =>
            handleExternalNavigation("https://github.com/zacharycvivian")
          }
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg
                viewBox="0 0 256 250"
                width="30" // Adjusted width to match other icons
                height="30" // Adjusted height to match other icons
                fill="currentColor" // Using currentColor to adapt to CSS color settings
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
              >
                <path d="M128.001 0C57.317 0 0 57.307 0 128.001c0 56.554 36.676 104.535 87.535 121.46 6.397 1.185 8.746-2.777 8.746-6.158 0-3.052-.12-13.135-.174-23.83-35.61 7.742-43.124-15.103-43.124-15.103-5.823-14.795-14.213-18.73-14.213-18.73-11.613-7.944.876-7.78.876-7.78 12.853.902 19.621 13.19 19.621 13.19 11.417 19.568 29.945 13.911 37.249 10.64 1.149-8.272 4.466-13.92 8.127-17.116-28.431-3.236-58.318-14.212-58.318-63.258 0-13.975 5-25.394 13.188-34.358-1.329-3.224-5.71-16.242 1.24-33.874 0 0 10.749-3.44 35.21 13.121 10.21-2.836 21.16-4.258 32.038-4.307 10.878.049 21.837 1.47 32.066 4.307 24.431-16.56 35.165-13.12 35.165-13.12 6.967 17.63 2.584 30.65 1.255 33.873 8.207 8.964 13.173 20.383 13.173 34.358 0 49.163-29.944 59.988-58.447 63.157 4.591 3.972 8.682 11.762 8.682 23.704 0 17.126-.148 30.91-.148 35.126 0 3.407 2.304 7.398 8.792 6.14C219.37 232.5 256 184.537 256 128.002 256 57.307 198.691 0 128.001 0Zm-80.06 182.34c-.282.636-1.283.827-2.194.39-.929-.417-1.45-1.284-1.15-1.922.276-.655 1.279-.838 2.205-.399.93.418 1.46 1.293 1.139 1.931Zm6.296 5.618c-.61.566-1.804.303-2.614-.591-.837-.892-.994-2.086-.375-2.66.63-.566 1.787-.301 2.626.591.838.903 1 2.088.363 2.66Zm4.32 7.188c-.785.545-2.067.034-2.86-1.104-.784-1.138-.784-2.503.017-3.05.795-.547 2.058-.055 2.861 1.075.782 1.157.782 2.522-.019 3.08Zm7.304 8.325c-.701.774-2.196.566-3.29-.49-1.119-1.032-1.43-2.496-.726-3.27.71-.776 2.213-.558 3.315.49 1.11 1.03 1.45 2.505.701 3.27Zm9.442 2.81c-.31 1.003-1.75 1.459-3.199 1.033-1.448-.439-2.395-1.613-2.103-2.626.301-1.01 1.747-1.484 3.207-1.028 1.446.436 2.396 1.602 2.095 2.622Zm10.744 1.193c.036 1.055-1.193 1.93-2.715 1.95-1.53.034-2.769-.82-2.786-1.86 0-1.065 1.202-1.932 2.733-1.958 1.522-.03 2.768.818 2.768 1.868Zm10.555-.405c.182 1.03-.875 2.088-2.387 2.37-1.485.271-2.861-.365-3.05-1.386-.184-1.056.893-2.114 2.376-2.387 1.514-.263 2.868.356 3.061 1.403Z" />
              </svg>
            </div>
            <p>
              <strong>GitHub:</strong> zacharycvivian
              <br />
              <span className={styles.subtext}>View My Repositories</span>
            </p>
          </div>
        </motion.div>
      </div>
      <motion.div
        className={styles.buttonContainer}
        variants={fadeInVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {" "}
        <button onClick={downloadVCard} className={styles.downloadButton}>
          Add Contact
        </button>
      </motion.div>
    </div>
  );
};

export default ContactPage;
