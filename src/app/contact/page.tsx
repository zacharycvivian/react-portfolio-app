"use client";
import React from "react";
import styles from "./contact.module.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with me or add me on various social media platforms!",
};

const downloadVCard = () => {
  const link = document.createElement("a");
  link.href = "@/../zcvivian_ContactCard.vcf";
  link.download = "ZacharyVivian.vcf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ContactPage = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Contact Me:</h2>
      <div className={styles.section}>
        <div className={styles.card}>
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:zacharycvivian@icloud.com">
              zacharycvivian@icloud.com
            </a>
            <br />
            <span className={styles.subtext}>Personal Email for Job Opportunities Only</span>
          </p>
        </div>
        <div className={styles.card}>
          <p>
            <strong>Phone: </strong> <a href="tel:+16085740816">+1 608-574-0816</a>
            <br />
            <span className={styles.subtext}>Personal Cell Phone</span>
          </p>
        </div>
        <div className={styles.card}>
          <p>
            <strong>LinkedIn: </strong>{" "}
            <a
              href="https://www.linkedin.com/in/zacharycvivian"
              target="_blank"
              rel="noopener noreferrer"
            >
              zacharycvivian
            </a>
            <br />
            <span className={styles.subtext}>Connect With Me</span>
          </p>
        </div>
        <div className={styles.card}>
          <p>
            <strong>GitHub: </strong>{" "}
            <a
              href="https://github.com/zacharycvivian"
              target="_blank"
              rel="noopener noreferrer"
            >
              zacharycvivian
            </a>
            <br />
            <span className={styles.subtext}>View My Repositories</span>
          </p>
        </div>
        <div className={styles.card}>
          <p>
            <strong>ChatGPT: </strong>{" "}
            <a
              href="https://chat.openai.com/g/g-N5n358sXE-all-in-one-workflow-assistant"
              target="_blank"
              rel="noopener noreferrer"
            >
              All-in-One Workflow Assistant
            </a>
            <br />
            <span className={styles.subtext}>My AI Assistant (Helped Me Make this Website!)</span>
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
