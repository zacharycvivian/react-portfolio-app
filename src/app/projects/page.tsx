import React from 'react';
import styles from './projects.module.css';

import { Metadata } from "next";

const metadata: Metadata = {
  title: "CyberWordle",
  description: "Play CyberWordle, a game based off of the original using computer-related 5 letter words!",
};

const AboutPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.aboutMe}>
        <h2>About Me</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.</p>
      </div>
      <div className={styles.education}>
        <h2>Education</h2>
        <p>BS in Computer Science from University X, Class of 20XX.</p>
      </div>
      <div className={styles.experience}>
        <h2>Experience</h2>
        <p>Software Engineer at Company Y since 20XX. Worked on projects Z, A, B.</p>
      </div>
    </div>
  );
}

export default AboutPage;
