import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/../public/MenuIcon.png";
import Link from "next/link";
import React from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import styles from "./Sidebar.module.css";

function Sidebar() {
  return (
    <div>
      <Sheet>
        <SheetTrigger className={styles.logo}>
          <Image src={Logo} alt="logo" width={80} height={80}></Image>
        </SheetTrigger>
        <SheetContent side={"left"} className={styles.sheetContainer}>
          <SheetHeader>
            <SheetTitle>Discover More</SheetTitle>
            <Button variant={"outline"} className={styles.link}>
              <Link className={styles.links} href={"/"}>
                Home
              </Link>
            </Button>
            <Button variant={"outline"} className={styles.link}>
              <Link className={styles.links} href={"/about"}>
                About
              </Link>
            </Button>
            <Button variant={"outline"} className={styles.link}>
              <Link className={styles.links} href={"/contact"}>
                Contact
              </Link>
            </Button>
            <Button variant={"outline"} className={styles.link}>
              <Link className={styles.links} href={"/projects"}>
                Projects
              </Link>
            </Button>
            <Button variant={"outline"} className={styles.link}>
              <Link className={styles.links} href={"/testimonials"}>
                Testimonials
              </Link>
            </Button>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default Sidebar;
