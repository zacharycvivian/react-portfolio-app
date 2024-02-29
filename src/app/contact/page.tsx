'use client'
import React from 'react';
import styles from './contact.module.css';

const downloadVCard = () => {
  const link = document.createElement('a');
  link.href = '@/../zcvivian_ContactCard.vcf';
  link.download = 'ZacharyVivian.vcf';
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
          <p>Email: <a href="mailto:zacharycvivian@icloud.com">zacharycvivian@icloud.com</a></p>
        </div>
        <div className={styles.card}>
          <p>Phone: <a href="tel:+16085740816">+1 608-574-0816</a></p>
        </div>
        <div className={styles.card}>
          <p>LinkedIn: <a href="https://www.linkedin.com/in/zacharycvivian" target="_blank" rel="noopener noreferrer">zacharycvivian</a></p>
        </div>
        <div className={styles.card}>
          <p>GitHub: <a href="https://github.com/zacharycvivian" target="_blank" rel="noopener noreferrer">zacharycvivian</a></p>
        </div>
      </div>
      <div className={styles.buttonContainer}>
        <button onClick={downloadVCard} className={styles.downloadButton}>
        Add Contact
        </button>
      </div>
    </div>
  );
}

export default ContactPage;
