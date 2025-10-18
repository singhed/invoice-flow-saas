import * as React from "react";
import { Breadcrumbs, type Crumb } from "@/components/molecules/breadcrumbs";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, crumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="mt-2 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </div>
  );
}
