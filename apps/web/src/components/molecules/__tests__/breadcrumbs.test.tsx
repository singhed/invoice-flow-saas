import { render, screen } from "@testing-library/react";
import { Breadcrumbs } from "../breadcrumbs";

describe("Breadcrumbs", () => {
  it("marks last crumb as current page", () => {
    render(<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Settings" }]} />);
    const current = screen.getByText(/settings/i);
    expect(current).toHaveAttribute("aria-current", "page");
  });
});
