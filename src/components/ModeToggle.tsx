"use client";
import * as React from "react";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import styles from "./ModeToggle.module.css";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <div className={styles.container}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className={styles.iconButton}>
            {currentTheme === "dark" ? ( // Use currentTheme to decide the icon
              <MoonIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
            ) : (
              <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={styles.dropdownContent}>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <strong>System (Default)</strong>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <strong>Light</strong>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <strong>Dark</strong>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("blueberry")}>
            Blueberry
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("pomegranate")}>
            Pomegranate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("safari")}>
            Safari
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
