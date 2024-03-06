import React from "react";
import styles from "./about.module.css";
import { Metadata } from "next";

const metadata: Metadata = {
  title: "About",
  description: "Learn more about me!",
};

interface Skill {
  skill: string;
  level: number;
}

const getSkillLevelLabel = (level: number): string => {
  if (level <= 40) return "Beginner";
  if (level <= 60) return "Intermediate";
  if (level <= 85) return "Advanced";
  return "Skilled";
};

const SkillBar: React.FC<Skill> = ({ skill, level }) => {
  const levelLabel = getSkillLevelLabel(level);

  return (
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

const AboutPage = () => {
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
  ];
  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>About Me:</h2>
      <div className={styles.section}>
        <div className={styles.card}>
          <p>
            I am going to be graduating University of Wisconsin - Platteville
            May 2024 with a degree in Cybersecurity and a minor in Business
            Administration. I am interested in learning penetration testing or
            incident response to protect companies from potential threats and
            vulnerabilities. I am a fast learner and am interested in using
            intrusion detection and prevention systems to analyze threats and
            prevent future attacks by implementing security protocols.
          </p>
        </div>
        <div className={styles.card}>
          <p>
            <strong>Education:</strong> The University of Wisconsin -
            Platteville, Bachelor of Science in Cybersecurity, Minor in Business
            Administration.
          </p>
        </div>
        <div className={styles.card}>
          <p>
            <strong>Senior Project:</strong> Throughout my last year at
            Platteville, we worked on a real-life development scenario creating
            a CyberLabs environment for the department to use to make
            cybersecurity labs available to students. Professors are able to
            create custom lab instructions alongside attaching one of our
            already pre-configured virtual machines, which automatically get
            graded upon completion and post the student's grade to Canvas.
            Combining all of our previous knowledge on the software development
            life cycle, we had to collaborate and communicate effectively to
            meet sprint deadlines.
          </p>
        </div>
        <div className={styles.card}>
          <p>
            <strong>Hobbies:</strong> : In my free time, I love to spend time
            outdoors hiking and backpacking alongside my buddies and my dog,
            Turbo. Some of my other hobbies include working on and detailing
            cars, playing video games with friends, and spending time on
            personal projects.
          </p>
        </div>
        <div className={styles.card}>
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
        </div>
        <div className={styles.card}>
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
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Experience:</h2>
      <div className={styles.section}>
        <div className={styles.card}>
          <p>
            While I may not yet have much experience in the professional
            cybersecurity industry, I am fast at learning new technologies and
            software. I have a desire for learning more about intrusion
            detection and prevention systems to analze threats and potential
            vulnerabilities to prevent future cyber attacks.
          </p>
        </div>
        <div className={styles.card}>
          <p>
            <strong>Lands' End -- Orderfiller (2022-2024):</strong> Worked
            independently in a fast-paced environment picking orders and sorting
            clothing. Also worked in shipping loading truck trailers with packed
            merchandise.
          </p>
        </div>
        <div className={styles.card}>
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
        </div>
        <div className={styles.card}>
          <p>
            <strong>
              House on the Rock -- Food Service Worker (2017-2019):{" "}
            </strong>
            Worked at the popular tourist attraction directing guests and
            answering questions. General housekeeping and cleaning displays as
            well as changing themes for seasonal events. Worked in the pizza
            restaurant and the ice cream shop serving guests.
          </p>
        </div>
        <div className={styles.buttonContainer}>
          <a
            href="@/../zcvivian_Resume.pdf"
            download
            className={styles.downloadResumeButton}
          >
            Download my Resume
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
