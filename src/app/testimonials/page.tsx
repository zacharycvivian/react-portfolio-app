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
  fname: string;
  lname: string;
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
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    stars: 5,
    review: "",
  });

  useEffect(() => {
    const q = query(collection(db, "testimonials"), orderBy("time", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const testimonialsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        fname: doc.data().fname,
        lname: doc.data().lname,
        stars: doc.data().stars,
        review: doc.data().review,
        time: doc.data().time,
      }));
      setTestimonials(testimonialsData);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      formData.fname &&
      formData.lname &&
      formData.review &&
      formData.stars >= 1 &&
      formData.stars <= 5
    ) {
      await addDoc(collection(db, "testimonials"), {
        ...formData,
        stars: formData.stars,
        time: serverTimestamp(),
      });
      setFormData({ fname: "", lname: "", stars: 5, review: "" });
      setShowModal(false);
    } else {
      // Handle validation error
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Testimonials</h2>
      <div className={styles.section}>
        {testimonials.map((testimonial) => (
          <div className={styles.card} key={testimonial.id}>
            <p>
              Name: {testimonial.fname} {testimonial.lname}
            </p>
            <p>Stars: {"★".repeat(testimonial.stars)}</p>
            <p>Review: {testimonial.review}</p>
            <p>Time: {formatDate(testimonial.time)}</p>
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
              <label className={styles.formLabel}>
                First Name:
                <input
                  className={styles.inputField}
                  type="text"
                  placeholder="Borat"
                  value={formData.fname}
                  onChange={(e) =>
                    setFormData({ ...formData, fname: e.target.value })
                  }
                />
              </label>
              <label className={styles.formLabel}>
                Last Name:
                <input
                  className={styles.inputField}
                  type="text"
                  placeholder="Sagdiyev"
                  value={formData.lname}
                  onChange={(e) =>
                    setFormData({ ...formData, lname: e.target.value })
                  }
                />
              </label>
              <label className={styles.formLabel}>
                Stars:
                <input
                  className={styles.inputField}
                  type="number"
                  value={formData.stars.toString()}
                  min="1"
                  max="5"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stars: e.target.value ? parseInt(e.target.value, 10) : 0,
                    })
                  }
                />
              </label>
              <label className={styles.formLabel}>
                Review:
                <textarea
                  className={styles.textareaField}
                  placeholder="Very nice!"
                  value={formData.review}
                  onChange={(e) =>
                    setFormData({ ...formData, review: e.target.value })
                  }
                />
              </label>
              <div className={styles.formButtons}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowModal(false)}
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
