import { act, fireEvent, render, screen } from "@testing-library/react";
import { AssignmentType } from "@prisma/client";

import { InteractiveTaskRunner } from "@/components/assignments/interactive-task-runner";

describe("InteractiveTaskRunner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reveals hints one by one and submits the real hint count", () => {
    const onSubmit = vi.fn();

    render(
      <InteractiveTaskRunner
        assignmentType={AssignmentType.code_writing}
        content={{
          prompt: "Напиши функцию",
          starterCode: "",
          hints: ["Сначала объяви функцию.", "Не забудь return."],
          timeLimitSec: 10
        }}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText("Подсказки скрыты до запроса.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Открыть подсказку 1" }));
    expect(screen.getByText("• Сначала объяви функцию.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Открыть подсказку 2" }));
    expect(screen.getByText("• Не забудь return.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(screen.getByText("Осталось 2 сек")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("// Напиши решение"), {
      target: { value: "function sum() {\n  return 1;\n}" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Проверить решение" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      hintsUsed: 2,
      answer: {
        code: "function sum() {\n  return 1;\n}"
      }
    });
  });

  it("shows an expired timer state without blocking submission", () => {
    const onSubmit = vi.fn();

    render(
      <InteractiveTaskRunner
        assignmentType={AssignmentType.free_text}
        content={{
          prompt: "Короткий ответ",
          placeholder: "Ответ",
          hints: [],
          timeLimitSec: 3
        }}
        onSubmit={onSubmit}
      />
    );

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByText("Время вышло")).toBeInTheDocument();
    expect(
      screen.getByText("Таймер истёк, но можно спокойно закончить решение и отправить ответ.")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Ответ"), {
      target: { value: "Готово" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Проверить решение" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
