import { AssignmentType } from "@prisma/client";

import {
  buildProgrammingGameState,
  evaluateProgrammingLevel,
  getProgrammingGameLevel
} from "@/lib/programming-game";

describe("programming game", () => {
  it("returns seeded levels", () => {
    expect(getProgrammingGameLevel("loops-race")?.title).toBe("Loops Race");
  });

  it("evaluates a correct level answer", () => {
    const result = evaluateProgrammingLevel("loops-race", {
      gaps: ["1", "3", "steps"]
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
      code: "if (score >= 80) {\n  console.log('passed');\n}"
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
