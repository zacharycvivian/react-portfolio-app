import React from "react";
import StackJump from "./stack-jump";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stack Jump - Zachary Vivian's Portfolio Website",
  description:
    "Play Stack Jump! A cyber Doodle Jump — auto-bounce up an endless stack of platforms and climb as high as you can, built in TypeScript!",
};

function page() {
  return <StackJump />;
}

export default page;
