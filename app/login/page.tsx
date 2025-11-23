'use client';

import React, { useEffect } from "react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import authStyles from '../styles/auth.module.css';
import { useUser } from "@/context/UserContext";
import GuestRoute from "@/components/GuestRoute";


export default function loginPage() {
  const router = useRouter();
  const { setUser } = useUser();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    try {
      const responseData = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        email: email,
        password: password
      });
      const authData = responseData.data;
      if (authData.accessToken) {
        setUser({
          name: authData.name,
          email: authData.email,
          profilePic: authData.profilePic,
          isGoogle: authData.isGoogle,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
        });
        router.push("/home");
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
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`;
  }

  return (
    <GuestRoute>
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
    </GuestRoute>
  );
}