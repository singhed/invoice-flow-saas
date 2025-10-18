import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationToastStack, useToast } from "../../molecules/toast";

function Trigger() {
  const { pushToast } = useToast();
  return (
    <button onClick={() => pushToast({ title: "Hello", description: "World" })}>Trigger</button>
  );
}

describe("Toast stack", () => {
  it("pushes a toast", async () => {
    const user = userEvent.setup();
    render(
      <NotificationToastStack>
        <Trigger />
      </NotificationToastStack>
    );

    await user.click(screen.getByRole("button", { name: /trigger/i }));
    expect(await screen.findByText(/hello/i)).toBeInTheDocument();
    expect(screen.getByText(/world/i)).toBeInTheDocument();
  });
});
