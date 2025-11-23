"use client";

import { useEffect, useState } from "react";
import AuthLoading from "@/components/AuthLoading";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

export default function Home() {
  const { user } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user) {
      router.push("/home");
      setChecking(false);
    } else {
      router.push("/login");
      setChecking(false);
    }
  }, [user, router]);

  if (checking) return <AuthLoading/>;
  // return <AuthLoading/>
}
