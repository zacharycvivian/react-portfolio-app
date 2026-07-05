import React from "react";
import CyberBird from "./cyberbird";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cyber Bird - Zachary Vivian's Portfolio Website",
  description:
    "Play Cyber Bird! A hacker-themed twist on the Flappy Bird classic — thrust your data packet through the firewalls, created in TypeScript!",
};

function page() {
  return <CyberBird />;
}

export default page;
