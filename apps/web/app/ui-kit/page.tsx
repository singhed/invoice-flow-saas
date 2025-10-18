"use client";
import * as React from "react";
import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { TextField } from "@/components/atoms/text-field";
import { Select } from "@/components/atoms/select";
import { Checkbox } from "@/components/atoms/checkbox";
import { RadioGroup } from "@/components/atoms/radio-group";
import { Switch } from "@/components/atoms/switch";
import { Badge } from "@/components/atoms/badge";
import { Tooltip } from "@/components/atoms/tooltip";
import { Skeleton } from "@/components/atoms/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/molecules/card";
import { Tabs } from "@/components/molecules/tabs";
import { Modal } from "@/components/molecules/dialog-modal";
import { Pagination } from "@/components/molecules/pagination";
import { Breadcrumbs } from "@/components/molecules/breadcrumbs";
import { Alert } from "@/components/molecules/alert";
import { NotificationToastStack, useToast } from "@/components/molecules/toast";

function ToastDemo() {
  const { pushToast } = useToast();
  return (
    <Button onClick={() => pushToast({ title: "Saved", description: "Your changes have been saved." })}>
      Show toast
    </Button>
  );
}

export default function UIKitPage() {
  const [page, setPage] = React.useState(1);
  return (
    <NotificationToastStack>
      <div className="space-y-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "UI Kit" }]} />
        <h1 className="text-3xl font-bold">UI Kit</h1>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Variants and sizes</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <IconButton aria-label="Like">👍</IconButton>
              <Tooltip content="Tooltip text">
                <IconButton aria-label="Info" variant="ghost">ℹ️</IconButton>
              </Tooltip>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Fields</CardTitle>
              <CardDescription>Accessible inputs with helper text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <TextField label="Email" placeholder="you@example.com" type="email" helperText="We'll never share your email." />
              <TextField label="Password" type="password" error="Must be at least 6 characters" />
              <Select
                placeholder="Select option"
                items={[
                  { label: "Option A", value: "a" },
                  { label: "Option B", value: "b" },
                ]}
              />
              <div className="flex items-center gap-4">
                <Checkbox label="Remember me" />
                <Switch label="Notifications" />
              </div>
              <RadioGroup
                name="plan"
                items={[
                  { label: "Basic", value: "basic" },
                  { label: "Pro", value: "pro" },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabs & Modal</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="one"
                items={[
                  { value: "one", label: "One", content: <div>Tab one</div> },
                  { value: "two", label: "Two", content: <div>Tab two</div> },
                ]}
              />
              <div className="mt-4">
                <Modal title="Confirm" description="Are you sure?" trigger={<Button variant="outline">Open Modal</Button>}>
                  <p>Modal content goes here.</p>
                </Modal>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert title="Heads up" description="This is an example alert." />
              <Badge>New</Badge>
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
              <ToastDemo />
            </CardContent>
          </Card>
        </section>

        <Pagination page={page} pageCount={5} onPageChange={setPage} />
      </div>
    </NotificationToastStack>
  );
}
