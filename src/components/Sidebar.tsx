"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react"; // Import useSession
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import styles from "./Sidebar.module.css";
import { db } from "@/../firebase";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";

const SPRING = 'cubic-bezier(0.16, 1, 0.3, 1)';

function navStyle(index: number, open: boolean): React.CSSProperties {
  if (!open) return {};
  return {
    animation: `navItemIn 240ms ${SPRING} both`,
    animationDelay: `${160 + index * 60}ms`,
  };
}

function Sidebar() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { data: session } = useSession(); // Use the session
  // Function to close the sheet and navigate
  const handleCloseAndNavigate = () => {
    setSheetOpen(false); // Close the sheet
  };

  const handleContactClick = (
    e: React.MouseEvent<HTMLElement>
  ) => {
    if (!session) {
      e.preventDefault(); // Stop the link from navigating
      signIn("google", { callbackUrl: "/contact", prompt: "select_account" }); // Redirect to signIn and then to the contact page
    } else {
      handleCloseAndNavigate(); // This closes the sheet and allows the navigation
    }
  };

  const handleGalleryClick = () => {
    handleCloseAndNavigate();
  };


  return (
    <div>
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            // Radix sets pointer-events:none on body when the Sheet opens and
            // restores it after the close animation ends. With our spring easing
            // override the animationend timing can drift, leaving body locked.
            // Restore after the sheet's 300ms close animation + a small buffer.
            setTimeout(() => {
              document.body.style.pointerEvents = '';
            }, 350);
          }
        }}>
        <SheetTrigger
          className={styles.logo}
          onClick={() => setSheetOpen(true)}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
              fill="currentColor"
            ></path>
          </svg>
        </SheetTrigger>
        <SheetContent side={"left"} className={styles.sheetContainer}>
          <SheetHeader>
            <SheetTitle>Discover More</SheetTitle>
          </SheetHeader>
          <div className={styles.navWrapper}>
            <Button variant={"outline"} className={styles.link} style={navStyle(0, isSheetOpen)}>
              <Link
                className={styles.links}
                href={"/"}
                onClick={handleCloseAndNavigate}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: "8px" }}
                  >
                    <path
                      d="M7.07926 0.222253C7.31275 -0.007434 7.6873 -0.007434 7.92079 0.222253L14.6708 6.86227C14.907 7.09465 14.9101 7.47453 14.6778 7.71076C14.4454 7.947 14.0655 7.95012 13.8293 7.71773L13 6.90201V12.5C13 12.7761 12.5 13 12.5 13H2.50002C2.22388 13 2.00002 12.7761 2.00002 12.5V6.90201L1.17079 7.71773C0.934558 7.95012 0.554672 7.947 0.32229 7.71076C0.0899079 7.47453 0.0930283 7.09465 0.32926 6.86227L7.07926 0.222253ZM7.50002 1.49163L12 5.91831V12H10V8.49999C10 8.22385 9.77617 7.99999 9.50002 7.99999H6.50002C6.22388 7.99999 6.00002 8.22385 6.00002 8.49999V12H3.00002V5.91831L7.50002 1.49163ZM7.00002 12H9.00002V8.99999H7.00002V12Z"
                      fill="currentColor"
                    />
                  </svg>
                  Home
                </div>
              </Link>
            </Button>
            <Button variant={"outline"} className={styles.link} style={navStyle(1, isSheetOpen)} onClick={handleGalleryClick}>
              <Link
                className={styles.links}
                href={"/gallery"}
                onClick={handleCloseAndNavigate}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: "8px" }}
                  >
                    <path
                      d="M5.5 1L4 3H1.5C0.671573 3 0 3.67157 0 4.5V12.5C0 13.3284 0.671573 14 1.5 14H13.5C14.3284 14 15 13.3284 15 12.5V4.5C15 3.67157 14.3284 3 13.5 3H11L9.5 1H5.5ZM7.5 5C9.43300 5 11 6.56700 11 8.5C11 10.4330 9.43300 12 7.5 12C5.56700 12 4 10.4330 4 8.5C4 6.56700 5.56700 5 7.5 5ZM7.5 6.5C6.39543 6.5 5.5 7.39543 5.5 8.5C5.5 9.60457 6.39543 10.5 7.5 10.5C8.60457 10.5 9.5 9.60457 9.5 8.5C9.5 7.39543 8.60457 6.5 7.5 6.5Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                  Gallery
                </div>
              </Link>
            </Button>
            <Button
              variant={"outline"}
              className={`${styles.link} ${
                !session ? styles.linkDisabled : ""
              }`}
              style={navStyle(2, isSheetOpen)}
              onClick={handleContactClick}
            >
              <Link
                className={styles.links}
              href={session ? "/contact" : "#"}
              onClick={(e) => {
                if (!session) {
                  e.preventDefault(); // Stop the link from navigating
                  signIn("google", { callbackUrl: "/contact", prompt: "select_account" }); // Redirect to signIn and then to the contact page
                } else {
                  handleCloseAndNavigate(); // This closes the sheet and allows the navigation
                }
              }}
            >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: "8px" }}
                  >
                    <path
                      d="M1 2C0.447715 2 0 2.44772 0 3V12C0 12.5523 0.447715 13 1 13H14C14.5523 13 15 12.5523 15 12V3C15 2.44772 14.5523 2 14 2H1ZM1 3L14 3V3.92494C13.9174 3.92486 13.8338 3.94751 13.7589 3.99505L7.5 7.96703L1.24112 3.99505C1.16621 3.94751 1.0826 3.92486 1 3.92494V3ZM1 4.90797V12H14V4.90797L7.74112 8.87995C7.59394 8.97335 7.40606 8.97335 7.25888 8.87995L1 4.90797Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className={styles.linkText}>
                    {session ? "Contact" : "Contact (Requires Login)"}
                  </span>
                </div>
              </Link>
            </Button>
            <Button variant={"outline"} className={styles.link} style={navStyle(3, isSheetOpen)}>
              <Link
                className={styles.links}
                href={"/testimonials"}
                onClick={handleCloseAndNavigate}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: "8px" }}
                  >
                    <path
                      d="M12.1464 1.14645C12.3417 0.951184 12.6583 0.951184 12.8535 1.14645L14.8535 3.14645C15.0488 3.34171 15.0488 3.65829 14.8535 3.85355L10.9109 7.79618C10.8349 7.87218 10.7471 7.93543 10.651 7.9835L6.72359 9.94721C6.53109 10.0435 6.29861 10.0057 6.14643 9.85355C5.99425 9.70137 5.95652 9.46889 6.05277 9.27639L8.01648 5.34897C8.06455 5.25283 8.1278 5.16507 8.2038 5.08907L12.1464 1.14645ZM12.5 2.20711L8.91091 5.79618L7.87266 7.87267L8.12731 8.12732L10.2038 7.08907L13.7929 3.5L12.5 2.20711ZM9.99998 2L8.99998 3H4.9C4.47171 3 4.18056 3.00039 3.95552 3.01877C3.73631 3.03668 3.62421 3.06915 3.54601 3.10899C3.35785 3.20487 3.20487 3.35785 3.10899 3.54601C3.06915 3.62421 3.03669 3.73631 3.01878 3.95552C3.00039 4.18056 3 4.47171 3 4.9V11.1C3 11.5283 3.00039 11.8194 3.01878 12.0445C3.03669 12.2637 3.06915 12.3758 3.10899 12.454C3.20487 12.6422 3.35785 12.7951 3.54601 12.891C3.62421 12.9309 3.73631 12.9633 3.95552 12.9812C4.18056 12.9996 4.47171 13 4.9 13H11.1C11.5283 13 11.8194 12.9996 12.0445 12.9812C12.2637 12.9633 12.3758 12.9309 12.454 12.891C12.6422 12.7951 12.7951 12.6422 12.891 12.454C12.9309 12.3758 12.9633 12.2637 12.9812 12.0445C12.9996 11.8194 13 11.5283 13 11.1V6.99998L14 5.99998V11.1V11.1207C14 11.5231 14 11.8553 13.9779 12.1259C13.9549 12.407 13.9057 12.6653 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.6653 13.9057 12.407 13.9549 12.1259 13.9779C11.8553 14 11.5231 14 11.1207 14H11.1H4.9H4.87934C4.47686 14 4.14468 14 3.87409 13.9779C3.59304 13.9549 3.33469 13.9057 3.09202 13.782C2.7157 13.5903 2.40973 13.2843 2.21799 12.908C2.09434 12.6653 2.04506 12.407 2.0221 12.1259C1.99999 11.8553 1.99999 11.5231 2 11.1207V11.1206V11.1V4.9V4.87935V4.87932V4.87931C1.99999 4.47685 1.99999 4.14468 2.0221 3.87409C2.04506 3.59304 2.09434 3.33469 2.21799 3.09202C2.40973 2.71569 2.7157 2.40973 3.09202 2.21799C3.33469 2.09434 3.59304 2.04506 3.87409 2.0221C4.14468 1.99999 4.47685 1.99999 4.87932 2H4.87935H4.9H9.99998Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Testimonials
                </div>
              </Link>
            </Button>
            <Button variant={"outline"} className={styles.link} style={navStyle(4, isSheetOpen)}>
              <Link
                className={styles.links}
                href={"/about"}
                onClick={handleCloseAndNavigate}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: "8px" }}
                  >
                    <path
                      d="M12.5 3L2.5 3.00002C1.67157 3.00002 1 3.6716 1 4.50002V9.50003C1 10.3285 1.67157 11 2.5 11H7.50003C7.63264 11 7.75982 11.0527 7.85358 11.1465L10 13.2929V11.5C10 11.2239 10.2239 11 10.5 11H12.5C13.3284 11 14 10.3285 14 9.50003V4.5C14 3.67157 13.3284 3 12.5 3ZM2.49999 2.00002L12.5 2C13.8807 2 15 3.11929 15 4.5V9.50003C15 10.8807 13.8807 12 12.5 12H11V14.5C11 14.7022 10.8782 14.8845 10.6913 14.9619C10.5045 15.0393 10.2894 14.9965 10.1464 14.8536L7.29292 12H2.5C1.11929 12 0 10.8807 0 9.50003V4.50002C0 3.11931 1.11928 2.00003 2.49999 2.00002Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  About
                </div>
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default Sidebar;
