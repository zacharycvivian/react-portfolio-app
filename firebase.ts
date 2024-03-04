// Import the functions you need from the SDKs you need
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBJd9r0lySN38yQOB1MunpZ8aBVD--767w",
  authDomain: "payrollpal-bc053.firebaseapp.com",
  databaseURL: "https://payrollpal-bc053-default-rtdb.firebaseio.com",
  projectId: "payrollpal-bc053",
  storageBucket: "payrollpal-bc053.appspot.com",
  messagingSenderId: "450919626102",
  appId: "1:450919626102:web:262a476c7a30061f94b657",
  measurementId: "G-NBV8XVL8XF"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Analytics if necessary
// Note: Analytics can only be initialized in a browser environment
if (typeof window !== "undefined") {
  const analytics = getAnalytics(app);
}

const db = getFirestore(app);

export { app, db };