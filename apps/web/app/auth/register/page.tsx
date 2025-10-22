"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Badge } from "@/components/ui";
import { env } from "@/env";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

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

  function getPasswordStrength(password: string): { strength: number; label: string; variant: "error" | "warning" | "info" | "success" } {
    if (password.length === 0) return { strength: 0, label: "Enter password", variant: "info" };
    if (password.length < 8) return { strength: 1, label: "Too short", variant: "error" };
    
    let strength = 0;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength === 0 || strength === 1) return { strength: 1, label: "Weak", variant: "error" };
    if (strength === 2) return { strength: 2, label: "Fair", variant: "warning" };
    if (strength === 3) return { strength: 3, label: "Good", variant: "info" };
    return { strength: 4, label: "Strong", variant: "success" };
  }

  const passwordStrength = getPasswordStrength(password);

  function validateForm(): boolean {
    const newErrors: { email?: string; password?: string; name?: string } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const token = await fetchCsrfToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["X-CSRF-Token"] = token;

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.detail || "Registration failed. Please try again.");
      }

      if (data?.token) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("auth_token", data.token);
          window.localStorage.setItem("auth_user", JSON.stringify(data.user));
        }
      }

      toast({
        title: "Account created!",
        message: "Welcome! You've successfully registered.",
        variant: "success",
      });

      setTimeout(() => {
        router.push("/invoices");
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      toast({
        title: "Registration failed",
        message: errorMessage,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Register with your email and a secure password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="Jane Doe"
              disabled={loading}
              helperText="Optional"
              prefixIcon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="you@example.com"
              disabled={loading}
              required
              prefixIcon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              }
            />

            <div className="space-y-2">
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="At least 8 characters"
                disabled={loading}
                required
                showPasswordToggle
                prefixIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
              />
              
              {password && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.variant === "error"
                            ? "bg-red-500"
                            : passwordStrength.variant === "warning"
                            ? "bg-yellow-500"
                            : passwordStrength.variant === "info"
                            ? "bg-blue-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant={passwordStrength.variant} size="sm">
                    {passwordStrength.label}
                  </Badge>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Use 12+ characters with a mix of uppercase, lowercase, numbers, and symbols
              </p>
            </div>

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
