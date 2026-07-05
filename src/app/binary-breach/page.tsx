import React from "react";
import BinaryBreach from "./binary-breach";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Binary Breach - Zachary Vivian's Portfolio Website",
  description:
    "Play Binary Breach! A cyber twist on 2048 where every tile is a power of two — merge them to breach the grid, built in TypeScript!",
};

function page() {
  return <BinaryBreach />;
}

export default page;
