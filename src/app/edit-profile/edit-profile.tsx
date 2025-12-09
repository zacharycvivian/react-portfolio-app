"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/../firebase";
import { useSession } from "next-auth/react";
import {
  doc,
  getDoc,
  setDoc,
  query,
  where,
  limit,
  getDocs,
  collection,
} from "firebase/firestore";
import styles from "./edit-profile.module.css";
import VerifiedLabel from "@/../public/verified.png";

// Define interface for user profile properties
interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  occupation?: string;
  employer?: string;
  profileImageUrl?: string;
  isVerified?: boolean;
}

const EditProfilePage = () => {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // States for managing phone number input parts
  const [phonePart1, setPhonePart1] = useState("");
  const [phonePart2, setPhonePart2] = useState("");
  const [phonePart3, setPhonePart3] = useState("");

  // Helper to resolve the Firestore user document id (prefer NextAuth uid, else email match)
  const resolveUserDocId = async (): Promise<string | null> => {
    const email = session?.user?.email;
    const uid = (session?.user as any)?.id;
    if (!email && !uid) return null;

    // Prefer uid if present
    if (uid) {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) return uid;
    }

    if (email) {
      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].id;
      }
      // fallback create id by uid or email
      return uid ?? email;
    }
    return null;
  };

  // Fetches the user's profile from Firestore on component mount or when session changes
  useEffect(() => {
    const fetchProfile = async () => {
      const userDocId = await resolveUserDocId();
      if (!userDocId || !session?.user?.email) return;
      const docRef = doc(db, "users", userDocId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        setProfile({
          name: session.user.name ?? "",
          email: session.user.email,
          profileImageUrl: session.user.image ?? "",
          isVerified: false,
        });
      }
    };

    fetchProfile();
  }, [session]);

  // Splits phone number into parts for separate input fields when profile state changes
  useEffect(() => {
    if (profile?.phone) {
      const parts = profile.phone.match(/(\d{3})(\d{3})(\d{4})/);
      if (parts) {
        setPhonePart1(parts[1]);
        setPhonePart2(parts[2]);
        setPhonePart3(parts[3]);
      }
    }
  }, [profile]);

  // Handles changes in phone number input fields and updates corresponding state
  const handlePhoneChange = (value: string, part: number) => {
    // Ensure only digits are accepted and limit length
    const updatedValue = value
      .replace(/\D/g, "")
      .substring(0, part === 3 ? 4 : 3);
    // Update the corresponding part of the phone number
    if (part === 1) setPhonePart1(updatedValue);
    if (part === 2) setPhonePart2(updatedValue);
    if (part === 3) setPhonePart3(updatedValue);

    // Attempting to auto-focus the next or previous input
    if (updatedValue.length === 3 && part !== 3) {
      const nextElement = document.getElementById(`phonePart${part + 1}`);
      if (nextElement instanceof HTMLInputElement) {
        nextElement.focus();
      }
    } else if (updatedValue.length === 0 && part !== 1) {
      const prevElement = document.getElementById(`phonePart${part - 1}`);
      if (prevElement instanceof HTMLInputElement) {
        prevElement.focus();
      }
    }
  };

  // Generic handler for updating profile state based on form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((currentProfile) =>
      currentProfile ? { ...currentProfile, [name]: value } : null
    );
  };

  // Submits the updated profile to Firestore and alerts the user
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile || !session?.user?.email) return;
    const userDocId = await resolveUserDocId();
    if (!userDocId) return;
    const phone = `${phonePart1}${phonePart2}${phonePart3}`;
    const userProfileUpdate = {
      ...profile,
      phone,
      profileImageUrl: session.user.image ?? "",
    };

    await setDoc(doc(db, "users", userDocId), userProfileUpdate, { merge: true });
    alert("Profile updated successfully!");
  };

  if (!session) {
    return <div>Please sign in to edit your profile.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.editProfileContainer}>
        <h2 className={styles.sectionTitle}>Edit Profile</h2>
        {session && profile ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Name</label>
              <div className={styles.nameWithVerification}>
                <input
                  type="text"
                  value={profile.name}
                  className={styles.input}
                  disabled
                />
                {profile.isVerified ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Image
                      src={VerifiedLabel}
                      alt="Verified"
                      width={20}
                      height={20}
                    />
                    <span>Verified</span>
                  </div>
                ) : (
                  <span>(Unverified)</span>
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                value={profile.email}
                className={styles.input}
                disabled
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone</label>
              <div className={styles.phoneInputContainer}>
                <input
                  id="phonePart1"
                  type="text"
                  maxLength={3}
                  value={phonePart1}
                  onChange={(e) => handlePhoneChange(e.target.value, 1)}
                  className={styles.phoneInput}
                />
                -
                <input
                  id="phonePart2"
                  type="text"
                  maxLength={3}
                  value={phonePart2}
                  onChange={(e) => handlePhoneChange(e.target.value, 2)}
                  className={styles.phoneInput}
                />
                -
                <input
                  id="phonePart3"
                  type="text"
                  maxLength={4}
                  value={phonePart3}
                  onChange={(e) => handlePhoneChange(e.target.value, 3)}
                  className={styles.phoneInput}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Occupation</label>
              <input
                type="text"
                name="occupation"
                value={profile.occupation || ""}
                onChange={handleInputChange}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Employer</label>
              <input
                type="text"
                name="employer"
                value={profile.employer || ""}
                onChange={handleInputChange}
                className={styles.input}
              />
            </div>
            <div className={styles.buttonContainer}>
              <button type="submit" className={styles.submitButton}>
                Save Profile
              </button>
            </div>
          </form>
        ) : null}
        <p className={styles.disclaimer}>
          <strong>Disclaimer:</strong> I prioritize your privacy and security,
          entrusting your data to Google Firebase for safekeeping (your password
          is unavailable to me). Please note that your occupation and employer
          will be visible to others on the testimonials page. Your phone number
          is requested solely for the purposes of adding you to my contact list
          and verifying your authenticity as a user. Feel free to leave a review
          on my testimonials page, if you’d like a verified badge please contact
          me so I can review your information!
        </p>
      </div>
    </div>
  );
};

export default EditProfilePage;
