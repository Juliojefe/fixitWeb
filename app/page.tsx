"use client";

import { useEffect, useState } from "react";
import AuthLoading from "@/components/AuthLoading/AuthLoading";
import { useRouter } from "next/navigation";
import { useUser } from "./providers/UserProvider";

export default function Gatekeeper() {
  const { user } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user) {
      router.push("/explore");
      setChecking(false);
    } else {
      router.push("/login");
      setChecking(false);
    }
  }, [user, router]);

  if (checking) return <AuthLoading/>;
}
