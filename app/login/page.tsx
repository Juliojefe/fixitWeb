'use client';

import React from "react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import authStyles from '../styles/auth.module.css';

export default function loginPage() {
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
    <div className={authStyles.container}>
      <form className={authStyles.authForm} onSubmit={handleSubmit}>
        <h2 className={authStyles.formHeader}>Login</h2>
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
        <button className={authStyles.primaryBtn} type="submit">Login</button>
        <button className={authStyles.secondaryBtn} type="button" onClick={async () => router.push("/signUp")}> Create Account </button>
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