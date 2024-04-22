import React from "react";
import About from "./about";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About - Zachary Vivian's Portfolio Website",
  description:
    "Learn more about Zach Vivian's personal experience, education, and passions. Here, you can also download a copy of his resume!"
};

function page() {
  return <About/>;
}

export default page;