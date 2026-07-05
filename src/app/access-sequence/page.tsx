import React from "react";
import AccessSequence from "./access-sequence";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access Sequence - Zachary Vivian's Portfolio Website",
  description:
    "Play Access Sequence! A hacker-themed take on Simon — memorize and repeat the ever-growing access code, built in TypeScript!",
};

function page() {
  return <AccessSequence />;
}

export default page;
