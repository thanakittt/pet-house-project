import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

export async function requireRole(roles: string[]) {
  const session = await getSession();

  if (!session) return null;

  const userRole = session.user.role;

  if (!userRole || !roles.includes(userRole)) {
    return null;
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireRole(["admin"]);

  if (!session) {
    redirect("/staff-login");
  }

  return session;
}

export async function requireStaff(config = { redirect: true }) {
  const session = await requireRole(["admin", "staff", "owner"]);

  if (!session && config.redirect) {
    redirect("/staff-login");
  }

  return session;
}

export async function requireAdminAndOwner() {
  const session = await requireRole(["admin", "owner"]);

  if (!session) {
    redirect("/staff-login");
  }

  return session;
}
