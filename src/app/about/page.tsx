import React from "react";
import About from "./about";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Zach Vivian"
};

function page() {
  return <About />;
}

export default page;