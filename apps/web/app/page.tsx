import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Next.js + Go Monorepo";

export default function HomePage() {
  return (
    <main>
      <section style={{ maxWidth: 640, textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
          Welcome to {APP_NAME}
        </h1>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, marginBottom: "2rem" }}>
          This project provides a modern starting point for building web experiences with
          a Next.js frontend and a Go-based API. Use the shared environment configuration
          to point the web application at the API service, and extend both apps to fit
          your product needs.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <Link
            href="https://nextjs.org/docs"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              backgroundColor: "#38bdf8",
              color: "#0f172a",
              fontWeight: 600
            }}
          >
            Next.js Docs
          </Link>
          <a
            href={API_URL + "/healthz"}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              border: "1px solid #38bdf8",
              color: "#38bdf8",
              fontWeight: 600
            }}
          >
            API Health Check
          </a>
        </div>
      </section>
    </main>
  );
}
