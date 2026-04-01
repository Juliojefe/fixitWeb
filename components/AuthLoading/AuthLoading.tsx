"use client";

import styles from "./AuthLoading.module.css";

interface AuthLoadingProps {
  message?: string;
}

export default function AuthLoading({ message = "Checking authentication…" }: AuthLoadingProps) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}></div>
      <p className={styles.text}>{message}</p>
    </div>
  );
}
