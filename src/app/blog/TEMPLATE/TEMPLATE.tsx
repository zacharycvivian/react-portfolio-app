import React from "react";
import styles from "./learned.module.css";
import Image from "next/image";
import article1 from "@/../public/article1.png";

const ArticlePage = () => {
    return (
      <div className={styles.container}>
          <div className={styles.articleImageWrapper}>
            <Image
              src={article1}
              alt="Descriptive alt text of the image"
              layout="fill"
              objectFit="cover"
              className={styles.articleImage}
            />
            <div className={styles.imageGradient}></div>
          </div>
          <div className={styles.articleContent}>
            <h2 className={styles.articleTitle}>The Title of Your Article</h2>
            <p className={styles.articleDate}>March 16, 2024</p>
            <p className={styles.articleAuthor}>By Zachary Vivian</p>
            {/* Example paragraph */}
            <p className={styles.articleText}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            {/* Subtitle */}
            <h3 className={styles.articleSubtitle}>Subtitle Section 1</h3>
            {/* Example paragraph for the subtitle section */}
            <p className={styles.articleText}>
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
              aliquip ex ea commodo consequat.
            </p>
            {/* Another Subtitle */}
            <h3 className={styles.articleSubtitle}>Subtitle Section 2</h3>
            {/* Another example paragraph for the next subtitle section */}
            <p className={styles.articleText}>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
            <h3 className={styles.articleSubtitle}>Subtitle Section 3</h3>
            {/* Another example paragraph for the next subtitle section */}
            <p className={styles.articleText}>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
            <h3 className={styles.articleSubtitle}>Subtitle Section 4</h3>
            {/* Another example paragraph for the next subtitle section */}
            <p className={styles.articleText}>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
            <h3 className={styles.articleSubtitle}>Subtitle Section 5</h3>
            {/* Another example paragraph for the next subtitle section */}
            <p className={styles.articleText}>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
            <h3 className={styles.articleSubtitle}>Subtitle Section 6</h3>
            {/* Another example paragraph for the next subtitle section */}
            <p className={styles.articleText}>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
          </div>
      </div>
    );
  };

export default ArticlePage;
