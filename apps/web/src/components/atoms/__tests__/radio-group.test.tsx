import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RadioGroup } from "../radio-group";

describe("RadioGroup", () => {
  it("changes selection via click and keyboard", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup
        name="plan"
        items={[{ label: "Basic", value: "basic" }, { label: "Pro", value: "pro" }]}
      />
    );

    const basic = screen.getByLabelText(/basic/i);
    const pro = screen.getByLabelText(/pro/i);

    await user.click(basic);
    expect(basic).toHaveAttribute("data-state", "checked");

    await user.keyboard("{ArrowDown}");
    expect(pro).toHaveAttribute("data-state", "checked");
  });
});
