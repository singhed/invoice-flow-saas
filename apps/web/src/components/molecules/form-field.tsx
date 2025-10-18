"use client";
import * as React from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { TextField, type TextFieldProps } from "@/components/atoms/text-field";

export interface FormFieldProps<TFieldValues extends FieldValues>
  extends Omit<TextFieldProps, "onChange" | "onBlur" | "value" | "ref"> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
}

export function FormField<TFieldValues extends FieldValues>({ control, name, helperText, label, ...props }: FormFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          label={label}
          helperText={helperText}
          error={fieldState.error?.message}
          {...props}
          {...field}
        />
      )}
    />
  );
}
