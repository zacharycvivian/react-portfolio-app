import React from "react";
import Gallery from "./gallery";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery - Zachary Vivian's Portfolio Website",
  description: "A photo gallery showcasing Zachary Vivian's work and experiences.",
};

export default function GalleryPage() {
  return <Gallery />;
}
