import React from "react";
import Pong from "./pong";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pong - Zachary Vivian's Personal Website",
  description:
    "Play Pong! A throwback to the 70's classic, created in typescript!"
};

function page() {
  return <Pong/>;
}

export default page;