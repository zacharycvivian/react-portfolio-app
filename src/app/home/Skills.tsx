/**
 * Skills — the technical-skills list shown on the Home page.
 *
 * A Server Component: it's static data rendered with native `<progress>` bars,
 * so there's no client JavaScript to ship. It renders the card's inner content;
 * the animated card shell is applied by the Home page.
 */
import React from "react";
import styles from "../page.module.css";

interface Skill {
  skill: string;
  level: number;
}

const getSkillLevelLabel = (level: number): string => {
  if (level <= 40) return "Beginner";
  if (level <= 60) return "Intermediate";
  if (level <= 85) return "Advanced";
  return "Proficient";
};

/** A single labelled skill progress bar. */
function SkillBar({ skill, level }: Skill) {
  return (
    <div className={styles.skillRow}>
      <div className={styles.skillNameContainer}>
        <div className={styles.skillName}>{skill}</div>
        <div className={styles.skillLevelLabel}>{getSkillLevelLabel(level)}</div>
      </div>
      <div className={styles.skillBarContainer}>
        <progress className={styles.skillBar} value={level} max={100} />
      </div>
    </div>
  );
}

const TECHNICAL_SKILLS: Skill[] = [
  { skill: "Custom Software Implementation", level: 90 },
  { skill: "IT/Customer Support", level: 90 },
  { skill: "Technical Training", level: 90 },
  { skill: "Virtualization/Lab Environments", level: 75 },
  { skill: "Networking", level: 65 },
  { skill: "Risk Management", level: 80 },
  { skill: "Installation and Support Documentation", level: 85 },
  { skill: "Oracle Simphony POS/EMC", level: 75 },
  { skill: "Support/Implementation Management", level: 75 },
  { skill: "Software Quality Assurance", level: 85 },
  { skill: "SQLExpress, MySQL, SQLLite", level: 75 },
  { skill: "Basic Scripting (Batch, SQL, PowerShell, Python)", level: 75 },
  { skill: "Office 365 Suite", level: 95 },
  { skill: "Windows 7 + Up, Windows Server 2016 + Up", level: 90 },
  { skill: "Ubuntu, Kali Linux", level: 80 },
];

export default function Skills() {
  return (
    <>
      <h3 className={styles.skillSectionTitle}>
        <strong>Technical Skills:</strong>
      </h3>
      {TECHNICAL_SKILLS.map((techSkill) => (
        <SkillBar key={techSkill.skill} skill={techSkill.skill} level={techSkill.level} />
      ))}
    </>
  );
}
