import React from "react";
import Learned from "./learned";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "What I’ve Learned From Developing my own Website using Prompt Engineering - Blog - Zachary Vivian's Personal Website",
  description:
    "This article shares my personal experience with my first time trying a full-stack development project!"
};

function page() {
  return <Learned/>;
}

export default page;