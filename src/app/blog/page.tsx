import React from "react";
import Blog from "./blog";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Zachary Vivian's Personal Website",
  description:
    "Here, you can discover the various articles Zach Vivian has written."
};

function page() {
  return <Blog/>;
}

export default page;