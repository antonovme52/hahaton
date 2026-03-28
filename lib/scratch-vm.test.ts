import { blockCatalog, createWorkspaceBlock } from "@/lib/block-programming";
import {
  advanceVmFrame,
  createProjectSnapshot,
  createScratchVm,
  dispatchKeyEvent,
  startVm,
  stopVm,
  submitVmAnswer,
  updateMousePosition,
  type VmSpriteState
} from "@/lib/scratch-vm";

function sprite(id: string, name: string): VmSpriteState {
  return {
    id,
    name,
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    visible: true,
    currentCostumeId: `${id}-costume`,
    costumes: [
      {
        id: `${id}-costume`,
        name: "costume 1",
        assetUrl: "data:image/svg+xml,<svg/>",
        width: 120,
        height: 120,
        source: "builtin"
      }
    ],
    volume: 100,
    rotationStyle: "все направления",
    bubble: null
  };
}

function workspaceBlock(blockId: string, params: Record<string, string> = {}) {
  const source = blockCatalog.find((block) => block.id === blockId);

  if (!source) {
    throw new Error(`Unknown block ${blockId}`);
  }

  const block = createWorkspaceBlock(source);
  block.parameters = block.parameters.map((parameter) =>
    parameter.id in params ? { ...parameter, value: params[parameter.id] ?? parameter.value } : parameter
  );
  return block;
}

describe("scratch vm", () => {
  it("runs green-flag scripts for all sprites in parallel", () => {
    const sprites = [sprite("s1", "Sprite 1"), sprite("s2", "Sprite 2")];
    const workspaces = {
      s1: [workspaceBlock("event-flag"), workspaceBlock("motion-move", { steps: "10" })],
      s2: [workspaceBlock("event-flag"), workspaceBlock("motion-move", { steps: "25" })]
    };

    const started = startVm(createScratchVm(sprites), createProjectSnapshot(sprites, workspaces));
    const executed = advanceVmFrame(started, 16);

    expect(executed.sprites.find((item) => item.id === "s1")?.x).toBe(10);
    expect(executed.sprites.find((item) => item.id === "s2")?.x).toBe(25);
  });

  it("waits before continuing a script", () => {
    const sprites = [sprite("s1", "Sprite 1")];
    const workspaces = {
      s1: [
        workspaceBlock("event-flag"),
        workspaceBlock("control-wait", { seconds: "1" }),
        workspaceBlock("motion-move", { steps: "12" })
      ]
    };

    const started = startVm(createScratchVm(sprites), createProjectSnapshot(sprites, workspaces));
    const beforeWait = advanceVmFrame(started, 100);
    const afterWait = advanceVmFrame(beforeWait, 1000);

    expect(beforeWait.sprites[0]?.x).toBe(0);
    expect(afterWait.sprites[0]?.x).toBe(12);
  });

  it("continues with following blocks after wait across multiple frames", () => {
    const sprites = [sprite("s1", "Sprite 1")];
    const workspaces = {
      s1: [
        workspaceBlock("event-flag"),
        workspaceBlock("motion-move", { steps: "5" }),
        workspaceBlock("control-wait", { seconds: "1" }),
        workspaceBlock("motion-move", { steps: "7" })
      ]
    };

    const started = startVm(createScratchVm(sprites), createProjectSnapshot(sprites, workspaces));
    const first = advanceVmFrame(started, 16);
    const half = advanceVmFrame(first, 500);
    const almost = advanceVmFrame(half, 400);
    const done = advanceVmFrame(almost, 100);

    expect(first.sprites[0]?.x).toBe(5);
    expect(half.sprites[0]?.x).toBe(5);
    expect(almost.sprites[0]?.x).toBe(5);
    expect(done.sprites[0]?.x).toBe(12);
  });

  it("runs wait then move then say then stop in the same script", () => {
    const sprites = [sprite("s1", "Sprite 1")];
    const workspaces = {
      s1: [
        workspaceBlock("event-flag"),
        workspaceBlock("control-wait", { seconds: "1" }),
        workspaceBlock("motion-move", { steps: "10" }),
        workspaceBlock("looks-say", { message: "Привет", seconds: "2" }),
        workspaceBlock("control-stop", { target: "этот скрипт" })
      ]
    };

    const started = startVm(createScratchVm(sprites), createProjectSnapshot(sprites, workspaces));
    const beforeWait = advanceVmFrame(started, 500);
    const afterWait = advanceVmFrame(beforeWait, 500);
    const afterSay = advanceVmFrame(afterWait, 16);
    const finished = advanceVmFrame(afterSay, 2000);

    expect(beforeWait.sprites[0]?.x).toBe(0);
    expect(afterWait.sprites[0]?.x).toBe(10);
    expect(afterSay.sprites[0]?.bubble?.message).toBe("Привет");
    expect(finished.threads).toHaveLength(0);
    expect(finished.sprites[0]?.x).toBe(10);
  });

  it("does not get stuck when wait is the last block in a script", () => {
    const sprites = [sprite("s1", "Sprite 1")];
    const workspaces = {
      s1: [workspaceBlock("event-flag"), workspaceBlock("motion-move", { steps: "8" }), workspaceBlock("control-wait", { seconds: "1" })]
    };

    const started = startVm(createScratchVm(sprites), createProjectSnapshot(sprites, workspaces));
    const waiting = advanceVmFrame(started, 16);
    const finished = advanceVmFrame(waiting, 1000);

    expect(waiting.sprites[0]?.x).toBe(8);
    expect(waiting.threads).toHaveLength(1);
    expect(finished.sprites[0]?.x).toBe(8);
    expect(finished.threads).toHaveLength(0);
  });

  it("starts keyboard event scripts on key press", () => {
    const sprites = [sprite("s1", "Sprite 1")];
    const workspaces = {
      s1: [workspaceBlock("event-key", { key: "пробел" }), workspaceBlock("motion-move", { steps: "7" })]
    };

    const started = startVm(createScratchVm(sprites), createProjectSnapshot(sprites, workspaces));
    const withKey = dispatchKeyEvent(started, "пробел");
    const executed = advanceVmFrame(withKey, 16);

    expect(executed.sprites[0]?.x).toBe(7);
  });

  it("delivers broadcast messages between sprites", () => {
    const sprites = [sprite("s1", "Sender"), sprite("s2", "Receiver")];
    const workspaces = {
      s1: [workspaceBlock("event-flag"), workspaceBlock("event-broadcast", { message: "start" })],
      s2: [
        workspaceBlock("event-when-received", { message: "start" }),
        workspaceBlock("motion-move", { steps: "9" })
      ]
    };

    const started = startVm(createScratchVm(sprites), createProjectSnapshot(sprites, workspaces));
    const executed = advanceVmFrame(started, 16);

    expect(executed.sprites.find((item) => item.id === "s2")?.x).toBe(9);
  });

  it("limits steps per frame for infinite loops and warns the user", () => {
    const sprites = [sprite("s1", "Looper")];
    const forever = workspaceBlock("control-forever");
    forever.sections[0]!.blocks.push(workspaceBlock("motion-move", { steps: "1" }));
    const workspaces = {
      s1: [workspaceBlock("event-flag"), forever]
    };

    const started = startVm(createScratchVm(sprites), createProjectSnapshot(sprites, workspaces));
    const executed = advanceVmFrame(started, 16);

    expect(executed.frameWarning).toContain("Лимит шагов");
    expect(executed.sprites[0]!.x).toBeGreaterThan(0);
    expect(executed.sprites[0]!.x).toBeLessThan(240);
  });

  it("resets sprite state on stop", () => {
    const sprites = [{ ...sprite("s1", "Reset"), x: 14 }];
    const workspaces = {
      s1: [workspaceBlock("event-flag"), workspaceBlock("motion-move", { steps: "10" })]
    };

    const started = startVm(createScratchVm(sprites), createProjectSnapshot(sprites, workspaces));
    const executed = advanceVmFrame(started, 16);
    const stopped = stopVm(executed);

    expect(executed.sprites[0]?.x).toBe(24);
    expect(stopped.sprites[0]?.x).toBe(14);
    expect(stopped.status).toBe("stopped");
  });

  it("treats mouse pointer as a valid target for touching checks", () => {
    const sprites = [sprite("s1", "Sprite 1")];
    const workspaces = {
      s1: [workspaceBlock("event-flag"), workspaceBlock("sensing-touching-sprite", { target: "указатель мыши" })]
    };

    const started = startVm(createScratchVm(sprites), createProjectSnapshot(sprites, workspaces));
    const withMouse = updateMousePosition(started, 0, 0);
    const executed = advanceVmFrame(withMouse, 16);

    expect(executed.logs.some((entry) => entry.message.includes("true"))).toBe(true);
  });

  it("waits for user input and resumes after answer submission", () => {
    const sprites = [sprite("s1", "Guide")];
    const workspaces = {
      s1: [
        workspaceBlock("event-flag"),
        workspaceBlock("sensing-ask-and-wait", { question: "Как тебя зовут?" }),
        workspaceBlock("motion-move", { steps: "15" })
      ]
    };

    const started = startVm(createScratchVm(sprites), createProjectSnapshot(sprites, workspaces));
    const waiting = advanceVmFrame(started, 16);

    expect(waiting.prompt?.question).toBe("Как тебя зовут?");
    expect(waiting.sprites[0]?.bubble?.message).toBe("Как тебя зовут?");
    expect(waiting.sprites[0]?.x).toBe(0);

    const answered = submitVmAnswer(waiting, "Маша");
    const executed = advanceVmFrame(answered, 16);

    expect(executed.prompt).toBeNull();
    expect(executed.answer).toBe("Маша");
    expect(executed.sprites[0]?.bubble).toBeNull();
    expect(executed.sprites[0]?.x).toBe(15);
  });
});
