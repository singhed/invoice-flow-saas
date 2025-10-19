import { getExpenses, ApiClientError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { createTranslator } from "@/i18n";
import { getCurrentLocale } from "@/i18n/server";

export const dynamic = "force-dynamic";

async function fetchExpenses() {
  try {
    const expenses = await getExpenses({ limit: 100 });
    return { expenses, error: null as string | null };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { expenses: null, error: error.message };
    }
    return { expenses: null, error: "Failed to fetch expenses" };
  }
}

export default async function InvoicesPage() {
  const { expenses, error } = await fetchExpenses();
  const t = createTranslator(getCurrentLocale());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-4xl font-bold text-slate-100">{t("invoices.title")}</h1>
        <p className="text-slate-400">{t("invoices.subtitle")}</p>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mb-4 text-6xl">⚠️</div>
              <h3 className="mb-2 text-xl font-semibold text-slate-200">{t("invoices.error_title")}</h3>
              <p className="mb-4 text-slate-400">{error}</p>
              <p className="text-sm text-slate-500">
                {t("invoices.error_hint")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : expenses && expenses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardHeader>
                <CardTitle className="text-lg">{expense.description}</CardTitle>
                <CardDescription>{new Date(expense.date).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t("invoices.amount")}</span>
                    <span className="font-semibold text-sky-400">${expense.amount.toFixed(2)}</span>
                  </div>
                  {expense.category && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t("invoices.category")}</span>
                      <span className="rounded-full bg-slate-700 px-3 py-1 text-xs">
                        {expense.category}
                      </span>
                    </div>
                  )}
                  {expense.client_notes && (
                    <div className="mt-2 text-sm text-slate-400">{expense.client_notes}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mb-4 text-6xl">📄</div>
              <h3 className="mb-2 text-xl font-semibold text-slate-200">{t("invoices.empty_title")}</h3>
              <p className="text-slate-400">
                {t("invoices.empty_desc")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
