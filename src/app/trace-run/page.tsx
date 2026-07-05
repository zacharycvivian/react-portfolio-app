import React from "react";
import TraceRun from "./trace-run";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trace Run - Zachary Vivian's Portfolio Website",
  description:
    "Play Trace Run! A cyber Temple Run — sprint down a data conduit, switch lanes, jump firewalls and slide under laser gates while a trace closes in, built in TypeScript!",
};

function page() {
  return <TraceRun />;
}

export default page;
