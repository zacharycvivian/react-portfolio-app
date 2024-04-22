import React from "react";
import CyberWordle from "./cyberwordle";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CyberWordle - Zachary Vivian's Portfolio Website",
  description:
    "Play CyberWordle! A fun twist to the New York Times classic using programming and cybersecurity terminonlogy, created in typescript!"
};

function page() {
  return <CyberWordle/>;
}

export default page;