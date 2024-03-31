"use client";
import React from "react";
import Link from "next/link";
import styles from "./blog.module.css";
import Image from "next/image";
import article1 from "@/../public/article1.png";
import article2 from "@/../public/article2.png";
import article3 from "@/../public/article3.png";
import { motion } from "framer-motion";

const fadeInVariant = {
  visible: {
    opacity: 1,
    scale: 1,
    x: 0, // End at the original position
    transition: { duration: 0.5 },
  },
  hidden: {
    opacity: 0,
    scale: 0.85,
    x: -150, // Start 100 pixels to the left
  },
};

// BlogPage component to display the blog section of the website
const BlogPage = () => {
  return (
    <div className={styles.container}>
      <motion.h2
        className={styles.sectionTitle}
        variants={fadeInVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        Blog Posts
      </motion.h2>
      <motion.div
        className={styles.section}
        variants={fadeInVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <Link
          href="/blog/what-i-learned-developing-website-prompt-engineering"
          passHref
        >
          <div className={styles.card} style={{ cursor: "pointer" }}>
            <div className={styles.cardContent}>
              <Image
                src={article1}
                alt="An image of a programmer harnessing the power of artifical intelligence while looking at a computer with books flying open around him"
                quality={100}
                className={styles.cardImage}
              />
              <div>
                <h3 className={styles.cardTitle}>
                  What I’ve Learned From Developing my own Website using Prompt
                  Engineering
                </h3>
                <p className={styles.cardSubtext}>March 15, 2024</p>
                <p>
                  In this article, I dive into my process behind creating this
                  website, what I've learned, and what I have planned for the
                  future!
                </p>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
      {/*
      <div className={styles.section}>
        <Link href="/blog/bolster-your-company-security-2024" passHref>
          <div className={styles.card} style={{ cursor: "pointer" }}>
            <div className={styles.cardContent}>
              <Image
                src={article2}
                alt="A visualization of a network within a locked glass case, with encrypted letters and numbers in the background and a tilt-shift model of a company building labeled Your Company inside the case."
                quality={100}
                className={styles.cardImage}
              />
              <div>
                <h3 className={styles.cardTitle}>
                  How to Bolster Your Company's Network Security in 2024
                </h3>
                <p className={styles.cardSubtext}>Coming Soon</p>
                <p>
                  Here's a short summary of what this blog post will cover,
                  giving the reader a glimpse into the content.
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
  */}
      <motion.div
        className={styles.section}
        variants={fadeInVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <Link
          href="/blog/how-future-cybersecurity-changes-using-artifical-intelligence"
          passHref
        >
          <div className={styles.card} style={{ cursor: "pointer" }}>
            <div className={styles.cardContent}>
              <Image
                src={article3}
                alt="The embodiment the integration of AI into cybersecurity, featuring futuristic visuals that represent the impact and innovation of artificial intelligence and machine learning in this field."
                quality={100}
                className={styles.cardImage}
              />
              <div>
                <h3 className={styles.cardTitle}>
                  How the Future of Cybersecurity Will Change using Artificial
                  Intelligence/LLM’s
                </h3>
                <p className={styles.cardSubtext}>March 17, 2024</p>
                <p>
                  In this article, I discuss how the future of cybersecurity
                  will change with the increase in artifical intelligence based
                  technologies, and how we can use them to help secure your
                  business.
                </p>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
};

export default BlogPage;
