"use client";

import { useEffect, useState } from "react";
import { ApiClientError, getHealth } from "@/lib/api";
import { Loading } from "@/components/ui";

type HealthState = {
  status: "loading" | "connected" | "error";
  message: string;
};

export function HealthStatus({ apiUrl }: { apiUrl: string }) {
  const [state, setState] = useState<HealthState>({ status: "loading", message: "Checking backend..." });

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function run() {
      try {
        const health = await getHealth({ signal: controller.signal, timeoutMs: 2500 });
        if (!mounted) return;
        setState({
          status: health.status === "ok" ? "connected" : "error",
          message: health.status === "ok" ? "Backend is healthy and responding" : "Backend returned unexpected status",
        });
      } catch (error) {
        if (!mounted) return;
        if (error instanceof ApiClientError) {
          setState({ status: "error", message: `Backend error: ${error.message}` });
        } else {
          setState({ status: "error", message: "Cannot connect to backend" });
        }
      }
    }

    run();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-3">
        <Loading size="sm" />
        <span className="text-slate-300">Checking backend at {apiUrl}...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${state.status === "connected" ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-slate-300">{state.message}</span>
      </div>
      {state.status === "error" && (
        <div className="mt-4 rounded-md bg-red-900/20 p-3 text-sm text-red-400">Make sure the backend is running on {apiUrl}</div>
      )}
    </div>
  );
}
