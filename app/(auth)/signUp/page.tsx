'use client';

import React, { useEffect } from "react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import authStyles from '../../styles/auth.module.css';
import commonStyles from '../../styles/common.module.css';
import { useUser } from "../../providers/UserProvider";
import GuestRoute from "@/components/GuestRoute/GuestRoute";


export default function signUpPage() {
  const router = useRouter();
  const { setUser } = useUser();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [biography, setBiography] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    try {
      const responseData = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        name: name,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        biography: biography
      });
      const authData = responseData.data;
      if (authData.accessToken) {
        setUser({
          name: authData.name,
          userId: authData.userId,
          email: authData.email,
          profilePic: authData.profilePic,
          isGoogle: authData.isGoogle,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          isAdmin: authData.isAdmin,
          isMechanic: authData.isMechanic,
          biography: authData.biography,
          accessTokenExpiresAt: new Date(authData.accessTokenExpiresAt),
          refreshTokenExpiresAt: new Date(authData.refreshTokenExpiresAt)
        });
        router.push("/home");
      } else {
        setErrorMessage("Unexpected response from server.");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setErrorMessage(err.response.data.message || "Sign up Failed");
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
        <form className={commonStyles.formContainer} onSubmit={handleSignUp}>
          <h2 className={commonStyles.formHeader}>Sign Up</h2>
          <label className={commonStyles.label}>Full Name
            <input
              type="text"
              value={name}
              required
              className={commonStyles.input}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <label className={commonStyles.label}>Email
            <input
              type="email"
              value={email}
              required
              className={commonStyles.input}
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <label className={commonStyles.label}>Biography
            <textarea
              name="biography"
              placeholder="Write a bio (optional) ..."
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className={commonStyles.input}
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
          <label className={commonStyles.label}>Confirm Password
            <input
              type="password"
              value={confirmPassword}
              required
              className={commonStyles.input}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </label>
          <button className={commonStyles.primaryBtn} type="submit"> SignUp </button>
          <h3 className={authStyles.divider}>Already have an account?</h3>
          <button className={commonStyles.secondaryBtn} type="button" onClick={async () => router.push("/login")}> Login </button>
          <h3 className={authStyles.divider}>Or</h3>
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