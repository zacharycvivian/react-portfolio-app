"use client";
import React, { useState, useEffect } from "react";
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
import { db } from "@/../firebase";

//Interfaces for type declarations
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

// Utility function to format date/time for display
const formatDate = (date: Timestamp | null) => {
  if (!date) return "Time not available";
  // Configuration for the date format
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

// Main component for the Testimonials page
const TestimonialsPage = () => {
  // State hooks for managing testimonials, modal visibility, and form data
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { data: session } = useSession();
  const userPhotoURL = session?.user?.image || Logo.src;
  //Scan testimonials for banned words
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [filteredTestimonials, setFilteredTestimonials] = useState<
    Testimonial[]
  >([]);

  //Filter Testinmonials
  const [filter, setFilter] = useState({ sortBy: "time", order: "asc" });
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [tempFilter, setTempFilter] = useState(filter); // Initializes with the current filter
  const [formData, setFormData] = useState({
    name: "",
    stars: 0,
    review: "",
  });

  const sortTestimonials = (
    testimonials: Testimonial[],
    sortBy: string,
    order: string
  ) => {
    return testimonials.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "time") {
        const timeA = a.time ? a.time.toDate().getTime() : 0;
        const timeB = b.time ? b.time.toDate().getTime() : 0;
        comparison = timeA - timeB;
      } else if (sortBy === "stars") {
        comparison = a.stars - b.stars;
      }
      return order === "asc" ? comparison : -comparison;
    });
  };

  //Remember what filter user selects
  const openFiltersModal = () => {
    setTempFilter(filter); // Initialize tempFilter with current filter values
    setShowFiltersModal(true);
  };

  // Effect hook to subscribe to testimonials collection updates
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
      setFilteredTestimonials(
        sortTestimonials(testimonialsData, filter.sortBy, filter.order)
      );
    });

    return () => unsubscribe();
  }, [filter]);

  // Effect hook to update form name field with session user name
  useEffect(() => {
    if (session) {
      setFormData({ ...formData, name: session.user?.name || "" });
    }
  }, [session]);

  // Effect hook to fetch and set banned words list
  useEffect(() => {
    fetch("/NaughtyWords.txt")
      .then((response) => response.text())
      .then((text) => {
        const words = text.split(/\r?\n/);
        setBannedWords(words);
      });
  }, []);

  // Utility function to escape regex special characters in strings
  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  // Function to filter profanity from text based on banned words list
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

  // Handle form submission and add a new testimonial
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Validate form input before submission
    if (formData.stars === 0 || formData.review.trim() === "") {
      window.alert("Please enter a rating and a review before submitting.");
      return;
    }
    const filteredReview = filterProfanity(formData.review);
    // Add testimonial if user is logged in and input is valid
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
        // Reset form data and close modal on successful submission
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

  // Cancel button handler to reset form and hide modal
  const handleCancel = () => {
    setFormData({
      ...formData,
      name: session?.user?.name || "",
      stars: 0,
      review: "",
    });
    setShowModal(false);
  };

  // Component for rendering star ratings
  interface StarRatingProps {
    rating: number;
    onRating: (rating: number) => void;
  }

  // Star rating component to allow users to rate testimonials
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

  // Render testimonials page with form and testimonials list
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
        <button
          onClick={() => setShowFiltersModal(true)}
          className={styles.filterButton}
        >
          Filters
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
      {showFiltersModal && (
        <div className={styles.filterModalBackdrop}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Filter Testimonials</h2>
            <div className={styles.filterControls}>
            <select value={tempFilter.sortBy} onChange={(e) => setTempFilter({ ...tempFilter, sortBy: e.target.value })} className={styles.filterSelect}>

                <option value="time">Date</option>
                <option value="name">Name</option>
                <option value="stars">Rating</option>
              </select>
              <select value={tempFilter.order} onChange={(e) => setTempFilter({ ...tempFilter, order: e.target.value })} className={styles.filterSelect}>

                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div className={styles.closeButtonContainer}>
              <button
                onClick={() => setShowFiltersModal(false)}
                className={styles.cancelButton}
              >
                Close
              </button>
              <button onClick={() => { setFilter(tempFilter); setShowFiltersModal(false); }} className={styles.submitButton}>
  Apply Filters
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsPage;
