import React from "react";
import CipherCross from "./cipher-cross";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cipher Cross - Zachary Vivian's Portfolio Website",
  description:
    "Play Cipher Cross! A cybersecurity-themed crossword — decode every across and down clue to crack the grid, built in TypeScript!",
};

function page() {
  return <CipherCross />;
}

export default page;
