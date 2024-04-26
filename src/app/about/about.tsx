"use client";
import React from "react";
import styles from "./about.module.css";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

// Define Skill interface to type-check the props in SkillBar component
interface Skill {
  skill: string;
  level: number;
}

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

// Function to map skill levels to descriptive labels
const getSkillLevelLabel = (level: number): string => {
  if (level <= 40) return "Beginner";
  if (level <= 60) return "Intermediate";
  if (level <= 85) return "Advanced";
  return "Skilled";
};

// SkillBar component displays a skill and its proficiency level visually
const SkillBar: React.FC<Skill> = ({ skill, level }) => {
  const levelLabel = getSkillLevelLabel(level);

  return (
    // A row for each skill showing the skill name and a visual representation of the level
    <div className={styles.skillRow}>
      <div className={styles.skillName}>{skill}</div>
      <div className={styles.skillLevelInfo}>
        <div className={styles.skillBar}>
          <div
            className={styles.skillLevel}
            style={{ width: `${level}%` }}
            role="progressbar"
            aria-valuenow={level}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
        <div className={styles.skillLevelLabel}>{levelLabel}</div>
      </div>
    </div>
  );
};

// The AboutPage component that houses all content for the about me section
const AboutPage = () => {
  const { data: session } = useSession(); // Destructure to get the session object
  const professionalSkills = [
    { skill: "Problem Solving", level: 90 },
    { skill: "Communication", level: 95 },
    { skill: "Adaptability", level: 90 },
    { skill: "Analytical Mindset", level: 85 },
    { skill: "Dependability", level: 95 },
    { skill: "Attention to Detail", level: 95 },
  ];

  const technicalSkills = [
    { skill: "C/C++/Java", level: 75 },
    { skill: "Python", level: 65 },
    { skill: "Windows Powershell", level: 70 },
    { skill: "Office 365", level: 90 },
    { skill: "MacOS + Terminal", level: 90 },
    { skill: "Kali Linux + Tools", level: 80 },
    { skill: "Proxmox VE and Docker", level: 75 },
    { skill: "React/Next.js", level: 60 },
    { skill: "Angular", level: 40 },
    { skill: "MongoDB/MySQL/Firebase", level: 85 },
    { skill: "GitHub & GitLab", level: 75 },
  ];
  return (
    <div className={styles.container}>
      <motion.h2
        className={styles.sectionTitle}
        variants={fadeInVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        About Me:
      </motion.h2>
      <div className={styles.section}>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {" "}
          <p>
            Set to graduate from the University of Wisconsin-Platteville in May
            2024, with a Bachelor's degree in Cybersecurity accompanied by a
            minor in Business Administration. My academic journey has fueled a
            passion for specializing in either penetration testing or incident
            response, with the goal of safeguarding your organization against
            sophisticated cyber threats and vulnerabilities. As a diligent and
            quick learner, I am keen on employing advanced analytical tools to
            thoroughly evaluate potential security breaches. Beyond technical
            defenses, my proficiency in applying cybersecurity frameworks and
            conducting comprehensive risk assessments enables me to develop
            strategic approaches to bolster your cybersecurity posture. My
            ambition is to contribute to your team by not only preempting and
            mitigating cyber attacks through robust security protocols but also
            ensuring a resilient and adaptive security infrastructure.
          </p>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {" "}
          <p>
            <strong>Education:</strong> The University of Wisconsin -
            Platteville, Bachelor of Science in Cybersecurity, Minor in Business
            Administration <strong>Graduating May 2024</strong>
          </p>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {" "}
          <p>
            <strong>Senior Project:</strong> Our senior project integrates our
            cumulative knowledge of the software development lifecycle, focusing
            on creating virtual labs for educational use. My team's role
            involves developing scalable containers and pre-configured virtual
            machines for Windows and Linux, utilizing Proxmox VE. This allows
            professors to effortlessly assign and auto-grade lab assignments,
            providing a practical, hands- on learning experience for students.
            This initiative highlights our capability to apply theoretical
            concepts to real-world challenges, enhancing the educational toolkit
            for future academic use. Due to some difficulties the team had with
            the UI towards the end of the project, I quickly remade the entire
            UI with the experience I had gained from making this website. If
            you'd like to check out the template, visit my GitHub profile from
            the 'Contact' page or simply click{" "}
            <a
              href="https://angular-cyberlabs-app.vercel.app/login"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "teal" }}
            >
              this link
            </a>
            . Login with usernames <strong>student</strong> or{" "}
            <strong>teacher</strong> and the secure password,{" "}
            <strong>password</strong>, to view this template built in Angular.
            This does not have any security implementations, the MySQL database,
            or the Proxmox VE environment built in with it since it's being
            deployed on my GitHub profile.
          </p>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {" "}
          <p>
            <strong>Hobbies:</strong> In my leisure hours, I'm passionate about
            exploring the great outdoors, often found backpacking with my
            friends and my dog, Turbo, by my side. Beyond these adventures, I
            have a keen interest in photography and longboarding, which allows
            me to appreciate the world's beauty from different perspectives.
            Additionally, I dedicate time to personal projects, like developing
            this website, which not only fuels my creativity but also sharpens
            my technical skills.
          </p>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {" "}
          <h3 className={styles.skillSectionTitle}>
            <strong>Technical Skills:</strong>
          </h3>
          {technicalSkills.map((techSkill) => (
            <SkillBar
              key={techSkill.skill}
              skill={techSkill.skill}
              level={techSkill.level}
            />
          ))}
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {" "}
          <h3 className={styles.skillSectionTitle}>
            <strong>Professional Skills:</strong>
          </h3>
          {professionalSkills.map((proSkill) => (
            <SkillBar
              key={proSkill.skill}
              skill={proSkill.skill}
              level={proSkill.level}
            />
          ))}
        </motion.div>
      </div>
      <motion.h2
        className={styles.sectionTitle}
        variants={fadeInVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        Experience:
      </motion.h2>
      <div className={styles.section}>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {" "}
          <p>
            Although my professional experience in the cybersecurity sector is
            in its early stages, my ability to quickly master new technologies
            and software sets me apart. My keen interest in expanding my
            knowledge of intrusion detection and prevention systems underscores
            my commitment to analyzing threats and identifying potential
            vulnerabilities. This proactive approach is aimed at fortifying
            defenses against future cyber attacks, demonstrating my dedication
            to contributing meaningfully to the field.
          </p>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {" "}
          <p>
            <strong>Lands' End -- Orderfiller (2022-2024):</strong> Worked
            independently in a fast-paced environment picking orders and sorting
            clothing. Also worked in shipping loading truck trailers with packed
            merchandise.
          </p>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {" "}
          <p>
            <strong>
              Blain's Farm & Fleet -- Automotive Sales Associate (2019-2023):{" "}
            </strong>
            Supervised and trained department employees on customer service,
            special orders, and planograms. Worked alongside management to
            implement a new warehouse management system. Forklift Certified and
            DOT Hazards trained, assisted in the warehouse unloading freight
            trucks, loading customer vehicles, and building equipment and floor
            models. Also worked in the Automotive Service Center as an advisor
            to set up vehicle appointments and order tires.
          </p>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {" "}
          <p>
            <strong>
              House on the Rock -- Food Service Worker (2017-2019):{" "}
            </strong>
            Worked at the popular tourist attraction directing guests and
            answering questions. General housekeeping and cleaning displays as
            well as changing themes for seasonal events. Worked in the pizza
            restaurant and the ice cream shop serving guests.
          </p>
        </motion.div>
      </div>
      <motion.h2
        className={styles.sectionTitle}
        variants={fadeInVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        About this Website:
      </motion.h2>
      <div className={styles.section}>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg
                viewBox="0 0 256 228"
                width="40" // Set width to 30
                height="40" // Set height to 30
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid"
                fill="#00D8FF" // SVG fill color, adjust as needed
              >
                <path
                  d="M210.483 73.824a171.49 171.49 0 0 0-8.24-2.597c.465-1.9.893-3.777 1.273-5.621 6.238-30.281 2.16-54.676-11.769-62.708-13.355-7.7-35.196.329-57.254 19.526a171.23 171.23 0 0 0-6.375 5.848 155.866 155.866 0 0 0-4.241-3.917C100.759 3.829 77.587-4.822 63.673 3.233 50.33 10.957 46.379 33.89 51.995 62.588a170.974 170.974 0 0 0 1.892 8.48c-3.28.932-6.445 1.924-9.474 2.98C17.309 83.498 0 98.307 0 113.668c0 15.865 18.582 31.778 46.812 41.427a145.52 145.52 0 0 0 6.921 2.165 167.467 167.467 0 0 0-2.01 9.138c-5.354 28.2-1.173 50.591 12.134 58.266 13.744 7.926 36.812-.22 59.273-19.855a145.567 145.567 0 0 0 5.342-4.923 168.064 168.064 0 0 0 6.92 6.314c21.758 18.722 43.246 26.282 56.54 18.586 13.731-7.949 18.194-32.003 12.4-61.268a145.016 145.016 0 0 0-1.535-6.842c1.62-.48 3.21-.974 4.76-1.488 29.348-9.723 48.443-25.443 48.443-41.52 0-15.417-17.868-30.326-45.517-39.844Zm-6.365 70.984c-1.4.463-2.836.91-4.3 1.345-3.24-10.257-7.612-21.163-12.963-32.432 5.106-11 9.31-21.767 12.459-31.957 2.619.758 5.16 1.557 7.61 2.4 23.69 8.156 38.14 20.213 38.14 29.504 0 9.896-15.606 22.743-40.946 31.14Zm-10.514 20.834c2.562 12.94 2.927 24.64 1.23 33.787-1.524 8.219-4.59 13.698-8.382 15.893-8.067 4.67-25.32-1.4-43.927-17.412a156.726 156.726 0 0 1-6.437-5.87c7.214-7.889 14.423-17.06 21.459-27.246 12.376-1.098 24.068-2.894 34.671-5.345.522 2.107.986 4.173 1.386 6.193ZM87.276 214.515c-7.882 2.783-14.16 2.863-17.955.675-8.075-4.657-11.432-22.636-6.853-46.752a156.923 156.923 0 0 1 1.869-8.499c10.486 2.32 22.093 3.988 34.498 4.994 7.084 9.967 14.501 19.128 21.976 27.15a134.668 134.668 0 0 1-4.877 4.492c-9.933 8.682-19.886 14.842-28.658 17.94ZM50.35 144.747c-12.483-4.267-22.792-9.812-29.858-15.863-6.35-5.437-9.555-10.836-9.555-15.216 0-9.322 13.897-21.212 37.076-29.293 2.813-.98 5.757-1.905 8.812-2.773 3.204 10.42 7.406 21.315 12.477 32.332-5.137 11.18-9.399 22.249-12.634 32.792a134.718 134.718 0 0 1-6.318-1.979Zm12.378-84.26c-4.811-24.587-1.616-43.134 6.425-47.789 8.564-4.958 27.502 2.111 47.463 19.835a144.318 144.318 0 0 1 3.841 3.545c-7.438 7.987-14.787 17.08-21.808 26.988-12.04 1.116-23.565 2.908-34.161 5.309a160.342 160.342 0 0 1-1.76-7.887Zm110.427 27.268a347.8 347.8 0 0 0-7.785-12.803c8.168 1.033 15.994 2.404 23.343 4.08-2.206 7.072-4.956 14.465-8.193 22.045a381.151 381.151 0 0 0-7.365-13.322Zm-45.032-43.861c5.044 5.465 10.096 11.566 15.065 18.186a322.04 322.04 0 0 0-30.257-.006c4.974-6.559 10.069-12.652 15.192-18.18ZM82.802 87.83a323.167 323.167 0 0 0-7.227 13.238c-3.184-7.553-5.909-14.98-8.134-22.152 7.304-1.634 15.093-2.97 23.209-3.984a321.524 321.524 0 0 0-7.848 12.897Zm8.081 65.352c-8.385-.936-16.291-2.203-23.593-3.793 2.26-7.3 5.045-14.885 8.298-22.6a321.187 321.187 0 0 0 7.257 13.246c2.594 4.48 5.28 8.868 8.038 13.147Zm37.542 31.03c-5.184-5.592-10.354-11.779-15.403-18.433 4.902.192 9.899.29 14.978.29 5.218 0 10.376-.117 15.453-.343-4.985 6.774-10.018 12.97-15.028 18.486Zm52.198-57.817c3.422 7.8 6.306 15.345 8.596 22.52-7.422 1.694-15.436 3.058-23.88 4.071a382.417 382.417 0 0 0 7.859-13.026 347.403 347.403 0 0 0 7.425-13.565Zm-16.898 8.101a358.557 358.557 0 0 1-12.281 19.815 329.4 329.4 0 0 1-23.444.823c-7.967 0-15.716-.248-23.178-.732a310.202 310.202 0 0 1-12.513-19.846h.001a307.41 307.41 0 0 1-10.923-20.627 310.278 310.278 0 0 1 10.89-20.637l-.001.001a307.318 307.318 0 0 1 12.413-19.761c7.613-.576 15.42-.876 23.31-.876H128c7.926 0 15.743.303 23.354.883a329.357 329.357 0 0 1 12.335 19.695 358.489 358.489 0 0 1 11.036 20.54 329.472 329.472 0 0 1-11 20.722Zm22.56-122.124c8.572 4.944 11.906 24.881 6.52 51.026-.344 1.668-.73 3.367-1.15 5.09-10.622-2.452-22.155-4.275-34.23-5.408-7.034-10.017-14.323-19.124-21.64-27.008a160.789 160.789 0 0 1 5.888-5.4c18.9-16.447 36.564-22.941 44.612-18.3ZM128 90.808c12.625 0 22.86 10.235 22.86 22.86s-10.235 22.86-22.86 22.86-22.86-10.235-22.86-22.86 10.235-22.86 22.86-22.86Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>React</h3>
              <p>
                React is a declarative, efficient, and flexible JavaScript
                library for building user interfaces. It lets you compose
                complex UIs from small and isolated pieces of code called
                “components”.
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="40"
                height="40"
                viewBox="0 0 48 48"
              >
                <linearGradient
                  id="NRNx2IPDe7PJlJvrxOKgWa_MWiBjkuHeMVq_gr1"
                  x1="24"
                  x2="24"
                  y1="43.734"
                  y2="4.266"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0" stop-color="#0a070a"></stop>
                  <stop offset=".465" stop-color="#2b2b2b"></stop>
                  <stop offset="1" stop-color="#4b4b4b"></stop>
                </linearGradient>
                <circle
                  cx="24"
                  cy="24"
                  r="19.734"
                  fill="url(#NRNx2IPDe7PJlJvrxOKgWa_MWiBjkuHeMVq_gr1)"
                ></circle>
                <rect
                  width="3.023"
                  height="15.996"
                  x="15.992"
                  y="16.027"
                  fill="#fff"
                ></rect>
                <linearGradient
                  id="NRNx2IPDe7PJlJvrxOKgWb_MWiBjkuHeMVq_gr2"
                  x1="30.512"
                  x2="30.512"
                  y1="33.021"
                  y2="18.431"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset=".377" stop-color="#fff" stop-opacity="0"></stop>
                  <stop
                    offset=".666"
                    stop-color="#fff"
                    stop-opacity=".3"
                  ></stop>
                  <stop offset=".988" stop-color="#fff"></stop>
                </linearGradient>
                <rect
                  width="2.953"
                  height="14.59"
                  x="29.035"
                  y="15.957"
                  fill="url(#NRNx2IPDe7PJlJvrxOKgWb_MWiBjkuHeMVq_gr2)"
                ></rect>
                <linearGradient
                  id="NRNx2IPDe7PJlJvrxOKgWc_MWiBjkuHeMVq_gr3"
                  x1="22.102"
                  x2="36.661"
                  y1="21.443"
                  y2="40.529"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset=".296" stop-color="#fff"></stop>
                  <stop
                    offset=".521"
                    stop-color="#fff"
                    stop-opacity=".5"
                  ></stop>
                  <stop offset=".838" stop-color="#fff" stop-opacity="0"></stop>
                </linearGradient>
                <polygon
                  fill="url(#NRNx2IPDe7PJlJvrxOKgWc_MWiBjkuHeMVq_gr3)"
                  points="36.781,38.094 34.168,39.09 15.992,16.027 19.508,16.027"
                ></polygon>
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>Next.js</h3>
              <p>
                Next.js is a React framework that enables functionality such as
                server-side rendering and generating static websites for
                React-based web applications.
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg
                viewBox="0 0 256 154"
                width="40" // Adjusted width to match other icons
                height="40" // Adjusted height to match other icons
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid"
              >
                <defs>
                  <linearGradient
                    x1="-2.778%"
                    y1="32%"
                    x2="100%"
                    y2="67.556%"
                    id="gradient"
                  >
                    <stop stop-color="#2298BD" offset="0%"></stop>
                    <stop stop-color="#0ED7B5" offset="100%"></stop>
                  </linearGradient>
                </defs>
                <path
                  d="M128 0C93.867 0 72.533 17.067 64 51.2 76.8 34.133 91.733 27.733 108.8 32c9.737 2.434 16.697 9.499 24.401 17.318C145.751 62.057 160.275 76.8 192 76.8c34.133 0 55.467-17.067 64-51.2-12.8 17.067-27.733 23.467-44.8 19.2-9.737-2.434-16.697-9.499-24.401-17.318C174.249 14.743 159.725 0 128 0ZM64 76.8C29.867 76.8 8.533 93.867 0 128c12.8-17.067 27.733-23.467 44.8-19.2 9.737 2.434 16.697 9.499 24.401 17.318C81.751 138.857 96.275 153.6 128 153.6c34.133 0 55.467-17.067 64-51.2-12.8 17.067-27.733 23.467-44.8 19.2-9.737-2.434-16.697-9.499-24.401-17.318C110.249 91.543 95.725 76.8 64 76.8Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>Tailwind CSS</h3>
              <p>
                Tailwind CSS is a highly customizable, low-level CSS framework
                that gives you all of the building blocks you need to build
                bespoke designs without any annoying opinionated styles you have
                to fight to override.
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg
                viewBox="0 0 256 262"
                width="40" // Adjusted width to match other icons
                height="40" // Adjusted height to match other icons
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid"
              >
                <path
                  d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                  fill="currentColor"
                />
                <path
                  d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                  fill="currentColor"
                />
                <path
                  d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                  fill="currentColor"
                />
                <path
                  d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>Google Firebase</h3>
              <p>
                Google Firebase is a comprehensive app development platform that
                provides a variety of tools and services, including
                authentication, real-time database, and cloud messaging. It
                offers a robust backend infrastructure to support the
                development of web and mobile applications, with features like
                Firestore for scalable NoSQL databases and a Gemini API
                extension to build a chatbot.
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg
                viewBox="0 0 256 222"
                width="40" // Adjusted width to match other icons
                height="40" // Adjusted height to match other icons
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid"
              >
                <path fill="currentColor" d="m128 0 128 221.705H0z" />
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>Vercel</h3>
              <p>
                Vercel is a cloud platform for static sites and Serverless
                Functions that fits perfectly with your workflow. It enables
                developers to host websites and web services that deploy
                instantly, scale automatically, and require no supervision, all
                with no configuration.
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg
                viewBox="0 0 256 256"
                width="40" // Adjusted width to match other icons
                height="40" // Adjusted height to match other icons
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid"
              >
                <path fill="none" d="M0 0h256v256H0z" />
                <path
                fill="currentColor" // Using currentColor to adapt to CSS color settings
                stroke="currentColor"
                  d="M208 128l-80 80M192 40L40 192"
                />
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>Shadcn/UI</h3>
              <p>
                Shadcn/UI is a modern UI library designed to provide developers
                with lightweight, flexible components that are easy to implement
                in any project. It focuses on performance and minimalist design,
                helping developers build beautiful and responsive interfaces
                efficiently.
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          className={styles.card}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className={styles.svgAndTextContainer}>
            <div className={styles.svgContainer}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                preserveAspectRatio="xMidYMid"
                viewBox="0 0 256 260"
                fill="currentColor" // Using currentColor to adapt to CSS color settings
              >
                <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
              </svg>
            </div>
            <div>
              <h3 className={styles.skillSectionTitle}>ChatGPT</h3>
              <p>
                ChatGPT is an AI language model designed to understand and
                generate human-like text based on the input it receives. Trained
                on a diverse range of internet text, it can provide responses,
                generate content, or assist in various language-related tasks.
                ChatGPT utilizes advanced natural language processing techniques
                to comprehend and generate text across different topics and
                styles, making it a versatile tool for communication, content
                creation, problem-solving, and programming.
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          className={styles.buttonContainer}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {session ? (
            // If the user is logged in, show the download button
            <a
              href="@/../zcvivian_Resume.pdf"
              download
              className={styles.downloadResumeButton}
            >
              Download Resume
            </a>
          ) : (
            // If the user is not logged in, show a disabled button or message
            <motion.div
              className={`${styles.downloadResumeButton} ${styles.linkDisabled}`}
              variants={fadeInVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              Log In to Download Resume
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
