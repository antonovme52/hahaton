"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Copy,
  GripVertical,
  MessageSquarePlus,
  MoreHorizontal,
  Search,
  Trash2,
  ZoomIn,
  ZoomOut
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  blockCategoryMeta,
  blockCatalog,
  countWorkspaceBlocks,
  createWorkspaceBlock,
  duplicateWorkspaceStack,
  filterBlocksByName,
  groupBlocksByCategory,
  insertWorkspaceBlockTree,
  moveWorkspaceBlockTree,
  removeWorkspaceBlockTree,
  setWorkspaceBlockComment,
  type BlockCatalogEntry,
  type BlockParameter,
  type BlockType,
  type WorkspaceBlock,
  type WorkspaceDropTarget,
  updateWorkspaceBlockParameter
} from "@/lib/block-programming";
import { cn } from "@/lib/utils";

type SpriteWorkspaceOption = {
  id: string;
  name: string;
};

type DragPayload =
  | {
      source: "palette";
      blockId: string;
    }
  | {
      source: "workspace";
      instanceId: string;
    };

type ContextMenuState = {
  instanceId: string;
  x: number;
  y: number;
};

type BlockProgrammingStudioProps = {
  sprites: SpriteWorkspaceOption[];
  activeSpriteId: string | null;
  onActiveSpriteChange: (spriteId: string) => void;
  workspaces: Record<string, WorkspaceBlock[]>;
  onWorkspacesChange: (nextWorkspaces: Record<string, WorkspaceBlock[]>) => void;
  activeExecutionIdsBySprite?: Record<string, string[]>;
  disabled?: boolean;
};

function serializeDragPayload(payload: DragPayload) {
  return JSON.stringify(payload);
}

function parseDragPayload(value: string): DragPayload | null {
  try {
    const payload = JSON.parse(value) as DragPayload;

    if (
      payload &&
      ((payload.source === "palette" && typeof payload.blockId === "string") ||
        (payload.source === "workspace" && typeof payload.instanceId === "string"))
    ) {
      return payload;
    }
  } catch {
    return null;
  }

  return null;
}

function shapeClasses(type: BlockType) {
  switch (type) {
    case "hat":
      return "rounded-[28px] rounded-b-[18px] pt-5 pb-4";
    case "cap":
      return "rounded-[20px] rounded-b-[30px] pt-4 pb-6";
    case "reporter":
      return "rounded-full px-4 py-3";
    case "boolean":
      return "px-4 py-3";
    case "statement":
      return "rounded-[20px] pt-4 pb-5";
  }
}

function typeLabel(type: BlockType) {
  switch (type) {
    case "hat":
      return "старт";
    case "cap":
      return "стоп";
    case "reporter":
      return "значение";
    case "boolean":
      return "условие";
    case "statement":
      return "действие";
  }
}

function dropZoneKey(target: WorkspaceDropTarget) {
  return `${target.parentInstanceId || "root"}:${target.sectionId || "root"}:${target.index}`;
}

function stopEvent(event: React.SyntheticEvent) {
  event.stopPropagation();
}

function BlockParameterField({
  parameter,
  editable,
  light,
  onChange
}: {
  parameter: BlockParameter;
  editable: boolean;
  light: boolean;
  onChange?: (value: string) => void;
}) {
  const inputClassName = cn(
    "min-w-[86px] rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition",
    "border-black/10 bg-white/82 text-black placeholder:text-black/55"
  );

  if (!editable || !onChange) {
    return (
      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", inputClassName)}>
        {parameter.label}: {parameter.value}
      </span>
    );
  }

  if (parameter.kind === "select" && parameter.options?.length) {
    return (
      <label className="flex items-center gap-2 rounded-full bg-white/10 px-2 py-1">
        <span className="text-[11px] font-black uppercase tracking-[0.16em] opacity-80">{parameter.label}</span>
        <select
          value={parameter.value}
          onChange={(event) => onChange(event.target.value)}
          onPointerDownCapture={stopEvent}
          onClick={stopEvent}
          className={cn(inputClassName, "pr-8")}
        >
          {parameter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="flex items-center gap-2 rounded-full bg-white/10 px-2 py-1">
      <span className="text-[11px] font-black uppercase tracking-[0.16em] opacity-80">{parameter.label}</span>
      <input
        type={parameter.kind === "number" ? "number" : "text"}
        value={parameter.value}
        placeholder={parameter.placeholder}
        onChange={(event) => onChange(event.target.value)}
        onPointerDownCapture={stopEvent}
        onClick={stopEvent}
        className={inputClassName}
      />
    </label>
  );
}

function StackDropLane({
  active,
  target,
  onDropTarget,
  onActivate
}: {
  active: boolean;
  target: WorkspaceDropTarget;
  onDropTarget: (event: React.DragEvent<HTMLDivElement>, target: WorkspaceDropTarget) => void;
  onActivate: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const key = dropZoneKey(target);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        onActivate(key);
      }}
      onDragLeave={() => onActivate((current) => (current === key ? null : current))}
      onDrop={(event) => onDropTarget(event, target)}
      className={cn(
        "mx-2 h-4 rounded-full border-2 border-dashed transition",
        active ? "border-[#4c97ff] bg-[#dcebff]" : "border-transparent bg-transparent"
      )}
    />
  );
}

function ContextMenu({
  state,
  onClose,
  onDuplicate,
  onDelete,
  onComment
}: {
  state: ContextMenuState | null;
  onClose: () => void;
  onDuplicate: (instanceId: string) => void;
  onDelete: (instanceId: string) => void;
  onComment: (instanceId: string) => void;
}) {
  if (!state) {
    return null;
  }

  return (
    <>
      <button type="button" aria-label="Закрыть меню" className="fixed inset-0 z-40 cursor-default" onClick={onClose} />
      <div
        className="fixed z-50 min-w-[220px] rounded-[22px] border border-[#d8ebff] bg-white p-2 shadow-[0_18px_50px_rgba(27,78,136,0.2)]"
        style={{ left: state.x, top: state.y }}
      >
        <button
          type="button"
          onClick={() => {
            onDuplicate(state.instanceId);
            onClose();
          }}
          className="flex w-full items-center gap-3 rounded-[16px] px-3 py-2 text-left text-sm font-semibold text-[#26527c] transition hover:bg-[#f3f8ff]"
        >
          <Copy className="h-4 w-4" />
          Дублировать блок / стек
        </button>
        <button
          type="button"
          onClick={() => {
            onComment(state.instanceId);
            onClose();
          }}
          className="flex w-full items-center gap-3 rounded-[16px] px-3 py-2 text-left text-sm font-semibold text-[#26527c] transition hover:bg-[#f3f8ff]"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Добавить комментарий
        </button>
        <button
          type="button"
          onClick={() => {
            onDelete(state.instanceId);
            onClose();
          }}
          className="flex w-full items-center gap-3 rounded-[16px] px-3 py-2 text-left text-sm font-semibold text-[#cc4a40] transition hover:bg-[#fff1ef]"
        >
          <Trash2 className="h-4 w-4" />
          Удалить
        </button>
      </div>
    </>
  );
}

function WorkspaceBlockCard({
  block,
  executing,
  executingIds,
  activeDropZone,
  commentEditorId,
  onActivateDropZone,
  onDropTarget,
  onDragStart,
  onDragEnd,
  onOpenMenu,
  onRemove,
  onCommentChange,
  onParameterChange
}: {
  block: WorkspaceBlock;
  executing: boolean;
  executingIds: Set<string>;
  activeDropZone: string | null;
  commentEditorId: string | null;
  onActivateDropZone: React.Dispatch<React.SetStateAction<string | null>>;
  onDropTarget: (event: React.DragEvent<HTMLDivElement>, target: WorkspaceDropTarget) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, instanceId: string) => void;
  onDragEnd: () => void;
  onOpenMenu: (instanceId: string, anchor: DOMRect | null) => void;
  onRemove: (instanceId: string) => void;
  onCommentChange: (instanceId: string, comment: string) => void;
  onParameterChange: (instanceId: string, parameterId: string, value: string) => void;
}) {
  const category = blockCategoryMeta[block.category];
  const light = category.textClassName.includes("text-white");
  const hasConnector = block.type === "statement" || block.type === "hat" || block.type === "cap";

  return (
    <div className={cn("relative", hasConnector && block.type !== "cap" && "pb-3")}>
      {block.comment ? (
        <div className="mb-2 ml-5 rounded-[18px] border border-[#f6d073] bg-[#fff4bf] p-3 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a6512]">Комментарий</p>
          {commentEditorId === block.instanceId ? (
            <textarea
              value={block.comment}
              onChange={(event) => onCommentChange(block.instanceId, event.target.value)}
              onPointerDownCapture={stopEvent}
              className="mt-2 min-h-[84px] w-full rounded-[14px] border border-[#e7c66b] bg-white/80 px-3 py-2 text-sm text-[#61480d] outline-none"
            />
          ) : (
            <p className="mt-2 text-sm text-[#61480d]">{block.comment}</p>
          )}
        </div>
      ) : null}

      <div
        draggable
        onDragStart={(event) => onDragStart(event, block.instanceId)}
        onDragEnd={onDragEnd}
        onContextMenu={(event) => {
          event.preventDefault();
          onOpenMenu(block.instanceId, new DOMRect(event.clientX, event.clientY, 0, 0));
        }}
        className="group relative cursor-grab outline-none active:cursor-grabbing"
        title={block.description}
      >
        {hasConnector && block.type !== "hat" ? (
          <div className="pointer-events-none absolute left-6 top-0 z-10 h-3 w-16 -translate-y-px rounded-b-[10px] border-x border-b border-[#dce9ff] bg-[#eef5ff]" />
        ) : null}

        <div
          className={cn(
            "relative overflow-visible px-4 shadow-[0_14px_28px_rgba(24,46,84,0.14)] transition duration-200 group-hover:-translate-y-0.5",
            executing && "ring-4 ring-[#26d07c]/45 shadow-[0_0_0_6px_rgba(38,208,124,0.12),0_18px_34px_rgba(24,46,84,0.18)]",
            shapeClasses(block.type),
            category.textClassName,
            "text-black",
            block.type === "boolean" && "before:absolute before:inset-0 before:-z-10"
          )}
          style={{
            backgroundColor: block.color,
            clipPath:
              block.type === "boolean"
                ? "polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)"
                : undefined
          }}
        >
          {block.type === "hat" ? (
            <div className="pointer-events-none absolute inset-x-5 top-2 h-4 rounded-full bg-white/18 blur-md" />
          ) : null}

          <div className="relative flex items-start gap-3">
            <div className={cn("mt-0.5 rounded-full p-1.5", light ? "bg-white/14" : "bg-white/55")}>
              <GripVertical className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start gap-2">
                <p className="font-black leading-tight">{block.name}</p>
                <span
                  className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-black"
                >
                  {typeLabel(block.type)}
                </span>
                {executing ? (
                  <span className="rounded-full bg-[#26d07c] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#08351f]">
                    debug
                  </span>
                ) : null}
              </div>

              {block.parameters.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {block.parameters.map((parameter) => (
                    <BlockParameterField
                      key={parameter.id}
                      parameter={parameter}
                      editable
                      light={light}
                      onChange={(value) => onParameterChange(block.instanceId, parameter.id, value)}
                    />
                  ))}
                </div>
              ) : null}

              {block.sections.length ? (
                <div className="mt-4 space-y-3 rounded-[20px] border border-black/10 bg-white/16 p-3">
                  {block.sections.map((section) => (
                    <div key={section.id} className="rounded-[18px] border border-black/10 bg-black/5 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p
                          className="text-[11px] font-black uppercase tracking-[0.18em] text-black"
                        >
                          {section.label}
                        </p>
                        <Badge
                          variant="outline"
                          className="border-black/10 bg-white/75 text-black"
                        >
                          {section.blocks.length}
                        </Badge>
                      </div>
                      <WorkspaceStackList
                        blocks={section.blocks}
                        executingIds={executingIds}
                        parentInstanceId={block.instanceId}
                        sectionId={section.id}
                        activeDropZone={activeDropZone}
                        commentEditorId={commentEditorId}
                        emptyLabel={section.emptyLabel || "Перетащи блоки внутрь"}
                        onActivateDropZone={onActivateDropZone}
                        onDropTarget={onDropTarget}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onOpenMenu={onOpenMenu}
                        onRemove={onRemove}
                        onCommentChange={onCommentChange}
                        onParameterChange={onParameterChange}
                        nested
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenMenu(block.instanceId, event.currentTarget.getBoundingClientRect());
                }}
                onPointerDownCapture={stopEvent}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
                  light ? "bg-white/14 hover:bg-white/24" : "bg-white/65 hover:bg-white"
                )}
                aria-label="Открыть меню блока"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(block.instanceId);
                }}
                onPointerDownCapture={stopEvent}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
                  light ? "bg-white/14 hover:bg-white/24" : "bg-white/65 hover:bg-white"
                )}
                aria-label={`Удалить блок ${block.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {hasConnector && block.type !== "cap" ? (
          <div
            className="pointer-events-none absolute bottom-0 left-7 z-10 h-3 w-16 translate-y-[10px] rounded-[10px] border border-black/10"
            style={{ backgroundColor: block.color }}
          />
        ) : null}

        <div className="pointer-events-none absolute left-4 right-4 top-full z-20 mt-3 rounded-2xl bg-[#182e54] px-3 py-2 text-sm text-white opacity-0 shadow-xl transition duration-200 group-hover:opacity-100">
          {block.description}
        </div>
      </div>
    </div>
  );
}

function WorkspaceStackList({
  blocks,
  executingIds,
  parentInstanceId,
  sectionId,
  activeDropZone,
  commentEditorId,
  emptyLabel,
  nested,
  onActivateDropZone,
  onDropTarget,
  onDragStart,
  onDragEnd,
  onOpenMenu,
  onRemove,
  onCommentChange,
  onParameterChange
}: {
  blocks: WorkspaceBlock[];
  executingIds: Set<string>;
  parentInstanceId: string | null;
  sectionId: string | null;
  activeDropZone: string | null;
  commentEditorId: string | null;
  emptyLabel: string;
  nested?: boolean;
  onActivateDropZone: React.Dispatch<React.SetStateAction<string | null>>;
  onDropTarget: (event: React.DragEvent<HTMLDivElement>, target: WorkspaceDropTarget) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, instanceId: string) => void;
  onDragEnd: () => void;
  onOpenMenu: (instanceId: string, anchor: DOMRect | null) => void;
  onRemove: (instanceId: string) => void;
  onCommentChange: (instanceId: string, comment: string) => void;
  onParameterChange: (instanceId: string, parameterId: string, value: string) => void;
}) {
  return (
    <div
      className={cn(
        "space-y-1 rounded-[22px]",
        nested ? "border border-dashed border-white/25 bg-black/5 p-3" : "p-1"
      )}
    >
      {!blocks.length ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            onActivateDropZone(dropZoneKey({ parentInstanceId, sectionId, index: 0 }));
          }}
          onDragLeave={() =>
            onActivateDropZone((current) =>
              current === dropZoneKey({ parentInstanceId, sectionId, index: 0 }) ? null : current
            )
          }
          onDrop={(event) => onDropTarget(event, { parentInstanceId, sectionId, index: 0 })}
          className={cn(
            "flex min-h-[72px] items-center justify-center rounded-[18px] border-2 border-dashed px-4 text-center text-sm transition",
            activeDropZone === dropZoneKey({ parentInstanceId, sectionId, index: 0 })
              ? "border-[#4c97ff] bg-[#eaf3ff] text-[#2f64a4]"
              : nested
                ? "border-white/22 bg-white/8 text-white/80"
                : "border-[#d0e3ff] bg-[#f6faff] text-[#5e7a98]"
          )}
        >
          {emptyLabel}
        </div>
      ) : (
        <>
          {blocks.map((block, index) => (
            <Fragment key={block.instanceId}>
              <StackDropLane
                active={activeDropZone === dropZoneKey({ parentInstanceId, sectionId, index })}
                target={{ parentInstanceId, sectionId, index }}
                onDropTarget={onDropTarget}
                onActivate={onActivateDropZone}
              />
              <WorkspaceBlockCard
                block={block}
                executing={executingIds.has(block.instanceId)}
                executingIds={executingIds}
                activeDropZone={activeDropZone}
                commentEditorId={commentEditorId}
                onActivateDropZone={onActivateDropZone}
                onDropTarget={onDropTarget}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onOpenMenu={onOpenMenu}
                onRemove={onRemove}
                onCommentChange={onCommentChange}
                onParameterChange={onParameterChange}
              />
            </Fragment>
          ))}
          <StackDropLane
            active={activeDropZone === dropZoneKey({ parentInstanceId, sectionId, index: blocks.length })}
            target={{ parentInstanceId, sectionId, index: blocks.length }}
            onDropTarget={onDropTarget}
            onActivate={onActivateDropZone}
          />
        </>
      )}
    </div>
  );
}

function PaletteBlockCard({
  block,
  onDragEnd
}: {
  block: BlockCatalogEntry;
  onDragEnd: () => void;
}) {
  const category = blockCategoryMeta[block.category];
  const light = category.textClassName.includes("text-white");
  const isConnectorBlock = block.type === "statement" || block.type === "hat" || block.type === "cap";

  return (
    <div className={cn("relative", isConnectorBlock && block.type !== "cap" && "pb-3")}>
      <div
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "copy";
          event.dataTransfer.setData("application/code-quest-block", serializeDragPayload({ source: "palette", blockId: block.id }));
        }}
        onDragEnd={onDragEnd}
        className="group relative cursor-grab outline-none active:cursor-grabbing"
        title={block.description}
      >
        {isConnectorBlock && block.type !== "hat" ? (
          <div className="pointer-events-none absolute left-6 top-0 z-10 h-3 w-16 -translate-y-px rounded-b-[10px] border-x border-b border-[#dce9ff] bg-[#eef5ff]" />
        ) : null}

        <div
          className={cn(
            "relative overflow-visible px-4 shadow-[0_14px_28px_rgba(24,46,84,0.14)] transition duration-200 group-hover:-translate-y-0.5",
            shapeClasses(block.type),
            category.textClassName,
            "text-black",
            block.type === "boolean" && "before:absolute before:inset-0 before:-z-10"
          )}
          style={{
            backgroundColor: block.color,
            clipPath:
              block.type === "boolean"
                ? "polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)"
                : undefined
          }}
        >
          <div className="flex items-start gap-3">
            <div className={cn("mt-0.5 rounded-full p-1.5", light ? "bg-white/14" : "bg-white/55")}>
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black leading-tight">{block.name}</p>
                <span
                  className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-black"
                >
                  {typeLabel(block.type)}
                </span>
              </div>
              {block.parameters.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {block.parameters.map((parameter) => (
                    <BlockParameterField key={parameter.id} parameter={parameter} editable={false} light={light} />
                  ))}
                </div>
              ) : null}
              {(block.sections?.length || 0) > 0 ? (
                <div className="mt-4 rounded-[18px] border border-black/10 bg-white/16 px-3 py-2 text-xs font-semibold">
                  Внутри можно собирать {(block.sections?.length || 0) > 1 ? "несколько вложенных веток" : "вложенный стек"}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {isConnectorBlock && block.type !== "cap" ? (
          <div
            className="pointer-events-none absolute bottom-0 left-7 z-10 h-3 w-16 translate-y-[10px] rounded-[10px] border border-black/10"
            style={{ backgroundColor: block.color }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function BlockProgrammingStudio({
  sprites,
  activeSpriteId,
  onActiveSpriteChange,
  workspaces,
  onWorkspacesChange,
  activeExecutionIdsBySprite = {},
  disabled = false
}: BlockProgrammingStudioProps) {
  const [query, setQuery] = useState("");
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [commentEditorId, setCommentEditorId] = useState<string | null>(null);

  const filteredBlocks = useMemo(() => filterBlocksByName(blockCatalog, query), [query]);
  const groupedBlocks = useMemo(() => groupBlocksByCategory(filteredBlocks), [filteredBlocks]);
  const blockMap = useMemo(() => new Map(blockCatalog.map((block) => [block.id, block])), []);
  const activeSprite = useMemo(
    () => sprites.find((sprite) => sprite.id === activeSpriteId) || null,
    [activeSpriteId, sprites]
  );
  const workspaceBlocks = activeSpriteId ? workspaces[activeSpriteId] || [] : [];
  const executingIds = useMemo(
    () => new Set((activeSpriteId ? activeExecutionIdsBySprite[activeSpriteId] : []) || []),
    [activeExecutionIdsBySprite, activeSpriteId]
  );
  const totalBlockCount = countWorkspaceBlocks(workspaceBlocks);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setContextMenu(null);
        setCommentEditorId(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function updateActiveWorkspace(updater: (blocks: WorkspaceBlock[]) => WorkspaceBlock[]) {
    if (!activeSpriteId) {
      return;
    }

    onWorkspacesChange({
      ...workspaces,
      [activeSpriteId]: updater(workspaceBlocks)
    });
  }

  function openContextMenu(instanceId: string, anchor: DOMRect | null) {
    if (anchor) {
      setContextMenu({
        instanceId,
        x: anchor.left,
        y: anchor.bottom + 8
      });
      return;
    }

    setContextMenu({
      instanceId,
      x: Math.max(24, window.innerWidth / 2 - 110),
      y: Math.max(24, window.innerHeight / 2 - 80)
    });
  }

  function handleDropTarget(event: React.DragEvent<HTMLDivElement>, target: WorkspaceDropTarget) {
    event.preventDefault();
    setActiveDropZone(null);

    const payload = parseDragPayload(event.dataTransfer.getData("application/code-quest-block"));

    if (!payload || !activeSpriteId) {
      return;
    }

    if (payload.source === "palette") {
      const block = blockMap.get(payload.blockId);

      if (!block) {
        return;
      }

      updateActiveWorkspace((current) => {
        const inserted = createWorkspaceBlock(block);
        return insertWorkspaceBlockTree(current, target, inserted);
      });
      return;
    }

    updateActiveWorkspace((current) => moveWorkspaceBlockTree(current, payload.instanceId, target));
  }

  function handleDeleteFromDropZone(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setActiveDropZone(null);

    const payload = parseDragPayload(event.dataTransfer.getData("application/code-quest-block"));

    if (!payload || payload.source !== "workspace") {
      return;
    }

    updateActiveWorkspace((current) => removeWorkspaceBlockTree(current, payload.instanceId));
  }

  function ensureComment(instanceId: string) {
    updateActiveWorkspace((current) => setWorkspaceBlockComment(current, instanceId, "Новый комментарий"));
    setCommentEditorId(instanceId);
  }

  return (
    <>
      <div className="relative">
        <Card className={cn("overflow-hidden border-[#d3e6ff] bg-white shadow-[0_24px_60px_rgba(46,115,255,0.12)]", disabled && "opacity-80")}>
        <div className="border-b border-[#d9ebff] bg-gradient-to-r from-[#eef7ff] via-white to-[#fff1dd] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-3">
                <Badge variant="reward">Blocks Studio</Badge>
                <Badge variant="outline">{Object.keys(blockCategoryMeta).length} categories</Badge>
                <Badge variant="info">{blockCatalog.length} blocks</Badge>
                <Badge variant="outline">{sprites.length} sprites</Badge>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-[#6f9ac5]">Step 1</p>
                <h2 className="mt-2 text-3xl font-black text-[#244a73]">Рабочая область блоков</h2>
                <p className="mt-1 max-w-3xl text-[#5e7a98]">
                  Перетаскивай блоки из палитры, собирай вертикальный стек, вкладывай команды в `если` и `повторить`, редактируй параметры прямо внутри блока.
                </p>
              </div>
            </div>

            <div className="w-full max-w-md">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f9ac5]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Найти блок по имени"
                  className="border-[#d7ebff] bg-white pl-11 text-[#244a73]"
                />
              </div>
            </div>
          </div>
        </div>

        <CardContent className="grid gap-5 p-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setActiveDropZone("palette-delete");
            }}
            onDragLeave={() => setActiveDropZone((current) => (current === "palette-delete" ? null : current))}
            onDrop={handleDeleteFromDropZone}
            className={cn("space-y-4 rounded-[28px] p-2 transition", activeDropZone === "palette-delete" && "bg-[#fff4ea]")}
          >
            <div
              className={cn(
                "rounded-[24px] border border-dashed px-4 py-3 text-sm transition",
                activeDropZone === "palette-delete"
                  ? "border-[#ff9c68] bg-[#fff4ea] text-[#a45120]"
                  : "border-[#dbe8ff] bg-[#f8fbff] text-[#5e7a98]"
              )}
            >
              Верни блок обратно в палитру, чтобы удалить его из рабочего скрипта.
            </div>

            {groupedBlocks.map(({ category, meta, blocks }) => (
              <div key={category} className={cn("rounded-[26px] border p-4", meta.panelClassName)}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-[#6f9ac5]">Category</p>
                    <h3 className="text-xl font-black text-[#26527c]">{meta.label}</h3>
                  </div>
                  <div className="rounded-full bg-white/80 px-3 py-1 text-sm font-black text-[#26527c] shadow-sm">
                    {blocks.length}
                  </div>
                </div>

                {blocks.length ? (
                  <div className="space-y-4">
                    {blocks.map((block) => (
                      <PaletteBlockCard key={block.id} block={block} onDragEnd={() => setActiveDropZone(null)} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[20px] border border-dashed border-white/70 bg-white/70 px-4 py-5 text-sm text-[#5e7a98]">
                    По запросу ничего не найдено в категории {meta.label.toLocaleLowerCase("ru-RU")}.
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-5">
            <div className="overflow-hidden rounded-[30px] border border-[#d8ebff] bg-[#f9fcff]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8ebff] bg-white px-5 py-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-[#6f9ac5]">Workspace</p>
                  <h3 className="text-2xl font-black text-[#26527c]">
                    {activeSprite ? `Скрипты спрайта: ${activeSprite.name}` : "Скрипты"}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{workspaceBlocks.length} top-level</Badge>
                  <Badge variant="info">{totalBlockCount} blocks total</Badge>
                  <div className="flex items-center gap-1 rounded-full border border-[#d8ebff] bg-white p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setZoom((current) => Math.max(0.7, Number((current - 0.1).toFixed(2))))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[56px] text-center text-sm font-black text-[#26527c]">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setZoom((current) => Math.min(1.6, Number((current + 0.1).toFixed(2))))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="border-[#d8ebff] bg-white" onClick={() => setZoom(1)}>
                    1:1
                  </Button>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {sprites.map((sprite) => (
                    <button
                      key={sprite.id}
                      type="button"
                      onClick={() => onActiveSpriteChange(sprite.id)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        sprite.id === activeSpriteId
                          ? "border-[#ff9c68] bg-[#fff4ea] text-[#a45120]"
                          : "border-[#d8ebff] bg-white text-[#4f7398] hover:-translate-y-0.5"
                      )}
                    >
                      {sprite.name}
                    </button>
                  ))}
                </div>

                <div className="rounded-[24px] border border-dashed border-[#cddfff] bg-white px-4 py-4 text-sm text-[#5e7a98]">
                  У каждого спрайта своя рабочая область. Блок можно вытащить из середины стека, удалить через корзину или вернуть в палитру.
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                  <div className="rounded-[28px] border border-[#d8ebff] bg-[linear-gradient(180deg,#ffffff_0%,#f3f8ff_100%)] p-4">
                    {activeSprite ? (
                      <div
                        onWheel={(event) => {
                          if (!event.ctrlKey) {
                            return;
                          }

                          event.preventDefault();
                          setZoom((current) => {
                            const next = event.deltaY > 0 ? current - 0.1 : current + 0.1;
                            return Math.min(1.6, Math.max(0.7, Number(next.toFixed(2))));
                          });
                        }}
                        className="max-h-[780px] overflow-auto rounded-[22px] border border-[#d8ebff] bg-[#f7fbff] p-4"
                      >
                        <div style={{ zoom }} className="min-h-[320px] min-w-[640px]">
                          <WorkspaceStackList
                            blocks={workspaceBlocks}
                            executingIds={executingIds}
                            parentInstanceId={null}
                            sectionId={null}
                            activeDropZone={activeDropZone}
                            commentEditorId={commentEditorId}
                            emptyLabel="Брось блок сюда, чтобы начать новый скрипт"
                            onActivateDropZone={setActiveDropZone}
                            onDropTarget={handleDropTarget}
                            onDragStart={(event, instanceId) => {
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData(
                                "application/code-quest-block",
                                serializeDragPayload({ source: "workspace", instanceId })
                              );
                            }}
                            onDragEnd={() => setActiveDropZone(null)}
                            onOpenMenu={openContextMenu}
                            onRemove={(instanceId) => updateActiveWorkspace((current) => removeWorkspaceBlockTree(current, instanceId))}
                            onCommentChange={(instanceId, comment) =>
                              updateActiveWorkspace((current) => setWorkspaceBlockComment(current, instanceId, comment))
                            }
                            onParameterChange={(instanceId, parameterId, value) =>
                              updateActiveWorkspace((current) =>
                                updateWorkspaceBlockParameter(current, instanceId, parameterId, value)
                              )
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[320px] items-center justify-center rounded-[26px] border-2 border-dashed border-[#d0e3ff] bg-[#f6faff] px-6 py-10 text-center text-[#5e7a98]">
                        Выбери спрайт, чтобы открыть его рабочую область.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div
                      onDragOver={(event) => {
                        event.preventDefault();
                        setActiveDropZone("trash");
                      }}
                      onDragLeave={() => setActiveDropZone((current) => (current === "trash" ? null : current))}
                      onDrop={handleDeleteFromDropZone}
                      className={cn(
                        "flex min-h-[180px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed p-5 text-center transition",
                        activeDropZone === "trash"
                          ? "border-[#ff8451] bg-[#fff2eb] text-[#b04f26]"
                          : "border-[#ffd6c5] bg-[#fff9f6] text-[#91614d]"
                      )}
                    >
                      <div className="rounded-full bg-white p-4 shadow-sm">
                        <Trash2 className="h-7 w-7" />
                      </div>
                      <h4 className="mt-4 text-lg font-black">Корзина</h4>
                      <p className="mt-2 text-sm">Перетащи сюда блок, чтобы удалить его из рабочего сценария.</p>
                    </div>

                    <div className="rounded-[24px] border border-[#d9ebff] bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#6f9ac5]">Контекст</p>
                      <p className="mt-2 text-sm text-[#5e7a98]">
                        Правый клик по блоку или кнопка `…` открывают меню с дублированием, удалением и комментариями.
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-[#d9ebff] bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#6f9ac5]">Вложенность</p>
                      <p className="mt-2 text-sm text-[#5e7a98]">
                        У блоков `если` и `повторить` есть собственные слоты, куда можно собирать отдельные внутренние стеки.
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-[#d9ebff] bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#6f9ac5]">Масштаб</p>
                      <p className="mt-2 text-sm text-[#5e7a98]">
                        Рабочая область прокручивается, а масштаб меняется кнопками или `Ctrl + колесо мыши`.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
        {disabled ? (
          <div className="absolute inset-0 z-30 rounded-[32px] border border-dashed border-[#ffd4ad] bg-white/62 backdrop-blur-[1px]">
            <div className="absolute right-5 top-5 rounded-full bg-[#fff3e7] px-4 py-2 text-sm font-semibold text-[#9a5a24] shadow-sm">
              Редактирование заблокировано во время выполнения
            </div>
          </div>
        ) : null}
      </div>

      <ContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(null)}
        onDuplicate={(instanceId) => updateActiveWorkspace((current) => duplicateWorkspaceStack(current, instanceId))}
        onDelete={(instanceId) => updateActiveWorkspace((current) => removeWorkspaceBlockTree(current, instanceId))}
        onComment={ensureComment}
      />
    </>
  );
}
