import React from "react";
import EditProfile from "./edit-profile";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Profile - Zachary Vivian's Portfolio Website",
  description:
    "Once you log in, you're able to edit your user profile, adding a phone number, occupation, and employer!"
};

function page() {
  return <EditProfile/>;
}

export default page;