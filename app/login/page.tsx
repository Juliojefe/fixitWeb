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

  async function doNothing() {
    return;
  }

  async function handleSubmit() {
    return;
  }

  async function handleContinueWithGoogle() {

  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
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
        <button type="submit"> Login </button>
        <button type="button" onClick={async() => router.push("/signUp")}> Create Account </button>
        <button type="button" onClick={handleContinueWithGoogle}> Continue with Google </button>
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      </form>
    </div>
  );
}