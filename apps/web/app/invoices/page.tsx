"use client";

import { useState, useEffect, useMemo } from "react";
import { getExpenses, ApiClientError } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  SearchInput,
  Pagination,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  EmptyState,
  SkeletonCard,
} from "@/components/ui";
import { createTranslator } from "@/i18n";
import { useToast } from "@/hooks/useToast";

type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  client_notes?: string;
  status?: "paid" | "pending" | "overdue";
};

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "description";

export default function InvoicesPage() {
  const t = createTranslator("en"); // Using hardcoded locale since this is client-side
  const { toast } = useToast();
  
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getExpenses({ limit: 100 });
        // Add mock status for demo purposes
        const expensesWithStatus = data.map((expense: Expense) => ({
          ...expense,
          status: expense.status || (Math.random() > 0.5 ? "paid" : "pending"),
        }));
        setExpenses(expensesWithStatus);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof ApiClientError ? err.message : "Failed to fetch expenses";
        setError(errorMessage);
        toast({
          title: "Error loading invoices",
          message: errorMessage,
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!expenses) return [];
    const uniqueCategories = new Set(expenses.map((e) => e.category).filter(Boolean));
    return Array.from(uniqueCategories);
  }, [expenses]);

  // Filter and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    if (!expenses) return [];

    let filtered = expenses.filter((expense) => {
      const matchesSearch =
        searchQuery === "" ||
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.amount.toString().includes(searchQuery) ||
        expense.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        case "description":
          return a.description.localeCompare(b.description);
        default:
          return 0;
      }
    });

    return filtered;
  }, [expenses, searchQuery, categoryFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedExpenses.length / itemsPerPage);
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedExpenses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedExpenses, currentPage, itemsPerPage]);

  const handleDelete = (id: string) => {
    toast({
      title: "Invoice deleted",
      message: "The invoice has been successfully deleted.",
      variant: "success",
    });
    // In a real app, you would make an API call here
  };

  const handleEdit = (id: string) => {
    toast({
      message: "Edit functionality coming soon!",
      variant: "info",
    });
  };

  const handleView = (id: string) => {
    toast({
      message: "Invoice details coming soon!",
      variant: "info",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 text-4xl font-bold">{t("invoices.title")}</h1>
          <p className="text-muted-foreground">{t("invoices.subtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 text-4xl font-bold">{t("invoices.title")}</h1>
          <p className="text-muted-foreground">{t("invoices.subtitle")}</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon="⚠️"
              title={t("invoices.error_title")}
              description={error}
              action={{
                label: "Retry",
                onClick: () => window.location.reload(),
                variant: "primary",
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 text-4xl font-bold">{t("invoices.title")}</h1>
          <p className="text-muted-foreground">{t("invoices.subtitle")}</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon="📄"
              title={t("invoices.empty_title")}
              description={t("invoices.empty_desc")}
              action={{
                label: "Create Invoice",
                onClick: () =>
                  toast({
                    message: "Invoice creation coming soon!",
                    variant: "info",
                  }),
                variant: "primary",
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold">{t("invoices.title")}</h1>
          <p className="text-muted-foreground">{t("invoices.subtitle")}</p>
        </div>
        <button
          onClick={() =>
            toast({
              message: "Invoice creation coming soon!",
              variant: "info",
            })
          }
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Invoice
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput onSearchChange={setSearchQuery} placeholder="Search invoices..." />
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
            <option value="description">By Description</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedExpenses.length} of {filteredAndSortedExpenses.length} invoices
      </div>

      {/* Invoices Grid */}
      {filteredAndSortedExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon="🔍"
              title="No invoices found"
              description="Try adjusting your search or filters to find what you're looking for."
              action={{
                label: "Clear Filters",
                onClick: () => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                },
                variant: "outline",
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedExpenses.map((expense) => (
              <Card key={expense.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{expense.description}</CardTitle>
                      <CardDescription>{new Date(expense.date).toLocaleDateString()}</CardDescription>
                    </div>
                    <DropdownMenu
                      trigger={
                        <button
                          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                          aria-label="Invoice actions"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                      }
                    >
                      <DropdownMenuItem onClick={() => handleView(expense.id)}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(expense.id)}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(expense.id)} variant="danger">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("invoices.amount")}</span>
                      <span className="text-lg font-semibold text-primary">${expense.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {expense.category && (
                        <Badge variant="default" size="sm">
                          {expense.category}
                        </Badge>
                      )}
                      {expense.status && (
                        <Badge
                          variant={
                            expense.status === "paid"
                              ? "success"
                              : expense.status === "overdue"
                              ? "error"
                              : "warning"
                          }
                          size="sm"
                        >
                          {expense.status}
                        </Badge>
                      )}
                    </div>
                    {expense.client_notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{expense.client_notes}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={(newSize) => {
                  setItemsPerPage(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
