import * as React from "react";
import { Card as BaseCard, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/primitives/card";
import { cn } from "@/lib/utils";

export const Card = BaseCard;
export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

export function CardActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-2", className)} {...props} />;
}
