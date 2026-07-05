import React from "react";
import DecryptionTerminal from "./decryption-terminal";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Decryption Terminal - Zachary Vivian's Portfolio Website",
  description:
    "Play Decryption Terminal! A hacker-themed typing game — decrypt the falling packets by typing them before they breach the firewall, built in TypeScript!",
};

function page() {
  return <DecryptionTerminal />;
}

export default page;
