import React from "react";
import Link from "next/link"; 
import styles from "./blog.module.css";
import exampleImage from "@/../public/example.jpg";
import Image from 'next/image';


const BlogPage = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Blog Posts (In Development)</h2>
      <div className={styles.section}>
        <Link href="/blog/example1" passHref>
          <div className={styles.card} style={{ cursor: "pointer" }}>
            <div className={styles.cardContent}>
              <Image src={exampleImage} alt="Blog Post" width={100} height={50} className={styles.cardImage}/> 
              <div>
                <h3 className={styles.cardTitle}>What I’ve Learned From Developing my own Website using Prompt Engineering</h3>
                <p className={styles.cardSubtext}>March 10, 2024</p>
                <p>Here's a short summary of what this blog post will cover, giving the reader a glimpse into the content.</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      <div className={styles.section}>
        <Link href="/blog/example2" passHref>
          <div className={styles.card} style={{ cursor: "pointer" }}>
            <div className={styles.cardContent}>
              <Image src={exampleImage} alt="Blog Post" width={100} height={50} className={styles.cardImage}/> 
              <div>
                <h3 className={styles.cardTitle}>How to Bolster Your Company’s Network Security in 2024</h3>
                <p className={styles.cardSubtext}>March 10, 2024</p>
                <p>Here's a short summary of what this blog post will cover, giving the reader a glimpse into the content.</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      <div className={styles.section}>
        <Link href="/blog/example3" passHref>
          <div className={styles.card} style={{ cursor: "pointer" }}>
            <div className={styles.cardContent}>
              <Image src={exampleImage} alt="Blog Post" width={100} height={50} className={styles.cardImage}/> 
              <div>
                <h3 className={styles.cardTitle}>How the Future of Cybersecurity Will Change using Artificial Intelligence/LLM’s</h3>
                <p className={styles.cardSubtext}>March 10, 2024</p>
                <p>Here's a short summary of what this blog post will cover, giving the reader a glimpse into the content.</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      <h2 className={styles.sectionTitle}>X(Twitter) Stream:</h2>
      <div className={styles.section}>
        <div className={styles.card} style={{ cursor: "pointer" }}>
          <p>In this card will display my X/Twitter feed using their API.</p>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
