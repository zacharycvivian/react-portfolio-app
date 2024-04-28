"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import styles from "./testimonials.module.css";
import Logo from "@/../public/HeaderLogo.png";
import VerifiedLabel from "@/../public/verified.png";
import { useSession } from "next-auth/react";
import { db } from "@/../firebase";
import { motion } from "framer-motion";

const fadeInVariant = {
  visible: {
    opacity: 1,
    scale: 1,
    y: 0, // End at the original position
    transition: { duration: .2 },
  },
  hidden: {
    opacity: 0,
    scale: 0.65,
    y: 50,
  },
};

//Interfaces for type declarations
interface Testimonial {
  id: string;
  name: string;
  email: string;
  stars: number;
  review: string;
  time: any;
  userImageUrl: string;
  occupation: string;
  employer: string;
  isVerified: boolean;
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
  const userPhotoURL = session?.user?.image ?? Logo.src;
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
    id: undefined as string | undefined,
    name: "",
    stars: 0,
    review: "",
  });

  const handleAddTestimonialClick = () => {
    if (!session) {
      // If the user is not logged in, show an alert message
      alert("You must be logged in to create a testimonial.");
      // Optionally, you can redirect the user to a login page or show a login modal
      // signIn(); // Uncomment this and import `signIn` from 'next-auth/react' to use
    } else {
      // If the user is logged in, show the add testimonial modal
      setShowModal(true);
    }
  };

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
        email: doc.data().email,
        stars: doc.data().stars,
        review: doc.data().review,
        time: doc.data().time,
        userImageUrl: doc.data().userImageUrl,
        occupation: doc.data().occupation,
        employer: doc.data().employer,
        isVerified: doc.data().isVerified,
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
      setFormData({ ...formData, name: session.user?.name ?? "" });
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
  // Handle form submission and add a new testimonial
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Early return if review or stars not provided
    if (formData.stars === 0 || formData.review.trim() === "") {
      window.alert("Please enter a rating and a review before submitting.");
      return;
    }

    // Check if user is logged in and has an email
    if (!session?.user?.email) {
      console.error("User email not found. User must be logged in.");
      alert("You must be logged in to submit a testimonial."); // Provide user feedback
      return;
    }

    // Fetch user profile from Firestore
    const userProfileRef = doc(db, "users", session.user.email);
    const userProfileSnap = await getDoc(userProfileRef);

    if (!userProfileSnap.exists()) {
      console.error("User profile does not exist.");
      alert(
        "Your user profile could not be found. Please ensure your profile is complete."
      ); // Provide user feedback
      return;
    }

    // Extract additional user details
    const userProfile = userProfileSnap.data();
    const { occupation, employer, isVerified } = userProfile;

    if (!occupation || !employer) {
      alert(
        "Please provide your current occupation and employer. Click your profile icon in the top right to edit your profile!"
      );
      return; // Prevent submission if either field is missing
    }

    // Proceed to create testimonial with additional details
    try {
      const filteredReview = filterProfanity(formData.review);
      const testimonialData = {
        name: session.user.name ?? "",
        email: session.user.email,
        review: filteredReview,
        stars: formData.stars,
        time: serverTimestamp(),
        userImageUrl: session?.user?.image ?? "path/to/default/image.png",
        occupation: occupation ?? "Occupation Empty", // Include occupation from the profile or default message
        employer: employer ?? "Employer Empty", // Include employer from the profile or default message
        isVerified: isVerified,
      };

      if (formData.id) {
        // Update existing testimonial
        const testimonialRef = doc(db, "testimonials", formData.id);
        await setDoc(testimonialRef, { ...testimonialData }, { merge: true });
      } else {
        // Add new testimonial
        await addDoc(collection(db, "testimonials"), testimonialData);
      }

      // Reset form data and close modal on successful submission
      setFormData({ id: undefined, name: "", stars: 0, review: "" });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding testimonial: ", error);
      alert(
        "An error occurred while submitting your testimonial. Please try again."
      ); // Provide user feedback
    }
  };
  const handleEditTestimonial = (testimonial: Testimonial) => {
    setFormData({
      ...formData,
      id: testimonial.id, // Assume formData is extended to include an optional id
      name: testimonial.name,
      stars: testimonial.stars,
      review: testimonial.review,
    });
    setShowModal(true);
  };

  const handleDeleteTestimonial = async (testimonialId: string) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this testimonial?"
    );
    if (isConfirmed) {
      await deleteDoc(doc(db, "testimonials", testimonialId));
      // Show feedback to the user, if necessary
    }
  };

  // Cancel button handler to reset form and hide modal
  const handleCancel = () => {
    setFormData({
      ...formData,
      name: session?.user?.name ?? "",
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
      <motion.h2
        className={styles.sectionTitle}
        variants={fadeInVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        Testimonials
      </motion.h2>
      <motion.div
        className={styles.section}
        variants={fadeInVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {testimonials.map((testimonial) => (
          <div className={styles.card} key={testimonial.id}>
            <img
              src={testimonial.userImageUrl}
              alt={`${testimonial.name}'s testimonial`}
              className={styles.userImage}
            />
            <div className={styles.verifiedContainer}>
              {" "}
              {/* Use this container for flex display */}
              <strong>{testimonial.name}</strong>
              {testimonial.isVerified ? (
                <img
                  src={VerifiedLabel.src}
                  alt="Verified"
                  className={styles.verifiedLabel}
                />
              ) : (
                <span className={styles.unverifiedText}>
                  (Unverified Review)
                </span>
              )}
            </div>
            {testimonial.occupation && (
              <p className={styles.occupation}>{testimonial.occupation}</p>
            )}
            {testimonial.employer && (
              <p className={styles.employer}>{testimonial.employer}</p>
            )}
            <p>{"★".repeat(testimonial.stars)}</p>
            <p>{testimonial.review}</p>
            <p className={styles.timeText}>{formatDate(testimonial.time)}</p>
            {session?.user?.email === testimonial.email && (
              <div className={styles.editDeleteIcons}>
                <span
                  onClick={() => handleEditTestimonial(testimonial)}
                  className={styles.editIcon}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </span>
                <span
                  onClick={() => handleDeleteTestimonial(testimonial.id)}
                  className={styles.deleteIcon}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4L3.5 4C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z"
                      fill="currentColor"
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                </span>
              </div>
            )}
          </div>
        ))}
      </motion.div>
      <div className={styles.buttonContainer}>
        <motion.button
          onClick={handleAddTestimonialClick}
          className={styles.addButton}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Add Testimonial
        </motion.button>
        <motion.button
          onClick={() => setShowFiltersModal(true)}
          className={styles.filterButton}
          variants={fadeInVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Filters
        </motion.button>
      </div>
      {showModal && (
        <div className={styles.modalBackdrop}>
          <motion.div
            className={styles.modalContent}
            variants={fadeInVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className={styles.modalTitle}><strong>Submit a Testimonial</strong></h2>
            <form onSubmit={handleSubmit}>
              {/* Combined Name Field */}
              <label className={styles.formLabel}>
                Name:
                <input
                  className={styles.inputField}
                  type="text"
                  value={`${session?.user?.name ?? ""}`}
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
                  placeholder="Leave a professional review..."
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
                <div className={styles.characterLimit}>Limit: {formData.review.length}/275</div>
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
          </motion.div>
        </div>
      )}
      {showFiltersModal && (
        <div className={styles.filterModalBackdrop}>
          <motion.div
            className={styles.modalContent}
            variants={fadeInVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className={styles.modalTitle}>Filter Testimonials</h2>
            <div className={styles.filterControls}>
              <select
                value={tempFilter.sortBy}
                onChange={(e) =>
                  setTempFilter({ ...tempFilter, sortBy: e.target.value })
                }
                className={styles.filterSelect}
              >
                <option value="time">Date</option>
                <option value="name">Name</option>
                <option value="stars">Rating</option>
              </select>
              <select
                value={tempFilter.order}
                onChange={(e) =>
                  setTempFilter({ ...tempFilter, order: e.target.value })
                }
                className={styles.filterSelect}
              >
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
              <button
                onClick={() => {
                  setFilter(tempFilter);
                  setShowFiltersModal(false);
                }}
                className={styles.submitButton}
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsPage;
