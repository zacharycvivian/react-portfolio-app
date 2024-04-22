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
          <p>
            <strong>Email:</strong> zacharycvivian@icloud.com
            <br />
            <span className={styles.subtext}>
              Personal Email for Job Opportunities Only
            </span>
          </p>
        </motion.div>
        <motion.div
          className={styles.card}
          onClick={() => handleTel("+16085740816")}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {" "}
          <p>
            <strong>Phone:</strong> +1 608-574-0816
            <br />
            <span className={styles.subtext}>Personal Cell Phone</span>
          </p>
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
          <p>
            <strong>LinkedIn: </strong>zacharycvivian
            <br />
            <span className={styles.subtext}>Connect With Me</span>
          </p>
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
          <p>
            <strong>X (Twitter): </strong>zacharycvivian
            <br />
            <span className={styles.subtext}>View My Profile</span>
          </p>
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
          <p>
            <strong>GitHub:</strong> zacharycvivian
            <br />
            <span className={styles.subtext}>View My Repositories</span>
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
        {" "}
        <button onClick={downloadVCard} className={styles.downloadButton}>
          Add Contact
        </button>
      </motion.div>
    </div>
  );
};

export default ContactPage;
