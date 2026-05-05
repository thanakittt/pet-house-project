import type { Metadata } from "next";
import { HomeClient } from "@/app/home-client";

export const metadata: Metadata = {
  title: "หน้าหลัก",
  description: "เข้าสู่หน้าหลักของ Pet House",
};

export default function HomePage() {
  return <HomeClient />;
}
