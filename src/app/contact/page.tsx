import React from "react";
import Contact from "./contact";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - Zachary Vivian's Portfolio Website",
  description:
    "Find a copy of Zach Vivian's contact information and social media profiles. Once logged in, you can also download his contact card!"
};

function page() {
  return <Contact/>;
}

export default page;