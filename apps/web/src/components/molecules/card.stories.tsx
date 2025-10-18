import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardActions } from "./card";
import { Button } from "@/components/atoms/button";

const meta: Meta<typeof Card> = {
  title: "Molecules/Card",
  component: Card,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Card description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content goes here</p>
      </CardContent>
      <CardActions>
        <Button variant="outline">Cancel</Button>
        <Button>Action</Button>
      </CardActions>
    </Card>
  ),
};
