"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { env } from "@/env";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = env.NEXT_PUBLIC_AUTH_API_URL || env.NEXT_PUBLIC_API_URL;

  async function fetchMe() {
    setError(null);
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
      if (!token) {
        setError("Not signed in. Please login.");
        return;
      }
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.detail || `Failed to load profile (${res.status})`);
      }
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    }
  }

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("auth_token");
      window.localStorage.removeItem("auth_user");
    }
    setUser(null);
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-400/30 bg-red-900/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">You are not signed in.</p>
              <div className="flex gap-2">
                <Link href="/auth/login">
                  <Button variant="primary">Sign in</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="outline">Create account</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-border/60 bg-card/50 p-4">
                <div className="text-sm"><span className="text-muted-foreground">ID:</span> {user.id}</div>
                <div className="text-sm"><span className="text-muted-foreground">Email:</span> {user.email}</div>
                {user.name && (
                  <div className="text-sm"><span className="text-muted-foreground">Name:</span> {user.name}</div>
                )}
                <div className="text-sm"><span className="text-muted-foreground">Role:</span> {user.role}</div>
                <div className="text-sm"><span className="text-muted-foreground">Created:</span> {user.createdAt}</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchMe} variant="outline">Refresh</Button>
                <Button onClick={handleLogout} variant="danger">Sign out</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
