import React from "react";
import Snake from "./snake";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Snake - Zachary Vivian's Personal Website",
  description:
    "Play Snake! A throwback to the 90's Nokia classic, created in typescript!"
};

function page() {
  return <Snake/>;
}

export default page;