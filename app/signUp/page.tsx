'use client';

import React from "react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import styles from './SignUp.module.css';


export default function Home() {
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
    <div className={styles.container}>
      <form className={styles.signUpForm} onSubmit={handleSignUp}>
        <h2 className={styles.formHeader}>Sign Up</h2>
        <label className={styles.formLable}>Full Name
          <input
            type="text"
            value={name}
            required
            className={styles.formInput}
            onChange={e => setName(e.target.value)}
          />
        </label>
        <label className={styles.formLable}>Email
          <input
            type="email"
            value={email}
            required
            className={styles.formInput}
            onChange={e => setEmail(e.target.value)}
          />
        </label>
        <label className={styles.formLable}>Password
          <input
            type="password"
            value={password}
            required
            className={styles.formInput}
            onChange={e => setPassword(e.target.value)}
          />
        </label>
        <label className={styles.formLable}>Confirm Password
          <input
            type="password"
            value={confirmPassword}
            required
            className={styles.formInput}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </label>
        <button className={styles.signUpBtn} type="submit"> SignUp </button>
        <button className={styles.loginBtn} type="button" onClick={async() => router.push("/login")}> Login </button>
        <button
          className={styles.googleBtn}
          type="button"
          onClick={handleContinueWithGoogle}
        >
          <img
            className={styles.googleIcon}
            src="/icons/googleLogo.png"
            alt="Google logo"
          />
          Continue with Google
        </button>        {errorMessage && <p>{errorMessage}</p>}
      </form>
    </div>
  );
}