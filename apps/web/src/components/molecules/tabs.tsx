"use client";
import * as React from "react";
import { Tabs as BaseTabs, TabsList, TabsTrigger, TabsContent } from "@/components/primitives/tabs";

export interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps extends React.ComponentPropsWithoutRef<typeof BaseTabs> {
  items: TabItem[];
}

export function Tabs({ items, ...props }: TabsProps) {
  return (
    <BaseTabs {...props}>
      <TabsList>
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.content}
        </TabsContent>
      ))}
    </BaseTabs>
  );
}
