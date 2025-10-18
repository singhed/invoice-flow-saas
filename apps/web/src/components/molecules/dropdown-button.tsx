"use client";
import * as React from "react";
import { Button } from "@/components/atoms/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/primitives/dropdown-menu";

export interface DropdownButtonProps {
  label: string;
  items: Array<{ label: string; onSelect: () => void; disabled?: boolean }>;
}

export function DropdownButton({ label, items }: DropdownButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" aria-haspopup="menu" aria-expanded={false} aria-controls="dropdown-menu">
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent id="dropdown-menu" role="menu">
        {items.map((item) => (
          <DropdownMenuItem key={item.label} disabled={item.disabled} onSelect={item.onSelect} role="menuitem">
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
