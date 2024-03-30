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
    x: 0, // End at the original position
    transition: { duration: 0.5 },
  },
  hidden: {
    opacity: 0,
    scale: 0.85,
    x: -150, // Start 100 pixels to the left
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
    { skill: "React/Next.js", level: 40 },
    { skill: "Proxmox VE and Docker", level: 85 },
    { skill: "MongoDB/MySQL/Firebase", level: 85 },
    { skill: "C/C++/Java", level: 75 },
    { skill: "Python", level: 65 },
    { skill: "Windows Powershell", level: 70 },
    { skill: "Office 365", level: 90 },
    { skill: "MacOS + Terminal", level: 90 },
    { skill: "Kali Linux + Tools", level: 80 },
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
            Administration.
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
            for future academic use.
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
