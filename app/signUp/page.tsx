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
  const [pfp, setPfp] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

  async function doNothing() {
    return;
  }

  async function handleContinueWithGoogle() {
    return;
  }

  return (
    <div>
      <form onSubmit={doNothing}>
        <h2>Sign Up</h2>
        <label>Full Name
          <input
            type="text"
            value={name}
            required
            onChange={doNothing}
          />
        </label>
        <label>Email
          <input
            type="email"
            value={email}
            required
            onChange={doNothing}
          />
        </label>
        <label>Password
          <input
            type="password"
            value={password}
            required
            onChange={doNothing}
          />
        </label>
        <label>Confirm Password
          <input
            type="password"
            value={confirmPassword}
            required
            onChange={doNothing}
          />
        </label>
        <label>Profile picture (optional)
          <input
            type="text"
            value={pfp}
            required
            onChange={doNothing}
          />
        </label>
        <button type="submit"> SignUp </button>
        <button type="button" onClick={async() => router.push("/login")}> Login </button>
        <button type="button" onClick={handleContinueWithGoogle}> Continue with Google </button>
        {errorMessage && <p>{errorMessage}</p>}
      </form>
    </div>
  );
}