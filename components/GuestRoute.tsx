"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import AuthLoading from "@/components/AuthLoading";

interface GuestRouteProps {
  children: ReactNode;
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { user } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user) {
      router.replace("/home"); // redirect logged-in users
    } else {
      setChecking(false); // done checking, allow guests
    }
  }, [user, router]);
  // While checking, show loading
  if (checking) return <AuthLoading/>;
  // If user exists, don’t render anything (redirecting)
  if (user) return null;
  return <>{children}</>;
}
