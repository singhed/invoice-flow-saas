import Link from "next/link";
import { Button } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getHealth, ApiClientError } from "@/lib/api";
import { env } from "@/env.mjs";

export const dynamic = "force-dynamic";

async function checkBackendHealth() {
  try {
    const health = await getHealth();
    return {
      status: health.status === "ok" ? "connected" : "error",
      message:
        health.status === "ok"
          ? "Backend is healthy and responding"
          : "Backend returned unexpected status",
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return {
        status: "error",
        message: `Backend error: ${error.message}`,
      };
    }
    return {
      status: "error",
      message: "Cannot connect to backend",
    };
  }
}

export default async function HomePage() {
  const backendHealth = await checkBackendHealth();
  const apiUrl = env.NEXT_PUBLIC_API_URL;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-bold text-slate-100">
          Welcome to {env.NEXT_PUBLIC_APP_NAME}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-300">
          A modern expense management system with AI-powered categorization. Built with Next.js 14
          App Router, TypeScript, and a Go backend.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Backend Status</CardTitle>
            <CardDescription>Connection to Go API at {apiUrl}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  backendHealth.status === "connected" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-slate-300">{backendHealth.message}</span>
            </div>
            {backendHealth.status === "error" && (
              <div className="mt-4 rounded-md bg-red-900/20 p-3 text-sm text-red-400">
                Make sure the backend is running on {apiUrl}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get started with expense management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/invoices">
                <Button variant="primary" className="w-full">
                  View Invoices
                </Button>
              </Link>
              <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  Next.js Documentation
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>What you can do with this application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-semibold text-sky-400">Expense Tracking</h3>
              <p className="text-sm text-slate-400">
                Track and manage all your business expenses in one place
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-sky-400">AI Categorization</h3>
              <p className="text-sm text-slate-400">
                Automatically categorize expenses with AI-powered suggestions
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-sky-400">Attachments</h3>
              <p className="text-sm text-slate-400">
                Upload and manage receipts and supporting documents
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
