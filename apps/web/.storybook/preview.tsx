import * as React from "react";
import type { Preview } from "@storybook/react";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: "app",
      values: [
        { name: "app", value: "hsl(0 0% 100%)" },
        { name: "app-dark", value: "hsl(224 71% 4%)" },
      ],
    },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      if (typeof document !== "undefined") {
        const isDark = context.globals.theme === "dark";
        document.documentElement.classList.toggle("dark", isDark);
      }
      return (
        <div className="min-h-screen bg-background p-6 text-foreground">
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
