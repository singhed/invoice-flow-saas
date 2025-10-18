"use client";
import * as React from "react";
import { PageHeader } from "@/components/organisms/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/card";

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" crumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Update your profile information.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Control your notification preferences.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
