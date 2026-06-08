"use client";
import dynamic from "next/dynamic";
const Settings = dynamic(() => import("./Settings"), { ssr: false });
export default function Page() { return <Settings />; }
