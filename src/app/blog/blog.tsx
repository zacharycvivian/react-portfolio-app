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
    y: 0, // End at the original position
    transition: { duration: 0.2 },
  },
  hidden: {
    opacity: 0,
    scale: 0.65,
    y: 50,
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
                  What I’ve Learned From Developing my own Website Utilizing
                  Prompt Engineering
                </h3>
                <p className={styles.cardSubtext}>March 15, 2024</p>
                <p>
                  In this article, I dive into my process behind teaching myself
                  web development by creating this website, what I've learned,
                  and what I have planned for the future!
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
