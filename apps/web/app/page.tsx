import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getHealth, ApiClientError } from "@/lib/api";
import { env } from "@/env";
import { createTranslator } from "@/i18n";
import { getCurrentLocale } from "@/i18n/server";

export const dynamic = "force-dynamic";

type TFunc = (key: string, vars?: Record<string, string | number>) => string;

async function checkBackendHealth(t: TFunc) {
  try {
    const health = await getHealth();
    return {
      status: health.status === "ok" ? "connected" : "error",
      message:
        health.status === "ok" ? t("home.status.ok_message") : t("home.status.unexpected_status"),
    } as const;
  } catch (error) {
    if (error instanceof ApiClientError) {
      return {
        status: "error" as const,
        message: `Backend error: ${error.message}`,
      };
    }
    return {
      status: "error" as const,
      message: t("home.status.cannot_connect"),
    };
  }
}

export default async function HomePage() {
  const locale = getCurrentLocale();
  const t = createTranslator(locale);
  const backendHealth = await checkBackendHealth(t);
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const appName = env.NEXT_PUBLIC_APP_NAME;

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-sky-950/30 via-background to-background p-8 md:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-500 bg-clip-text text-transparent">
              {t("home.hero.title")}
            </span>
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">
            {t("home.hero.subtitle", { appName })}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/invoices">
              <Button size="lg" variant="primary">
                {t("home.hero.primary")}
              </Button>
            </Link>
            <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer noopener">
              <Button size="lg" variant="outline">
                {t("home.hero.secondary")}
              </Button>
            </a>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-border/60 bg-card/50 p-4 text-left">
              <div className="text-sm font-semibold text-foreground">
                {t("home.hero.highlights.fast_setup_title")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("home.hero.highlights.fast_setup_desc")}
              </div>
            </div>
            <div className="rounded-md border border-border/60 bg-card/50 p-4 text-left">
              <div className="text-sm font-semibold text-foreground">
                {t("home.hero.highlights.ai_title")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("home.hero.highlights.ai_desc")}
              </div>
            </div>
            <div className="rounded-md border border-border/60 bg-card/50 p-4 text-left">
              <div className="text-sm font-semibold text-foreground">
                {t("home.hero.highlights.secure_title")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("home.hero.highlights.secure_desc")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Status + Quick start */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden">
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`inline-flex h-2.5 w-2.5 rounded-full ${backendHealth.status === "connected" ? "bg-green-500" : "bg-red-500"}`}
              />
              {t("home.status.title")}
            </CardTitle>
            <CardDescription>{t("home.status.api_at", { apiUrl })}</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-sm text-muted-foreground">{backendHealth.message}</p>
            {backendHealth.status === "error" && (
              <div className="mt-4 rounded-md bg-red-900/20 p-3 text-sm text-red-400">
                {t("home.status.ensure_running", { apiUrl })}
              </div>
            )}
          </CardContent>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5"
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("home.quickstart.title")}</CardTitle>
            <CardDescription>{t("home.quickstart.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/invoices">
                <Button variant="primary" className="w-full">
                  {t("home.quickstart.view_invoices")}
                </Button>
              </Link>
              <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer noopener">
                <Button variant="outline" className="w-full">
                  {t("home.quickstart.next_docs")}
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Features */}
      <section>
        <div className="mb-6 text-center md:text-left">
          <h2 className="text-2xl font-semibold tracking-tight">{t("home.features.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("home.features.subtitle")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5 shadow">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15 text-sky-400 ring-1 ring-sky-400/30">
                $
              </span>
              <h3 className="font-semibold">{t("home.features.items.expense_tracking_title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("home.features.items.expense_tracking_desc")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15 text-sky-400 ring-1 ring-sky-400/30">
                *
              </span>
              <h3 className="font-semibold">{t("home.features.items.ai_categorization_title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("home.features.items.ai_categorization_desc")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15 text-sky-400 ring-1 ring-sky-400/30">
                +
              </span>
              <h3 className="font-semibold">{t("home.features.items.attachments_title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("home.features.items.attachments_desc")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15 text-sky-400 ring-1 ring-sky-400/30">
                ?
              </span>
              <h3 className="font-semibold">{t("home.features.items.smart_search_title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("home.features.items.smart_search_desc")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15 text-sky-400 ring-1 ring-sky-400/30">
                #
              </span>
              <h3 className="font-semibold">{t("home.features.items.analytics_title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("home.features.items.analytics_desc")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15 text-sky-400 ring-1 ring-sky-400/30">
                !
              </span>
              <h3 className="font-semibold">{t("home.features.items.privacy_title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t("home.features.items.privacy_desc")}</p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
          <div>
            <h3 className="text-lg font-semibold">{t("home.cta.heading")}</h3>
            <p className="text-sm text-muted-foreground">{t("home.cta.subtitle")}</p>
          </div>
          <Link href="/invoices">
            <Button size="lg" variant="primary">
              {t("home.cta.open_invoices")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
