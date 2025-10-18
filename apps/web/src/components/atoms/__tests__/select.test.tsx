import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "../select";

describe("Select", () => {
  it("opens and selects an item", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select
        placeholder="Choose"
        items={[{ label: "A", value: "a" }, { label: "B", value: "b" }]}
        onValueChange={onValueChange as any}
      />
    );
    const trigger = screen.getByRole("button", { name: /choose/i });
    await user.click(trigger);
    const item = await screen.findByText("B");
    await user.click(item);
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});
