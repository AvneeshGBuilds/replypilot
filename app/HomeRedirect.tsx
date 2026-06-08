"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      router.push(user ? "/dashboard" : "/login");
    });
  }, [router]);

  return null;
}
