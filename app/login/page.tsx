'use client';

import React from "react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';


export default function Home() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  console.log("API:", process.env.NEXT_PUBLIC_API_URL);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    try {
      const responseData = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        email: email,
        password: password
      });
      const authData = responseData.data;
      if (authData.accessToken && authData.refreshToken) {
        /**
         * persist repsonse data for sessions
         */
        // router.push("/home");
        alert("working");
      } else {
        setErrorMessage("Unexpected response from server.");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setErrorMessage(err.response.data.message || "Login Failed");
      } else {
        setErrorMessage("Network error");
      }
    }
  }

  async function handleContinueWithGoogle() {
    //  Do nothing for now
    return;
  }

  return (
    <div className={styles.container}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h2 className={styles.formHeader}>Login</h2>
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
        <button className={styles.loginBtn} type="submit"> Login </button>
        <button className={styles.signUpBtn} type="button" onClick={async () => router.push("/signUp")}> Create Account </button>
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
        </button>        
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      </form>
    </div>
  );
}