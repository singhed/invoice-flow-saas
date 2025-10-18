import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "./tooltip";
import { IconButton } from "./icon-button";

const meta: Meta<typeof Tooltip> = {
  title: "Atoms/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="More info">
      <IconButton aria-label="Info">ℹ️</IconButton>
    </Tooltip>
  ),
};
