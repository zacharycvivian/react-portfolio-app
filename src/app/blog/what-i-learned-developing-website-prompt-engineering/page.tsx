import React from "react";
import Learned from "./learned";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "What I've Learned From Developing My Own Website Using Prompt Engineering - Blog - Zachary Vivian's Portfolio Website",
  description:
    "This article shares my personal experience with my first time trying a full-stack development project!",
  alternates: {
    canonical: "/blog/what-i-learned-developing-website-prompt-engineering",
  },
};

function page() {
  return <Learned />;
}

export default page;
