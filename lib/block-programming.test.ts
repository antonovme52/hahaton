import {
  blockCatalog,
  countWorkspaceBlocks,
  createWorkspaceBlock,
  duplicateWorkspaceStack,
  filterBlocksByName,
  groupBlocksByCategory,
  insertWorkspaceBlock,
  insertWorkspaceBlockTree,
  moveWorkspaceBlock,
  moveWorkspaceBlockTree,
  removeWorkspaceBlockTree
} from "@/lib/block-programming";

describe("block programming helpers", () => {
  it("keeps all eight palette categories available", () => {
    const groups = groupBlocksByCategory(blockCatalog);

    expect(groups).toHaveLength(8);
    expect(groups.every((group) => group.blocks.length > 0)).toBe(true);
  });

  it("filters blocks by a partial russian name", () => {
    const filtered = filterBlocksByName(blockCatalog, "остановить все");

    expect(filtered.map((block) => block.id)).toEqual(["sound-stop"]);
  });

  it("inserts and reorders workspace blocks predictably", () => {
    const inserted = insertWorkspaceBlock(
      [{ instanceId: "a" }, { instanceId: "b" }],
      { instanceId: "c" },
      1
    );
    const moved = moveWorkspaceBlock(inserted, "a", 3);

    expect(inserted.map((block) => block.instanceId)).toEqual(["a", "c", "b"]);
    expect(moved.map((block) => block.instanceId)).toEqual(["c", "b", "a"]);
  });

  it("supports nested insert, move and remove operations in the workspace tree", () => {
    const repeat = createWorkspaceBlock(blockCatalog.find((block) => block.id === "control-repeat")!);
    const say = createWorkspaceBlock(blockCatalog.find((block) => block.id === "looks-say")!);
    const move = createWorkspaceBlock(blockCatalog.find((block) => block.id === "motion-move")!);

    const withRepeat = insertWorkspaceBlockTree([], { parentInstanceId: null, sectionId: null, index: 0 }, repeat);
    const nested = insertWorkspaceBlockTree(
      withRepeat,
      { parentInstanceId: repeat.instanceId, sectionId: repeat.sections[0]?.id || null, index: 0 },
      say
    );
    const moved = moveWorkspaceBlockTree(
      insertWorkspaceBlockTree(nested, { parentInstanceId: null, sectionId: null, index: 1 }, move),
      move.instanceId,
      { parentInstanceId: repeat.instanceId, sectionId: repeat.sections[0]?.id || null, index: 0 }
    );
    const removed = removeWorkspaceBlockTree(moved, move.instanceId);

    expect(moved[0]?.sections[0]?.blocks.map((block) => block.instanceId)).toEqual([move.instanceId, say.instanceId]);
    expect(removed[0]?.sections[0]?.blocks.map((block) => block.instanceId)).toEqual([say.instanceId]);
  });

  it("duplicates stack fragments together with nested blocks", () => {
    const repeat = createWorkspaceBlock(blockCatalog.find((block) => block.id === "control-repeat")!);
    const say = createWorkspaceBlock(blockCatalog.find((block) => block.id === "looks-say")!);
    const wait = createWorkspaceBlock(blockCatalog.find((block) => block.id === "control-wait")!);

    const nested = insertWorkspaceBlockTree(
      insertWorkspaceBlockTree(
        [repeat, wait],
        { parentInstanceId: repeat.instanceId, sectionId: repeat.sections[0]?.id || null, index: 0 },
        say
      ),
      { parentInstanceId: null, sectionId: null, index: 2 },
      createWorkspaceBlock(blockCatalog.find((block) => block.id === "control-stop")!)
    );
    const duplicated = duplicateWorkspaceStack(nested, repeat.instanceId);

    expect(duplicated).toHaveLength(6);
    expect(countWorkspaceBlocks(duplicated)).toBe(countWorkspaceBlocks(nested) * 2);
    expect(duplicated[1]?.sections[0]?.blocks).toHaveLength(1);
  });

  it("stores separate branches for if-else blocks", () => {
    const ifElse = createWorkspaceBlock(blockCatalog.find((block) => block.id === "control-if-else")!);
    const say = createWorkspaceBlock(blockCatalog.find((block) => block.id === "looks-say")!);
    const think = createWorkspaceBlock(blockCatalog.find((block) => block.id === "looks-think")!);

    const withTrueBranch = insertWorkspaceBlockTree(
      [ifElse],
      { parentInstanceId: ifElse.instanceId, sectionId: ifElse.sections[0]?.id || null, index: 0 },
      say
    );
    const withBothBranches = insertWorkspaceBlockTree(
      withTrueBranch,
      { parentInstanceId: ifElse.instanceId, sectionId: ifElse.sections[1]?.id || null, index: 0 },
      think
    );

    expect(withBothBranches[0]?.sections[0]?.blocks[0]?.id).toBe("looks-say");
    expect(withBothBranches[0]?.sections[1]?.blocks[0]?.id).toBe("looks-think");
  });
});
