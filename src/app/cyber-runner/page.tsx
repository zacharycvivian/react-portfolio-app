import React from "react";
import CyberRunner from "./cyber-runner";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cyber Runner - Zachary Vivian's Portfolio Website",
  description:
    "Play Cyber Runner! A hacker-themed Jetpack Joyride — hold to fire your jetpack, dodge zappers and trace missiles, and grab data bits, built in TypeScript!",
};

function page() {
  return <CyberRunner />;
}

export default page;
