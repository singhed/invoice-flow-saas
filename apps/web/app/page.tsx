import Link from "next/link";
import { Button } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { env } from "@/env";
import { HealthStatus } from "@/components/HealthStatus";

export default function HomePage() {
  const apiUrl = env.NEXT_PUBLIC_API_URL;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-bold text-slate-100">Welcome to {env.NEXT_PUBLIC_APP_NAME}</h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-300">
          A modern expense management system with AI-powered categorization. Built with Next.js 14 App Router, TypeScript, and a Go backend.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Backend Status</CardTitle>
            <CardDescription>Connection to Go API at {apiUrl}</CardDescription>
          </CardHeader>
          <CardContent>
            <HealthStatus apiUrl={apiUrl} />
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
              <p className="text-sm text-slate-400">Track and manage all your business expenses in one place</p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-sky-400">AI Categorization</h3>
              <p className="text-sm text-slate-400">Automatically categorize expenses with AI-powered suggestions</p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-sky-400">Attachments</h3>
              <p className="text-sm text-slate-400">Upload and manage receipts and supporting documents</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
