'use client';

import React from "react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import authStyles from '../styles/auth.module.css';

export default function signUpPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  async function handleSignUp() {
    //  don nothing for now
    return;
  }

  async function handleContinueWithGoogle() {
    return;
  }

  return (
    <div className={authStyles.container}>
      <form className={authStyles.authForm} onSubmit={handleSignUp}>
        <h2 className={authStyles.formHeader}>Sign Up</h2>
        <label className={authStyles.formLabel}>Full Name
          <input
            type="text"
            value={name}
            required
            className={authStyles.formInput}
            onChange={e => setName(e.target.value)}
          />
        </label>
        <label className={authStyles.formLabel}>Email
          <input
            type="email"
            value={email}
            required
            className={authStyles.formInput}
            onChange={e => setEmail(e.target.value)}
          />
        </label>
        <label className={authStyles.formLabel}>Password
          <input
            type="password"
            value={password}
            required
            className={authStyles.formInput}
            onChange={e => setPassword(e.target.value)}
          />
        </label>
        <label className={authStyles.formLabel}>Confirm Password
          <input
            type="password"
            value={confirmPassword}
            required
            className={authStyles.formInput}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </label>
        <button className={authStyles.primaryBtn} type="submit"> SignUp </button>
        <button className={authStyles.secondaryBtn} type="button" onClick={async() => router.push("/login")}> Login </button>
        <button
          className={authStyles.googleBtn}
          type="button"
          onClick={handleContinueWithGoogle}
        >
          <img
            className={authStyles.googleIcon}
            src="/icons/googleLogo.png"
            alt="Google logo"
          />
          Continue with Google
        </button>        
        {errorMessage && <p className={authStyles.error}>{errorMessage}</p>}
      </form>
    </div>
  );
}