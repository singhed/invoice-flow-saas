import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Button } from "../button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("handles click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Action</Button>);
    await user.click(screen.getByRole("button", { name: /action/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies loading state", () => {
    render(<Button loading>Loading</Button>);
    const btn = screen.getByRole("button", { name: /loading/i });
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("renders icons when provided", () => {
    render(
      <Button leftIcon={<span data-testid="left" />} rightIcon={<span data-testid="right" />}>With icons</Button>
    );
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });
});
