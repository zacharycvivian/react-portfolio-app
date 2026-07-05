import React from "react";
import PacketSiege from "./packet-siege";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Packet Siege - Zachary Vivian's Portfolio Website",
  description:
    "Play Packet Siege! A cyber Angry Birds — sling data packets to smash firewall forts and wipe out the trojans, built in TypeScript!",
};

function page() {
  return <PacketSiege />;
}

export default page;
