'use client'
import React, { useState, useEffect } from "react";
import styles from "./learned.module.css";
import Image from "next/image";
import article1 from "@/../public/article1.png";

const ArticlePage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.articleImageWrapper}>
        <Image
          src={article1}
          alt="An image of a programmer harnessing the power of artifical intelligence while looking at a computer with books flying open around him"
          layout="fill"
          objectFit="cover"
          className={styles.articleImage}
        />
        <div className={styles.imageGradient}></div>
      </div>
      <div className={styles.articleContent}>
        <h2 className={styles.articleTitle}>
          What I’ve Learned From Developing my own Website using Prompt
          Engineering
        </h2>
        <p className={styles.articleDate}>March 15, 2024</p>
        <p className={styles.articleAuthor}>Author: Zachary Vivian | Read Time: 5-7 Mins.</p>
        {/* Example paragraph */}
        <p className={styles.articleText}>
          In "What I’ve Learned From Developing My Own Website Using Prompt
          Engineering," I share a candid journey from novice to confident
          developer, driven by a curiosity for React/Next.js and the innovative
          use of prompt engineering with ChatGPT. Starting with choosing the
          right tools and frameworks for a seamless and scalable web
          application, the narrative delves into overcoming initial hurdles
          through AI assistance, navigating the complexities of prompt
          engineering, and leveraging community support for deeper insights. The
          article emphasizes the critical role of user feedback in optimizing
          the user experience and outlines strategic practices for
          future-proofing the project. Reflecting on personal growth, the author
          appreciates the transformative power of AI in making complex tasks
          manageable and fostering a newfound confidence in programming. Looking
          ahead, there's excitement for exploring new technologies and
          continuing the journey of learning and innovation. This story is not
          just about building a website but about the personal and professional
          evolution encountered along the way.
        </p>
        {/* Subtitle */}
        <h3 className={styles.articleSubtitle}>
          1. First Steps: Laying the Foundations
        </h3>
        {/* Example paragraph for the subtitle section */}
        <p className={styles.articleText}>
          Embarking on the journey of web development as a Cybersecurity
          professional, I decided to go with React/Next.js for its simplicity
          and well-documented nature, which promised a smooth learning curve. In
          previous class projects, I had gone with Angular, but had some issues
          connecting my front and back end together and found React to be a
          better alternative. UI elements, crafted with the help of shadcn.ui
          and UIVerse, were chosen for their modern aesthetic and user-friendly
          interface. Google Firebase served as the backbone for my data storage
          (primarily user accounts and testimonials), as it's ease of
          scalibility ensured that my website could grow without constraints and
          maintain security for protecting user data.
        </p>
        {/* Another Subtitle */}
        <h3 className={styles.articleSubtitle}>
          2. Overcoming Challenges: The Power of AI Assistance
        </h3>
        {/* Another example paragraph for the next subtitle section */}
        <p className={styles.articleText}>
          My initial dive into making my own personal website was fraught with
          challenges, primarily due to my limited experience with web
          development. However, leveraging ChatGPT and my prompt engineering
          skills significantly boosted my productivity. ChatGPT, with its vast
          knowledge base, became an invaluable tool, offering solutions and
          guidance that sped up the development process. I was able to create
          the entirety of this website in a little under two weeks, having no
          experience at all. I believe ChatGPT and other LLMs(Large-Language
          Models) have a promising future, but they currently still have some
          issues.
        </p>
        <h3 className={styles.articleSubtitle}>
          3. Difficulties with Prompt Engineering: Navigating the AI Landscape
        </h3>
        {/* Another example paragraph for the next subtitle section */}
        <p className={styles.articleText}>
          Despite the advantages, working with AI, especially LLMs, presented
          its own set of challenges. I quickly learned that the effectiveness of
          AI assistance hinges on the specificity of the prompts given. This
          realization was both a hurdle and a learning opportunity, teaching me
          the art of crafting precise questions to yield useful answers. It
          isn't quite as simple as saying, "create me a personal website". These
          LLMs will do exactly what you tell them, so it's important you are
          very specific in what you want to create. I've found that giving it as
          much context as possible is probably the most important thing, it
          won't know how to help you unless you tell it what frameworks your
          using, languages, databases, etc. All-in-all, I believe LLMs are still
          a long ways away from taking development jobs, but they can be a
          useful tool to help guide your in the right direction!
        </p>
        <h3 className={styles.articleSubtitle}>
          4. Collaboration and Community: Leaning on Experienced Shoulders
        </h3>
        {/* Another example paragraph for the next subtitle section */}
        <p className={styles.articleText}>
          No development journey is solitary, and mine was no exception. My
          friend,{" "}
          <a
            href="https://www.jordanready.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "blue" }}
          >
            Jordan Ready
          </a>
          , has extensive experience in React/Next.js and became my guide,
          offering insights that only seasoned developers possess. This
          collaboration underscored the importance of community in the tech
          world—-a space where shared knowledge fosters growth and innovation.
          As I said before, ChatGPT still isn't perfect and there were a few
          issues where we decided to set up a call to work out the problem
          together--which ended up being much faster that ChatGPT! If you're
          interested in designing a new website or looking to hire a full-stack
          developer, please check out his page (click the hyperlink on his
          name).
        </p>
        <h3 className={styles.articleSubtitle}>
          5. Optimizing User Experience: The Role of Feedback
        </h3>
        {/* Another example paragraph for the next subtitle section */}
        <p className={styles.articleText}>
          User experience (UX) stands at the core of any successful website. By
          involving friends and family in the testing phase, I was able to
          gather candid feedback, which became instrumental in refining the
          site. This process highlighted minor issues that, once addressed,
          significantly enhanced the overall UX. For example, some UI designs
          and colors were harder to read and navigate for others, so I made
          accomodations to help readability. You always need more than one set
          of eyes on a project, you can't quite design a product with a solution
          for a single person.
        </p>
        <h3 className={styles.articleSubtitle}>
          6. Future-Proofing: Building with Tomorrow in Mind
        </h3>
        {/* Another example paragraph for the next subtitle section */}
        <p className={styles.articleText}>
          Developing a website with the future in mind involved implementing
          scalable solutions, prudent use of global variables, and meticulous
          code commenting. These practices ensured not only a robust foundation
          for the current website but also eased future updates and expansions.
          That being said, if you're interested in viewing the code for this
          website, please check out my GitHub page!
        </p>
        <h3 className={styles.articleSubtitle}>
          7. Personal Growth: Beyond Code
        </h3>
        {/* Another example paragraph for the next subtitle section */}
        <p className={styles.articleText}>
          This project was transformative, taking me from a novice to a
          confident developer. The integration of ChatGPT into my workflow was a
          revelation, making complex tasks manageable and turning my dream of
          creating a website into reality. This journey was not just about
          building a website but also about building confidence and skills that
          will last a lifetime. I pride myself in my ability in teaching myself
          new things, and with my habits of being a perfectionist I'm able to
          quickly create a great product. This of course doesn't only apply to
          web development, I'm actually more interested in working with
          intrusion detection/prevention systems to protect company data. I'm
          currently learning more about Nessus, with hopes of getting a
          professional career in the Cybersecurity field.
        </p>
        <h3 className={styles.articleSubtitle}>
          8. The Road Ahead: Exploring New Horizons
        </h3>
        {/* Another example paragraph for the next subtitle section */}
        <p className={styles.articleText}>
          Looking forward, I do have a few more things I want to implement in my
          website (such as a couple more games and a chat bot to help guide the
          user around my site), but my curiosity drives towards other personal
          projects involving my Raspberry Pi (creating a USB sanitizer) as well
          as a Flipper Zero and a HackRF One (to test my own technologies and
          networks security). These are some simple tools that promise new
          adventures in programming and hardware. These projects represent not
          just the next step in my technological journey but also a commitment
          to lifelong learning and exploration.
        </p>
        <h3 className={styles.articleSubtitle}>
          9. Conclusion: A Journey of a Thousand Miles
        </h3>
        {/* Another example paragraph for the next subtitle section */}
        <p className={styles.articleText}>
          Developing my website was a journey of discovery, challenges, and
          immense personal growth. It taught me the value of precise
          communication with AI, the importance of community, and the impact of
          user feedback. As I look to the future, I am excited about the endless
          possibilities that lie ahead, ready to tackle them with the confidence
          and skills that I have gained.
        </p>
      </div>
    </div>
  );
};

export default ArticlePage;
