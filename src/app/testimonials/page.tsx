"use client";
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import styles from "./testimonials.module.css";
import Logo from "@/../public/HeaderLogo.png";
import { useSession } from "next-auth/react";

const firebaseConfig = {
  apiKey: "AIzaSyBJd9r0lySN38yQOB1MunpZ8aBVD--767w",
  authDomain: "payrollpal-bc053.firebaseapp.com",
  databaseURL: "https://payrollpal-bc053-default-rtdb.firebaseio.com",
  projectId: "payrollpal-bc053",
  storageBucket: "payrollpal-bc053.appspot.com",
  messagingSenderId: "450919626102",
  appId: "1:450919626102:web:262a476c7a30061f94b657",
  measurementId: "G-NBV8XVL8XF",
};

initializeApp(firebaseConfig);
const db = getFirestore();

interface Testimonial {
  id: string;
  name: string;
  stars: number;
  review: string;
  time: any;
}

interface Timestamp {
  toDate: () => Date;
}

const formatDate = (date: Timestamp | null) => {
  if (!date) return "Time not available";

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZoneName: "short",
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  return formatter.format(date.toDate());
};

const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { data: session } = useSession();
  const userPhotoURL = session?.user?.image || Logo.src;
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    stars: 0,
    review: "",
  });

  useEffect(() => {
    const q = query(collection(db, "testimonials"), orderBy("time", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const testimonialsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        stars: doc.data().stars,
        review: doc.data().review,
        time: doc.data().time,
      }));
      setTestimonials(testimonialsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      setFormData({ ...formData, name: session.user?.name || "" });
    }
  }, [session]);

  useEffect(() => {
    fetch("/NaughtyWords.txt")
      .then((response) => response.text())
      .then((text) => {
        const words = text.split(/\r?\n/);
        setBannedWords(words);
      });
  }, []);

  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const filterProfanity = (text: string): string => {
    let filteredText = text;
    bannedWords.forEach((word) => {
      if (word.trim().length > 0) {
        const escapedWord = escapeRegExp(word.trim());
        const regex = new RegExp(escapedWord, "gi");
        filteredText = filteredText.replace(regex, "*".repeat(word.length));
      }
    });
    return filteredText;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formData.stars === 0 || formData.review.trim() === "") {
      window.alert("Please enter a rating and a review before submitting.");
      return;
    }
    const filteredReview = filterProfanity(formData.review);
    if (
      session?.user?.name &&
      filteredReview &&
      formData.stars >= 1 &&
      formData.stars <= 5
    ) {
      try {
        await addDoc(collection(db, "testimonials"), {
          name: session.user.name,
          review: filteredReview,
          stars: formData.stars,
          time: serverTimestamp(),
        });
        setFormData({
          ...formData,
          name: session?.user?.name || "",
          stars: 0,
          review: "",
        });
        setShowModal(false);
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    } else {
      // Handle validation error
    }
  };

  const handleCancel = () => {
    setFormData({
      ...formData,
      name: session?.user?.name || "",
      stars: 0,
      review: "",
    });
    setShowModal(false);
  };

  interface StarRatingProps {
    rating: number;
    onRating: (rating: number) => void;
  }

  const StarRating: React.FC<StarRatingProps> = ({ rating, onRating }) => {
    const stars = [1, 2, 3, 4, 5];
    return (
      <div className={styles.starRating}>
        {stars.map((star) => (
          <span
            key={star}
            className={`${star <= rating ? styles.selected : ""}`}
            onClick={() => onRating(star)}
          >
            {star <= rating ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Testimonials</h2>
      <div className={styles.section}>
        {testimonials.map((testimonial) => (
          <div className={styles.card} key={testimonial.id}>
            <img src={userPhotoURL} alt="User" className={styles.userImage} />
            <p>
              <strong>{testimonial.name}</strong>
            </p>
            <p>{"★".repeat(testimonial.stars)}</p>
            <p>{testimonial.review}</p>
            <p className={styles.timeText}>{formatDate(testimonial.time)}</p>
          </div>
        ))}
      </div>
      <div className={styles.buttonContainer}>
        <button onClick={() => setShowModal(true)} className={styles.addButton}>
          Add Testimonial
        </button>
      </div>
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <form onSubmit={handleSubmit}>
              {/* Combined Name Field */}
              <label className={styles.formLabel}>
                Name:
                <input
                  className={styles.inputField}
                  type="text"
                  value={`${session?.user?.name || ""}`}
                  readOnly
                />
              </label>
              <div className={styles.formLabel}>Rating:</div>
              <StarRating
                rating={formData.stars}
                onRating={(rating) =>
                  setFormData({ ...formData, stars: rating })
                }
              />
              <label className={styles.formLabel}>
                Review:
                <textarea
                  className={styles.textareaField}
                  placeholder="Your Review (Max. 275 Characters)"
                  value={formData.review}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      review: e.target.value,
                    })
                  }
                  maxLength={275}
                  style={{ resize: "none" }}
                />
                <div>{formData.review.length}/275</div>
              </label>
              <div className={styles.formButtons}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsPage;
