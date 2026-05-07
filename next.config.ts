import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Action รับรูปสลิปผ่าน FormData โดย Thunder จำกัดรูปที่ 4MB
  // ตั้ง limit เป็น 5mb เพื่อเผื่อ multipart overhead แต่ยังไม่เปิดกว้างเกินจำเป็น
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
