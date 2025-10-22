"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Breadcrumb } from "@/components/ui";
import { env } from "@/env";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem("auth_user");
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const API_BASE = env.NEXT_PUBLIC_AUTH_API_URL || env.NEXT_PUBLIC_API_URL;

  async function fetchCsrfToken(): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/csrf-token`, { credentials: "include" });
      const data = await res.json();
      return data?.csrfToken || "";
    } catch {
      return "";
    }
  }

  async function fetchMe() {
    setLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
      if (!token) {
        toast({
          message: "Not signed in. Please login.",
          variant: "error",
        });
        return;
      }
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.detail || "Failed to load profile");
      }
      setUser(data.user);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("auth_user", JSON.stringify(data.user));
      }
      toast({
        message: "Profile refreshed successfully",
        variant: "success",
      });
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to load profile",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshAccess() {
    setLoading(true);
    try {
      const token = await fetchCsrfToken();
      const headers: Record<string, string> = {};
      if (token) headers["X-CSRF-Token"] = token;
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.detail || "Failed to refresh token");
      }
      if (data?.token && typeof window !== "undefined") {
        window.localStorage.setItem("auth_token", data.token);
      }
      toast({
        message: "Access token refreshed successfully",
        variant: "success",
      });
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to refresh token",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    try {
      const token = await fetchCsrfToken();
      const headers: Record<string, string> = {};
      if (token) headers["X-CSRF-Token"] = token;
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers,
        credentials: "include",
      });
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("auth_token");
      window.localStorage.removeItem("auth_user");
    }
    setUser(null);
    toast({
      message: "You've been signed out successfully",
      variant: "success",
    });
    setTimeout(() => {
      router.push("/auth/login");
    }, 1000);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Breadcrumb items={[{ label: "Profile" }]} />
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
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
              <div className="space-y-2 rounded-md border border-border/60 bg-card/50 p-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">ID:</span>{" "}
                  <span className="ml-2 font-mono">{user.id}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="ml-2">{user.email}</span>
                </div>
                {user.name && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <span className="ml-2">{user.name}</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-muted-foreground">Role:</span>{" "}
                  <span className="ml-2 capitalize">{user.role}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Created:</span>{" "}
                  <span className="ml-2">{user.createdAt}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={fetchMe} variant="outline" size="sm" disabled={loading}>
                  {loading ? "Loading..." : "Refresh profile"}
                </Button>
                <Button
                  onClick={handleRefreshAccess}
                  variant="secondary"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh token"}
                </Button>
                <Button onClick={handleLogout} variant="danger" size="sm" disabled={loading}>
                  {loading ? "Signing out..." : "Sign out"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
