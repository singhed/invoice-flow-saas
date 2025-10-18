import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "../sidebar";

describe("Sidebar", () => {
  it("toggles collapsed state", async () => {
    const user = userEvent.setup();
    render(<Sidebar items={[{ label: "Home", href: "/" }]} />);

    const toggle = screen.getByRole("button", { name: /collapse sidebar|expand sidebar/i });
    const aside = screen.getByLabelText(/sidebar/i);

    // initial is expanded (has width class w-56)
    expect(aside.className).toMatch(/w-56/);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.click(toggle);

    // collapsed (has width class w-14)
    expect(aside.className).toMatch(/w-14/);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
