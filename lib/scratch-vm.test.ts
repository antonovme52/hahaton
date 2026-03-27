import { blockCatalog, createWorkspaceBlock } from "@/lib/block-programming";
import {
  advanceVmFrame,
  createProjectSnapshot,
  createScratchVm,
  dispatchKeyEvent,
  startVm,
  stopVm,
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
});
