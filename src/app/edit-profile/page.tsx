"use client"
import React, { useState, useEffect } from 'react';
import { db } from "@/../firebase";
import { useSession } from 'next-auth/react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from './edit-profile.module.css'; // Adjust the path to where your CSS module is saved
interface UserProfile {
    name: string;
    email: string;
    phone?: string;
    occupation?: string;
    employer?: string;
    profileImageUrl?: string; // Assuming this is the field for the profile image URL
    isVerified?: boolean;
  }
  
  const EditProfilePage = () => {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
  
    // Fetch user profile from Firestore
    useEffect(() => {
        const fetchProfile = async () => {
          if (session?.user?.email) {
            const docRef = doc(db, "users", session.user.email);
            const docSnap = await getDoc(docRef);
      
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            } else {
              // Handle case where there is no profile (e.g., new user)
              setProfile({
                name: session.user.name ?? "",
                email: session.user.email,
                profileImageUrl: session.user.image ?? "",
                isVerified: false, // Default to false until manually verified
              });
            }
          }
        };
  
      fetchProfile();
    }, [session]);
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setProfile((currentProfile) => (currentProfile ? { ...currentProfile, [name]: value } : null));
    };
  
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!profile || !session?.user?.email) return;
      
        const userProfileUpdate = {
          ...profile,
          profileImageUrl: session.user.image ?? "", // Include the profile image URL
          // Do not update `isVerified` here to prevent users from modifying it
        };
      
        // Update Firestore document, but exclude isVerified from direct update
        await setDoc(doc(db, "users", session.user.email), userProfileUpdate);
        alert("Profile updated successfully!");
      };
      
  
    if (!session) {
      return <div>Please sign in to edit your profile.</div>;
    }
  
    return (
        <div className={styles.editProfileContainer}>
          <h2 className={styles.sectionTitle}>Edit Profile</h2>
          {profile ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name</label>
                <input
                  type="text"
                  value={profile.name}
                  className={styles.input}
                  disabled
                />
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
                <input
                  type="text"
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Occupation</label>
                <input
                  type="text"
                  name="occupation"
                  value={profile.occupation || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Employer</label>
                <input
                  type="text"
                  name="employer"
                  value={profile.employer || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              <div className={styles.verificationStatus}>
                {profile.isVerified ? 'Verified' : 'Not Yet Verified'}
              </div>
              <div className={styles.buttonContainer}>
                <button type="submit" className={styles.submitButton}>Save Profile</button>
              </div>
            </form>
          ) : (
            <p>Loading...</p>
          )}
          <p className={styles.disclaimer}>
            Disclaimer: I prioritize your privacy and security, entrusting your data to Google Firebase for safekeeping (your password is unavailable to me). Please note that your occupation and employer will be visible to others on the testimonials page. Your phone number is requested solely for the purposes of adding you to my contact list and verifying your authenticity as a user. Feel free to leave a review on my testimonials page, if you’d like a verified badge please contact me so I can review your information!
          </p>
        </div>
      );
          }

export default EditProfilePage;
