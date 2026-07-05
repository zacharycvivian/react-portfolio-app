import React from "react";
import DataFlow from "./data-flow";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Flow - Zachary Vivian's Portfolio Website",
  description:
    "Play Data Flow! A cyber take on Flow Free — route signal cables to connect matching ports and fill the whole grid, built in TypeScript!",
};

function page() {
  return <DataFlow />;
}

export default page;
