import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { ac, owner, staff, customer, admin as adminRole } from "./permissions";
import { requiredEnv } from "./utils";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: requiredEnv("BETTER_AUTH_URL"),
  emailAndPassword: { enabled: true },
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
