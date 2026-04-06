"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function HomePage() {
  const { data: session } = authClient.useSession();

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      {session ? (
        <div className="space-y-4">
          <p>Welcome, {session.user.name}</p>
          <p>User ID: {session.user.id}</p>
          <Button
            size="lg"
            onClick={async () => {
              await authClient.signOut();
            }}
          >
            Logout
          </Button>
        </div>
      ) : (
        <Button size="lg" asChild>
          <Link href="/staff-login">Login</Link>
        </Button>
      )}
    </div>
  );
}
