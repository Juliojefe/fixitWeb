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
  const [profilePicFile, setProfilePicFile] = React.useState<File | null>(null);
  const [errorMessage, setErrorMessage] = React.useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);
      formData.append('biography', biography);
      if (profilePicFile) {
        formData.append('profilePic', profilePicFile);
      }

      const responseData = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
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
        router.push("/explore");
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
      <form className={authStyles.card} onSubmit={handleSignUp}>

        {/* Avatar upload — front and center */}
        <div className={authStyles.avatarSection}>
          <label className={authStyles.avatarLabel} htmlFor="avatarUpload">
            {profilePicFile ? (
              <img
                className={authStyles.avatarPreview}
                src={URL.createObjectURL(profilePicFile)}
                alt="Profile preview"
              />
            ) : (
              <div className={authStyles.avatarPlaceholder}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
            )}
            <div className={authStyles.avatarBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          </label>
          <input
            id="avatarUpload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => setProfilePicFile(e.target.files ? e.target.files[0] : null)}
          />
          <p className={authStyles.avatarHint}>
            {profilePicFile ? profilePicFile.name : 'Add a profile photo'}
          </p>
        </div>

        <h2 className={authStyles.heading}>Create account</h2>

        {/* Fields */}
        <div className={authStyles.fields}>
          <label className={authStyles.fieldLabel}>
            Full Name
            <input type="text" value={name} required className={authStyles.input}
              onChange={e => setName(e.target.value)} />
          </label>

          <label className={authStyles.fieldLabel}>
            Email
            <input type="email" value={email} required className={authStyles.input}
              onChange={e => setEmail(e.target.value)} />
          </label>

          <label className={authStyles.fieldLabel}>
            Bio <span className={authStyles.optional}>optional</span>
            <textarea
              placeholder="Tell people a little about yourself..."
              value={biography}
              onChange={e => setBiography(e.target.value)}
              className={authStyles.input}
              rows={3}
            />
          </label>

          <div className={authStyles.row}>
            <label className={authStyles.fieldLabel}>
              Password
              <input type="password" value={password} required className={authStyles.input}
                onChange={e => setPassword(e.target.value)} />
            </label>
            <label className={authStyles.fieldLabel}>
              Confirm Password
              <input type="password" value={confirmPassword} required className={authStyles.input}
                onChange={e => setConfirmPassword(e.target.value)} />
            </label>
          </div>
        </div>

        {errorMessage && <p className={authStyles.error}>{errorMessage}</p>}

        <button className={authStyles.primaryBtn} type="submit">Create Account</button>

        <div className={authStyles.divider}><span>or</span></div>

        <button className={authStyles.googleBtn} type="button" onClick={handleContinueWithGoogle}>
          <img className={authStyles.googleIcon} src="/icons/googleLogo.png" alt="Google logo" />
          Continue with Google
        </button>

        <p className={authStyles.loginPrompt}>
          Already have an account?{' '}
          <button type="button" className={authStyles.linkBtn} onClick={() => router.push('/login')}>
            Log in
          </button>
        </p>

      </form>
    </div>
  </GuestRoute>
);
}