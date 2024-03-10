import React from "react";
import Link from "next/link";
import styles from "./blog.module.css";
import Image from "next/image";
import article1 from "@/../public/article1.png";
import article2 from "@/../public/article2.png";
import article3 from "@/../public/article3.png";

const BlogPage = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Blog Posts</h2>
      <div className={styles.section}>
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
                <p className={styles.cardSubtext}>March 10, 2024</p>
                <p>
                  Here's a short summary of what this blog post will cover,
                  giving the reader a glimpse into the content.
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      <div className={styles.section}>
        <Link href="/blog/bolster-your-companies-security-2024" passHref>
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
                  How to Bolster Your Companies Network Security in 2024
                </h3>
                <p className={styles.cardSubtext}>March 10, 2024</p>
                <p>
                  Here's a short summary of what this blog post will cover,
                  giving the reader a glimpse into the content.
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      <div className={styles.section}>
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
                <p className={styles.cardSubtext}>March 10, 2024</p>
                <p>
                  Here's a short summary of what this blog post will cover,
                  giving the reader a glimpse into the content.
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      <h2 className={styles.sectionTitle}>X(Twitter) Feed</h2>
      <div className={styles.section}>
        <div className={styles.card} style={{ cursor: "pointer" }}>
          <p>In this card will display my X/Twitter feed using their API.</p>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
