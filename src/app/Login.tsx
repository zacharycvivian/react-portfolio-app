"use client";
import { signIn } from "next-auth/react";
import "./Login.css";

export default function Login() {
  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Zachary C. Vivian</h2>
        <button onClick={() => signIn("google", { callbackUrl: "/" })}>
          Login with Google
        </button>
        <p className="login-footer">Sign in to view my professional resume and testimonials.</p>
        <p className="disclaimer">
          Please note that authentication via Google is required to access this
          website in order to verify user identity.
        </p>
      </div>
    </div>
  );
}
