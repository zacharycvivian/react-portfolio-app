import React from "react";
import Ping from "./ping";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ping - Zachary Vivian's Portfolio Website",
  description:
    "Play Ping! A hacker-themed reaction test — click the instant the node goes live and measure your latency, built in TypeScript!",
};

function page() {
  return <Ping />;
}

export default page;
