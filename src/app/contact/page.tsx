"use client";
import React from "react";
import styles from "./contact.module.css";
import Link from "next/link";

const downloadVCard = () => {
  const link = document.createElement("a");
  link.href = "@/../zcvivian_ContactCard.vcf";
  link.download = "ZacharyVivian.vcf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ContactPage = () => {
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
      <Link href="/snake" legacyBehavior>
        <div className={styles.apple}></div>
      </Link>
      <h2 className={styles.sectionTitle}>
        Contact Me:
        <span className={styles.subtext}>Click a Card to Visit</span>
      </h2>
      <div className={styles.section}>
        <div
          className={styles.card}
          onClick={() => handleMailTo("zacharycvivian@icloud.com")}
        >
          <p>
            <strong>Email:</strong> zacharycvivian@icloud.com
            <br />
            <span className={styles.subtext}>
              Personal Email for Job Opportunities Only
            </span>
          </p>
        </div>
        <div className={styles.card} onClick={() => handleTel("+16085740816")}>
          <p>
            <strong>Phone:</strong> +1 608-574-0816
            <br />
            <span className={styles.subtext}>Personal Cell Phone</span>
          </p>
        </div>
        <div
          className={styles.card}
          onClick={() =>
            handleExternalNavigation(
              "https://www.linkedin.com/in/zacharycvivian"
            )
          }
        >
          <p>
            <strong>LinkedIn: </strong>zacharycvivian
            <br />
            <span className={styles.subtext}>Connect With Me</span>
          </p>
        </div>
        <div
          className={styles.card}
          onClick={() =>
            handleExternalNavigation("https://github.com/zacharycvivian")
          }
        >
          <p>
            <strong>GitHub:</strong> zacharycvivian
            <br />
            <span className={styles.subtext}>View My Repositories</span>
          </p>
        </div>
        <div
          className={styles.card}
          onClick={() =>
            handleExternalNavigation(
              "https://chat.openai.com/g/g-N5n358sXE-all-in-one-workflow-assistant"
            )
          }
        >
          <p>
            <strong>ChatGPT:</strong> All-in-One Workflow Assistant
            <br />
            <span className={styles.subtext}>
              My AI Assistant (Helped Me Make this Website!)
            </span>
          </p>
        </div>
      </div>
      <div className={styles.buttonContainer}>
        <button onClick={downloadVCard} className={styles.downloadButton}>
          Add Contact
        </button>
      </div>
    </div>
  );
};

export default ContactPage;
