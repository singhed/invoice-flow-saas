import Link from "next/link";
import { env } from "@/env";
import { getHealth, ApiClientError } from "@/lib/api";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/molecules/card";
import { FadeIn, SlideUp } from "@/components/atoms/motion";

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
    <div className="space-y-10">
      <section className="text-center">
        <FadeIn>
          <Badge className="mb-4">Invoice Flow SaaS</Badge>
          <h1 className="mb-3 text-5xl font-bold tracking-tight">{env.NEXT_PUBLIC_APP_NAME}</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A modern expense and invoice management system with AI-powered categorization. Built with
            Next.js 14 App Router, TypeScript, TailwindCSS, Radix, and a Go backend.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/invoices">
              <Button size="lg">View Invoices</Button>
            </Link>
            <Link href="/ui-kit">
              <Button variant="outline" size="lg">Explore UI Kit</Button>
            </Link>
          </div>
        </FadeIn>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[{
          label: "Total Invoices",
          value: "1,248",
          sub: "+12% this month",
          icon: "📄",
        },{
          label: "Paid (30d)",
          value: "$84,210",
          sub: "+5.6%",
          icon: "✅",
        },{
          label: "Vendors",
          value: "56",
          sub: "Active",
          icon: "🏢",
        }].map((stat) => (
          <SlideUp key={stat.label}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span aria-hidden>{stat.icon}</span> {stat.label}
                </CardTitle>
                <CardDescription>{stat.sub}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{stat.value}</div>
              </CardContent>
            </Card>
          </SlideUp>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <SlideUp>
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
                <span className="text-muted-foreground">{backendHealth.message}</span>
              </div>
              {backendHealth.status === "error" && (
                <div className="mt-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  Make sure the backend is running on {apiUrl}
                </div>
              )}
            </CardContent>
          </Card>
        </SlideUp>

        <SlideUp>
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>Get productive quickly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/invoices">
                  <Button className="w-full">Invoices</Button>
                </Link>
                <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">Next.js Docs</Button>
                </a>
                <a href="https://tanstack.com/table/latest" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">TanStack Table</Button>
                </a>
                <Link href="/ui-kit">
                  <Button variant="secondary" className="w-full">UI Kit</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>What you can do with this application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {[{
                title: "Expense Tracking",
                body: "Track and manage all your business expenses in one place.",
                icon: "🧾",
              },{
                title: "AI Categorization",
                body: "Automatically categorize expenses with AI-powered suggestions.",
                icon: "🤖",
              },{
                title: "Attachments",
                body: "Upload and manage receipts and supporting documents.",
                icon: "📎",
              }].map((f) => (
                <div key={f.title}>
                  <div className="mb-2 text-2xl" aria-hidden>{f.icon}</div>
                  <h3 className="mb-1 font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
