import {
  buildLeaderboardRows,
  canInspectGroup,
  getLeaderboardPeriodLabel,
  getLeaderboardWindowStart,
  parseLeaderboardPeriod
} from "@/lib/leaderboard";

describe("leaderboard helpers", () => {
  it("parses known periods and falls back to all", () => {
    expect(parseLeaderboardPeriod("week")).toBe("week");
    expect(parseLeaderboardPeriod("month")).toBe("month");
    expect(parseLeaderboardPeriod("weird")).toBe("all");
  });

  it("creates a window for weekly and monthly modes", () => {
    const now = new Date("2026-03-27T12:00:00.000Z");

    expect(getLeaderboardWindowStart("all")).toBeNull();
    expect(getLeaderboardWindowStart("week", now)?.toISOString()).toBe("2026-03-20T12:00:00.000Z");
    expect(getLeaderboardWindowStart("month", now)?.toISOString()).toBe("2026-02-25T12:00:00.000Z");
  });

  it("returns readable labels for leaderboard periods", () => {
    expect(getLeaderboardPeriodLabel("all")).toBe("Общий рейтинг");
    expect(getLeaderboardPeriodLabel("week")).toBe("За неделю");
    expect(getLeaderboardPeriodLabel("month")).toBe("За месяц");
  });

  it("allows teachers to inspect only their groups", () => {
    expect(canInspectGroup("teacher", "u1", "u1")).toBe(true);
    expect(canInspectGroup("teacher", "u2", "u1")).toBe(false);
    expect(canInspectGroup("student", "u2", "u1")).toBe(true);
  });

  it("sorts leaderboard rows by score, breaks ties by name and highlights the current user", () => {
    expect(
      buildLeaderboardRows(
        [
          { id: "s1", userId: "u1", name: "Яна", avatar: "rocket", score: 120 },
          { id: "s2", userId: "u2", name: "Алина", avatar: "spark", score: 200 },
          { id: "s3", userId: "u3", name: "Борис", avatar: "comet", score: 200 }
        ],
        "u3"
      )
    ).toEqual([
      {
        id: "s2",
        userId: "u2",
        name: "Алина",
        avatar: "spark",
        score: 200,
        rank: 1,
        isCurrentUser: false
      },
      {
        id: "s3",
        userId: "u3",
        name: "Борис",
        avatar: "comet",
        score: 200,
        rank: 2,
        isCurrentUser: true
      },
      {
        id: "s1",
        userId: "u1",
        name: "Яна",
        avatar: "rocket",
        score: 120,
        rank: 3,
        isCurrentUser: false
      }
    ]);
  });
});
