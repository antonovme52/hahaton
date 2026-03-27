import { AssignmentType } from "@prisma/client";

import {
  evaluateAssignmentAnswer,
  getAssignmentCategory,
  getLatestAttemptStats,
  isProgrammingAssignmentType
} from "@/lib/assignments";

describe("assignment evaluation", () => {
  it("scores multiple choice answers", () => {
    const result = evaluateAssignmentAnswer(
      AssignmentType.multiple_choice,
      {
        prompt: "Quiz prompt",
        hints: [],
        options: ["a", "b", "c"],
        expectedOptionIndex: 1
      },
      { selectedIndex: 1 }
    );

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
  });

  it("computes partial score for code gaps", () => {
    const result = evaluateAssignmentAnswer(
      AssignmentType.code_gaps,
      {
        prompt: "Fill the loop",
        hints: [],
        template: "for (...)",
        gapLabels: ["start", "end"],
        expectedGaps: ["0", "3"]
      },
      { gaps: ["0", "1"] }
    );

    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(50);
  });

  it("derives programming category from code assignment types", () => {
    expect(getAssignmentCategory(AssignmentType.code_order)).toBe("programming");
    expect(isProgrammingAssignmentType(AssignmentType.bug_fix)).toBe(true);
    expect(getAssignmentCategory(AssignmentType.free_text)).toBe("general");
    expect(isProgrammingAssignmentType(AssignmentType.free_text)).toBe(false);
  });

  it("aggregates latest attempt stats by student", () => {
    const stats = getLatestAttemptStats([
      {
        studentId: "a",
        isCorrect: false,
        durationSeconds: 40,
        submittedAt: new Date("2026-03-01T10:00:00Z")
      },
      {
        studentId: "a",
        isCorrect: true,
        durationSeconds: 32,
        submittedAt: new Date("2026-03-01T11:00:00Z")
      },
      {
        studentId: "b",
        isCorrect: false,
        durationSeconds: 50,
        submittedAt: new Date("2026-03-01T11:30:00Z")
      }
    ]);

    expect(stats.uniqueStudents).toBe(2);
    expect(stats.correctRate).toBe(50);
    expect(stats.averageDurationSec).toBe(41);
  });
});
