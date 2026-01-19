'use client';

import React, { useEffect } from "react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useUser } from "../../providers/UserProvider";
import GuestRoute from "@/components/GuestRoute/GuestRoute";
import authStyles from '../../styles/auth.module.css';
import commonStyles from '../../styles/common.module.css';  // New import


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
          isAdmin: authData.isAdmin,
          isMechanic: authData.isMechanic,
          biography: authData.biography
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
        <form className={commonStyles.formContainer} onSubmit={handleSubmit}>
          <h2 className={commonStyles.formHeader}>Login</h2>
          <label className={commonStyles.label}>Email
            <input
              type="email"
              value={email}
              required
              className={commonStyles.input}
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <label className={commonStyles.label}>Password
            <input
              type="password"
              value={password}
              required
              className={commonStyles.input}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          <h3 className={authStyles.formSubHeader}>Already have an account?</h3>
          <button className={commonStyles.primaryBtn} type="submit">Login</button>
          <h3 className={authStyles.formSubHeader}>New?</h3>
          <button className={commonStyles.secondaryBtn} type="button" onClick={async () => router.push("/signUp")}> Create Account </button>
          <h3 className={authStyles.formSubHeader}>Or</h3>
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
          {errorMessage && <p className={commonStyles.error}>{errorMessage}</p>}
        </form>
      </div>
    </GuestRoute>
  );
}