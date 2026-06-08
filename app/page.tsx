"use client";
import dynamic from "next/dynamic";

const HomeRedirect = dynamic(() => import("./HomeRedirect"), { ssr: false });

export default function Page() {
  return <HomeRedirect />;
}
