import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "./tabs";

const meta: Meta<typeof Tabs> = {
  title: "Molecules/Tabs",
  component: Tabs,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  args: {
    defaultValue: "a",
    items: [
      { value: "a", label: "Tab A", content: <div>Content A</div> },
      { value: "b", label: "Tab B", content: <div>Content B</div> },
    ],
  },
};
