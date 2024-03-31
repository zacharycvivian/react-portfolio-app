import React from "react";
import About from "./contact";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - Zachary Vivian's Personal Website",
  description:
    "Find a copy of Zach Vivian's contact information and social media profiles. Once logged in, you can also download his contact card!"
};

function page() {
  return <About/>;
}

export default page;