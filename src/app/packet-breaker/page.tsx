import React from "react";
import PacketBreaker from "./packet-breaker";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Packet Breaker - Zachary Vivian's Portfolio Website",
  description:
    "Play Packet Breaker! A hacker-themed Breakout — bounce a data packet off your node to smash through firewall blocks, built in TypeScript!",
};

function page() {
  return <PacketBreaker />;
}

export default page;
