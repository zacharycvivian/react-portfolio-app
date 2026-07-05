import React from "react";
import WordSearch from "./word-search";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word Search - Zachary Vivian's Portfolio Website",
  description:
    "Play Word Search! Find the hidden cybersecurity terms in the grid by dragging across them, built in TypeScript!",
};

function page() {
  return <WordSearch />;
}

export default page;
