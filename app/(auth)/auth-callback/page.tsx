"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLoading from "@/components/AuthLoading/AuthLoading";
import { useUser } from "../../providers/UserProvider";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUser();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    const name = decodeURIComponent(searchParams.get("name") || "");
    const userIdParam = searchParams.get("userId");
    const userId = Number(userIdParam);
    const email = decodeURIComponent(searchParams.get("email") || "");
    const profilePic = decodeURIComponent(searchParams.get("profilePic") || "");
    const isGoogle = searchParams.get("isGoogle") === "true";
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const isAdmin = searchParams.get("isAdmin") === "true";
    const isMechanic = searchParams.get("isMechanic") === "true";
    const biography = searchParams.get("biography") || "";

    if (name && email && accessToken && refreshToken) {
      const userData = {
        name,
        userId,
        email,
        profilePic,
        isGoogle,
        accessToken,
        refreshToken,
        isAdmin,
        isMechanic,
        biography
      };
      setUser(userData);
      router.push("/home");
    } else {
      const message = searchParams.get("message") || "Authentication failed. Please try again.";
      router.push(`/login?error=${encodeURIComponent(message)}`);
    }
  }, [searchParams, router, setUser]);

  return (
    <AuthLoading message="Logging you in…" />
  );
}