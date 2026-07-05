import React from "react";
import Sudoku from "./sudoku";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sudoku - Zachary Vivian's Portfolio Website",
  description:
    "Play Sudoku! Fill the grid so every row, column, and box holds 1–9. Uniquely-solvable puzzles generated in TypeScript!",
};

function page() {
  return <Sudoku />;
}

export default page;
