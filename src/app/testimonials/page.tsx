import React from "react";
import Testimonials from "./testimonials";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testimonials - Zachary Vivian's Personal Website",
  description:
    "On this page your're able to view testimonials written by Zach Vivian's peers. Once logged in with a completed profile, you can also leave one of your own!"
};

function page() {
  return <Testimonials/>;
}

export default page;