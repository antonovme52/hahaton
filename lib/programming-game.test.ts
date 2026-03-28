import { AssignmentType } from "@prisma/client";

import {
  buildProgrammingGameState,
  evaluateProgrammingLevel,
  getProgrammingGameLevel
} from "@/lib/programming-game";

describe("programming game", () => {
  it("returns seeded levels", () => {
    expect(getProgrammingGameLevel("loops-race")?.title).toBe("Петля ускорения");
  });

  it("evaluates a correct level answer", () => {
    const result = evaluateProgrammingLevel("loops-race", {
      slotAnswers: {
        count: "3",
        action: "jump"
      }
    });

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
  });

  it("includes the bug-fix level in the four-step progression", () => {
    const level = getProgrammingGameLevel("condition-rescue");

    expect(level?.type).toBe(AssignmentType.bug_fix);
    expect(level?.order).toBe(3);
  });

  it("evaluates a correct bug-fix answer", () => {
    const result = evaluateProgrammingLevel("condition-rescue", {
      slotAnswers: {
        condition: "green",
        actionTrue: "move",
        actionFalse: "wait"
      }
    });

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
  });

  it("evaluates a correct sequence answer for the final level", () => {
    const result = evaluateProgrammingLevel("function-sprint", {
      blockIds: ["start", "step-right", "step-right", "celebrate"]
    });

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
  });

  it("builds summary and lock state from completed progress", () => {
    const state = buildProgrammingGameState([
      {
        levelKey: "arrays-bridge",
        attempts: 1,
        bestScore: 100,
        completed: true,
        hintsUsed: 0,
        lastDurationSec: 80
      }
    ]);

    expect(state.summary.completedLevels).toBe(1);
    expect(state.summary.totalLevels).toBe(4);
    expect(state.summary.earnedXp).toBe(25);
    expect(state.summary.completionPercent).toBe(25);
    expect(state.summary.nextLevelKey).toBe("loops-race");
    expect(state.levels.find((level) => level.key === "loops-race")?.locked).toBe(false);
    expect(state.levels.find((level) => level.key === "condition-rescue")?.locked).toBe(true);
  });
});
