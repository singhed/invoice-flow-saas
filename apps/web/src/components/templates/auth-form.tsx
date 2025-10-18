"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/atoms/button";
import { FormField } from "@/components/molecules/form-field";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type Values = z.infer<typeof schema>;

export interface AuthFormProps {
  onSubmit?: (values: Values) => Promise<void> | void;
}

export function AuthForm({ onSubmit }: AuthFormProps) {
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const [loading, setLoading] = React.useState(false);

  async function submit(values: Values) {
    try {
      setLoading(true);
      await onSubmit?.(values);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
      <FormField control={control} name="email" type="email" label="Email" placeholder="you@example.com" />
      <FormField control={control} name="password" type="password" label="Password" />
      <Button type="submit" loading={loading} disabled={loading || !formState.isValid} className="w-full">
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
