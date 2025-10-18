import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "../tabs";

describe("Tabs", () => {
  it("switches content when a tab is activated", async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        defaultValue="a"
        items={[
          { value: "a", label: "A", content: <div>A content</div> },
          { value: "b", label: "B", content: <div>B content</div> },
        ]}
      />
    );
    expect(screen.getByText(/a content/i)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "B" }));
    expect(screen.getByText(/b content/i)).toBeInTheDocument();
  });
});
