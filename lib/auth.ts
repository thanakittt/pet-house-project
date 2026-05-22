import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { ac, owner, staff, customer, admin as adminRole } from "./permissions";
import { requiredEnv } from "./utils";
import { sendPasswordResetEmail, sendVerificationEmail } from "./mail";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: {
    allowedHosts: [
      "localhost:*",
      "pet-house-eight.vercel.app",
      "*.vercel.app",
    ],
    protocol: requiredEnv("NODE_ENV") === "production" ? "https" : "http",
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    // ยกเลิก session อื่นๆ ทั้งหมดเมื่อผู้ใช้รีเซ็ตรหัสผ่านสำเร็จ
    // เพื่อป้องกันไม่ให้ session ที่ถูกขโมยไปก่อนหน้ายังใช้งานได้
    revokeSessionsOnPasswordReset: true,
    // ใช้ void แทน await เพื่อป้องกัน timing side-channel leak
    // หากใช้ await ผู้โจมตีอาจวัดเวลา response และเดาได้ว่า email มีอยู่จริงหรือไม่
    async sendResetPassword({ user, url }) {
      void sendPasswordResetEmail({
        to: user.email,
        url,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: requiredEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    },
    line: {
      clientId: requiredEnv("LINE_CLIENT_ID"),
      clientSecret: requiredEnv("LINE_CLIENT_SECRET"),
    },
  },

  user: {
    modelName: "users",
    changeEmail: {
      enabled: true,
    },
    additionalFields: {
      phoneNumber: {
        type: "string",
        required: false,
        unique: true,
      },
    },
  },
  account: {
    modelName: "accounts",
  },
  session: {
    modelName: "sessions",
  },
  verification: {
    modelName: "verifications",
  },
  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      await sendVerificationEmail({
        to: user.email,
        url,
        type: "change-email",
      });
    },
  },
  plugins: [
    admin({
      defaultRole: "customer",
      ac,
      roles: {
        owner,
        staff,
        customer,
        admin: adminRole,
      },
    }),
    nextCookies(),
  ],
});
