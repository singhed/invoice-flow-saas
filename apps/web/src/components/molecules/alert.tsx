import * as React from "react";
import { Alert as PrimitiveAlert } from "@/components/primitives/alert";

export interface AlertProps extends React.ComponentPropsWithoutRef<typeof PrimitiveAlert> {
  title?: string;
  description?: string;
}

export function Alert({ title, description, ...props }: AlertProps) {
  return (
    <PrimitiveAlert {...props}>
      {title && <div className="font-semibold">{title}</div>}
      {description && <div className="text-sm opacity-90">{description}</div>}
    </PrimitiveAlert>
  );
}
