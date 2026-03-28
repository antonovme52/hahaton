import { cloneWorkspaceBlock, type WorkspaceBlock } from "@/lib/block-programming";

export type VmScalar = string | number | boolean;

export type VmCostume = {
  id: string;
  name: string;
  assetUrl: string;
  width: number;
  height: number;
  source: "builtin" | "upload";
};

export type VmBubble = {
  type: "say" | "think";
  expiresAt: number | null;
  message: string;
};

export type VmSpriteState = {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  visible: boolean;
  currentCostumeId: string;
  costumes: VmCostume[];
  volume: number;
  rotationStyle: string;
  bubble: VmBubble | null;
};

export type VmInputState = {
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  pressedKeys: string[];
};

export type VmLogEntry = {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timeMs: number;
};

export type VmProjectSnapshot = {
  sprites: VmSpriteState[];
  workspaces: Record<string, WorkspaceBlock[]>;
};

export type VmPromptState = {
  spriteId: string;
  threadId: string;
  question: string;
};

type VmScriptTrigger =
  | { type: "flag" }
  | { type: "key"; key: string }
  | { type: "sprite-click" }
  | { type: "broadcast"; message: string };

type VmScript = {
  id: string;
  spriteId: string;
  hatInstanceId: string;
  trigger: VmScriptTrigger;
  body: WorkspaceBlock[];
};

type VmExecutionItem =
  | { kind: "block"; block: WorkspaceBlock }
  | { kind: "repeat"; block: WorkspaceBlock; remaining: number }
  | { kind: "forever"; block: WorkspaceBlock }
  | { kind: "repeatUntil"; block: WorkspaceBlock; condition: string };

type VmThread = {
  id: string;
  spriteId: string;
  scriptId: string;
  stack: VmExecutionItem[];
  sleepUntil: number | null;
  waitingCondition: string | null;
  waitingForAnswer: boolean;
  currentBlockId: string | null;
  done: boolean;
};

export type ScratchVmState = {
  status: "stopped" | "running" | "paused";
  sprites: VmSpriteState[];
  threads: VmThread[];
  logs: VmLogEntry[];
  variables: Record<string, VmScalar>;
  visibleVariables: string[];
  answer: string;
  prompt: VmPromptState | null;
  input: VmInputState;
  timeMs: number;
  timerStartedAt: number;
  activeBlockIdsBySprite: Record<string, string[]>;
  lastResetSnapshot: VmProjectSnapshot | null;
  nextThreadId: number;
  schedulerCursor: number;
  frameWarning: string | null;
};

const DEFAULT_VARIABLES: Record<string, VmScalar> = {
  "счёт": 0,
  "жизни": 3,
  "уровень": 1
};

const MAX_LOGS = 200;
const MAX_STEPS_PER_FRAME = 240;

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function cloneSprite(sprite: VmSpriteState): VmSpriteState {
  return {
    ...sprite,
    costumes: sprite.costumes.map((costume) => ({ ...costume })),
    bubble: sprite.bubble ? { ...sprite.bubble } : null
  };
}

function sanitizeSprite(sprite: VmSpriteState): VmSpriteState {
  return {
    ...cloneSprite(sprite),
    volume: Number.isFinite(sprite.volume) ? clamp(sprite.volume, 0, 100) : 100,
    rotationStyle: sprite.rotationStyle || "все направления",
    bubble: sprite.bubble ? { ...sprite.bubble } : null
  };
}

function cloneWorkspaces(workspaces: Record<string, WorkspaceBlock[]>) {
  return Object.fromEntries(
    Object.entries(workspaces).map(([spriteId, blocks]) => [spriteId, blocks.map((block) => cloneWorkspaceBlock(block))])
  );
}

function cloneSnapshot(snapshot: VmProjectSnapshot): VmProjectSnapshot {
  return {
    sprites: snapshot.sprites.map((sprite) => cloneSprite(sprite)),
    workspaces: cloneWorkspaces(snapshot.workspaces)
  };
}

function getSprite(state: ScratchVmState, spriteId: string) {
  return state.sprites.find((sprite) => sprite.id === spriteId) || null;
}

function updateSprite(state: ScratchVmState, spriteId: string, updater: (sprite: VmSpriteState) => VmSpriteState) {
  return {
    ...state,
    sprites: state.sprites.map((sprite) => (sprite.id === spriteId ? sanitizeSprite(updater(sprite)) : sprite))
  };
}

function replaceThread(state: ScratchVmState, index: number, thread: VmThread) {
  const nextThreads = [...state.threads];
  nextThreads[index] = thread;
  return { ...state, threads: nextThreads };
}

function appendLog(state: ScratchVmState, level: VmLogEntry["level"], message: string) {
  const logs = [...state.logs, { id: uid("log"), level, message, timeMs: state.timeMs }].slice(-MAX_LOGS);
  return { ...state, logs };
}

function getBlockParameter(block: WorkspaceBlock, parameterId: string) {
  return block.parameters.find((parameter) => parameter.id === parameterId)?.value ?? "";
}

function getBlockSection(block: WorkspaceBlock, sectionId: string) {
  return block.sections.find((section) => section.id === sectionId)?.blocks || [];
}

function parseNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeKey(value: string) {
  return value.trim().toLocaleLowerCase("ru-RU");
}

function normalizeCondition(value: string) {
  return value.trim().toLocaleLowerCase("ru-RU");
}

function asStack(blocks: WorkspaceBlock[]): VmExecutionItem[] {
  return [...blocks].reverse().map((block) => ({ kind: "block", block }));
}

function currentCostume(sprite: VmSpriteState) {
  return sprite.costumes.find((costume) => costume.id === sprite.currentCostumeId) || sprite.costumes[0] || null;
}

function spriteHalfSize(sprite: VmSpriteState) {
  const costume = currentCostume(sprite);
  return {
    halfWidth: ((costume?.width || 120) * sprite.scale) / 2,
    halfHeight: ((costume?.height || 120) * sprite.scale) / 2
  };
}

function touchEdge(sprite: VmSpriteState) {
  const { halfWidth, halfHeight } = spriteHalfSize(sprite);
  return (
    sprite.x - halfWidth <= -240 ||
    sprite.x + halfWidth >= 240 ||
    sprite.y - halfHeight <= -180 ||
    sprite.y + halfHeight >= 180
  );
}

function touchingMouse(sprite: VmSpriteState, input: VmInputState) {
  const { halfWidth, halfHeight } = spriteHalfSize(sprite);
  return (
    input.mouseX >= sprite.x - halfWidth &&
    input.mouseX <= sprite.x + halfWidth &&
    input.mouseY >= sprite.y - halfHeight &&
    input.mouseY <= sprite.y + halfHeight
  );
}

function touchingSprite(sprite: VmSpriteState, other: VmSpriteState) {
  const spriteSize = spriteHalfSize(sprite);
  const otherSize = spriteHalfSize(other);
  const left = sprite.x - spriteSize.halfWidth;
  const right = sprite.x + spriteSize.halfWidth;
  const top = sprite.y + spriteSize.halfHeight;
  const bottom = sprite.y - spriteSize.halfHeight;
  const otherLeft = other.x - otherSize.halfWidth;
  const otherRight = other.x + otherSize.halfWidth;
  const otherTop = other.y + otherSize.halfHeight;
  const otherBottom = other.y - otherSize.halfHeight;

  return !(right < otherLeft || left > otherRight || top < otherBottom || bottom > otherTop);
}

function toBoolean(value: VmScalar) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalized = normalizeCondition(String(value));
  if (normalized === "истина" || normalized === "true") {
    return true;
  }

  if (normalized === "ложь" || normalized === "false" || normalized === "") {
    return false;
  }

  return true;
}

function evaluateReporter(block: WorkspaceBlock, spriteId: string, state: ScratchVmState): VmScalar {
  const sprite = getSprite(state, spriteId);

  switch (block.id) {
    case "motion-x-position":
      return sprite?.x ?? 0;
    case "motion-y-position":
      return sprite?.y ?? 0;
    case "looks-costume-number":
      return sprite ? Math.max(1, sprite.costumes.findIndex((costume) => costume.id === sprite.currentCostumeId) + 1) : 1;
    case "sound-volume":
      return sprite?.volume ?? 100;
    case "sensing-mouse-x":
      return state.input.mouseX;
    case "sensing-mouse-y":
      return state.input.mouseY;
    case "sensing-answer":
      return state.answer;
    case "sensing-timer":
      return Number(((state.timeMs - state.timerStartedAt) / 1000).toFixed(2));
    case "variable-value": {
      const variableName = getBlockParameter(block, "variable");
      return state.variables[variableName] ?? 0;
    }
    case "operator-add":
      return parseNumber(getBlockParameter(block, "left")) + parseNumber(getBlockParameter(block, "right"));
    case "operator-subtract":
      return parseNumber(getBlockParameter(block, "left")) - parseNumber(getBlockParameter(block, "right"));
    case "operator-multiply":
      return parseNumber(getBlockParameter(block, "left")) * parseNumber(getBlockParameter(block, "right"));
    case "operator-divide":
      return parseNumber(getBlockParameter(block, "left")) / parseNumber(getBlockParameter(block, "right"));
    case "operator-random": {
      const from = parseNumber(getBlockParameter(block, "from"));
      const to = parseNumber(getBlockParameter(block, "to"));
      const min = Math.min(from, to);
      const max = Math.max(from, to);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    case "operator-join":
      return `${getBlockParameter(block, "left")}${getBlockParameter(block, "right")}`;
    case "operator-letter": {
      const index = clamp(parseNumber(getBlockParameter(block, "index"), 1), 1, Number.MAX_SAFE_INTEGER);
      return getBlockParameter(block, "text").charAt(index - 1);
    }
    case "operator-length":
      return getBlockParameter(block, "text").length;
    case "operator-mod":
      return parseNumber(getBlockParameter(block, "left")) % parseNumber(getBlockParameter(block, "right"));
    case "operator-round":
      return Math.round(parseNumber(getBlockParameter(block, "value")));
    default:
      return "";
  }
}

function evaluateBoolean(block: WorkspaceBlock, spriteId: string, state: ScratchVmState): boolean {
  const sprite = getSprite(state, spriteId);

  switch (block.id) {
    case "sensing-touching-mouse":
      return sprite ? touchingMouse(sprite, state.input) : false;
    case "sensing-touching-edge":
      return sprite ? touchEdge(sprite) : false;
    case "sensing-touching-sprite": {
      const targetName = getBlockParameter(block, "target");
      if (targetName === "указатель мыши") {
        return sprite ? touchingMouse(sprite, state.input) : false;
      }
      const targetSprite = state.sprites.find((item) => item.name === targetName && item.id !== spriteId) || null;
      return sprite && targetSprite ? touchingSprite(sprite, targetSprite) : false;
    }
    case "sensing-mouse-down":
      return state.input.mouseDown;
    case "sensing-key-pressed":
      return state.input.pressedKeys.includes(normalizeKey(getBlockParameter(block, "key")));
    case "operator-greater":
      return parseNumber(getBlockParameter(block, "left")) > parseNumber(getBlockParameter(block, "right"));
    case "operator-less":
      return parseNumber(getBlockParameter(block, "left")) < parseNumber(getBlockParameter(block, "right"));
    case "operator-equals":
      return getBlockParameter(block, "left") === getBlockParameter(block, "right");
    case "operator-and":
      return toBoolean(getBlockParameter(block, "left")) && toBoolean(getBlockParameter(block, "right"));
    case "operator-or":
      return toBoolean(getBlockParameter(block, "left")) || toBoolean(getBlockParameter(block, "right"));
    case "operator-not":
      return !toBoolean(getBlockParameter(block, "value"));
    default:
      return false;
  }
}

function evaluateCondition(condition: string, spriteId: string, state: ScratchVmState) {
  switch (normalizeCondition(condition)) {
    case "касается края?":
      return Boolean(getSprite(state, spriteId) && touchEdge(getSprite(state, spriteId)!));
    case "мышь нажата?":
      return state.input.mouseDown;
    case "клавиша пробел нажата?":
      return state.input.pressedKeys.includes("пробел");
    case "таймер > 10":
      return (state.timeMs - state.timerStartedAt) / 1000 > 10;
    case "истина":
    case "true":
      return true;
    case "ложь":
    case "false":
      return false;
    default:
      return false;
  }
}

function getScriptTrigger(block: WorkspaceBlock): VmScriptTrigger | null {
  switch (block.id) {
    case "event-flag":
      return { type: "flag" };
    case "event-key":
      return { type: "key", key: normalizeKey(getBlockParameter(block, "key")) };
    case "event-sprite-clicked":
      return { type: "sprite-click" };
    case "event-when-received":
      return { type: "broadcast", message: getBlockParameter(block, "message") };
    default:
      return null;
  }
}

function collectScripts(workspaces: Record<string, WorkspaceBlock[]>): VmScript[] {
  const scripts: VmScript[] = [];

  for (const [spriteId, blocks] of Object.entries(workspaces)) {
    let currentHat: WorkspaceBlock | null = null;
    let currentBody: WorkspaceBlock[] = [];

    const flush = () => {
      if (!currentHat) {
        return;
      }

      const trigger = getScriptTrigger(currentHat);

      if (trigger) {
        scripts.push({
          id: `${spriteId}:${currentHat.instanceId}`,
          spriteId,
          hatInstanceId: currentHat.instanceId,
          trigger,
          body: currentBody.map((block) => cloneWorkspaceBlock(block))
        });
      }

      currentHat = null;
      currentBody = [];
    };

    for (const block of blocks) {
      if (block.type === "hat") {
        flush();
        currentHat = block;
        continue;
      }

      if (currentHat) {
        currentBody.push(block);
      }
    }

    flush();
  }

  return scripts;
}

function threadFromScript(state: ScratchVmState, script: VmScript): VmThread {
  return {
    id: `thread-${state.nextThreadId}`,
    spriteId: script.spriteId,
    scriptId: script.id,
    stack: asStack(script.body),
    sleepUntil: null,
    waitingCondition: null,
    waitingForAnswer: false,
    currentBlockId: script.hatInstanceId,
    done: script.body.length === 0
  };
}

function spawnScripts(state: ScratchVmState, predicate: (script: VmScript) => boolean) {
  const snapshot = state.lastResetSnapshot;

  if (!snapshot) {
    return state;
  }

  const scripts = collectScripts(snapshot.workspaces).filter(predicate);

  if (!scripts.length) {
    return state;
  }

  const threads = scripts.map((script, index) => ({
    ...threadFromScript(state, script),
    id: `thread-${state.nextThreadId + index}`
  }));

  return {
    ...state,
    threads: [...state.threads, ...threads],
    nextThreadId: state.nextThreadId + threads.length
  };
}

function refreshActiveBlocks(state: ScratchVmState) {
  const activeBlockIdsBySprite = state.threads.reduce<Record<string, string[]>>((result, thread) => {
    if (!thread.done && thread.currentBlockId) {
      result[thread.spriteId] = [...(result[thread.spriteId] || []), thread.currentBlockId];
    }
    return result;
  }, {});

  return { ...state, activeBlockIdsBySprite };
}

function clearExpiredBubbles(state: ScratchVmState) {
  let changed = false;
  const sprites = state.sprites.map((sprite) => {
    if (!sprite.bubble?.expiresAt || sprite.bubble.expiresAt > state.timeMs) {
      return sprite;
    }

    changed = true;
    return { ...sprite, bubble: null };
  });

  return changed ? { ...state, sprites } : state;
}

function markThreadDone(thread: VmThread): VmThread {
  return {
    ...thread,
    stack: [],
    sleepUntil: null,
    waitingCondition: null,
    waitingForAnswer: false,
    done: true
  };
}

function syncThreadState(thread: VmThread, state: ScratchVmState): VmThread {
  return {
    ...thread,
    sleepUntil: thread.sleepUntil !== null && thread.sleepUntil <= state.timeMs ? null : thread.sleepUntil,
    waitingCondition:
      thread.waitingCondition && evaluateCondition(thread.waitingCondition, thread.spriteId, state)
        ? null
        : thread.waitingCondition
  };
}

function threadHasPendingBlockers(thread: VmThread) {
  return thread.sleepUntil !== null || thread.waitingCondition !== null || thread.waitingForAnswer;
}

function removeFinishedThreads(state: ScratchVmState) {
  const threads = state.threads
    .map((thread) => syncThreadState(thread, state))
    .filter((thread) => !thread.done && (thread.stack.length > 0 || threadHasPendingBlockers(thread)));
  return {
    ...state,
    threads,
    schedulerCursor: threads.length ? state.schedulerCursor % threads.length : 0
  };
}

function isThreadReady(thread: VmThread, state: ScratchVmState) {
  if (thread.done || thread.stack.length === 0) {
    return false;
  }

  if (thread.sleepUntil !== null && thread.sleepUntil > state.timeMs) {
    return false;
  }

  if (thread.waitingCondition && !evaluateCondition(thread.waitingCondition, thread.spriteId, state)) {
    return false;
  }

  if (thread.waitingForAnswer) {
    return false;
  }

  return true;
}

function findNextReadyThreadIndex(state: ScratchVmState) {
  if (!state.threads.length) {
    return -1;
  }

  for (let offset = 0; offset < state.threads.length; offset += 1) {
    const index = (state.schedulerCursor + offset) % state.threads.length;
    if (isThreadReady(state.threads[index], state)) {
      return index;
    }
  }

  return -1;
}

function withUpdatedVariable(state: ScratchVmState, name: string, value: VmScalar, message: string) {
  return appendLog(
    {
      ...state,
      variables: {
        ...state.variables,
        [name]: value
      }
    },
    "debug",
    message
  );
}

function executeBlock(state: ScratchVmState, threadIndex: number, block: WorkspaceBlock): ScratchVmState {
  const thread = state.threads[threadIndex];
  const sprite = getSprite(state, thread.spriteId);
  let nextState = state;

  switch (block.id) {
    case "motion-move": {
      const steps = parseNumber(getBlockParameter(block, "steps"), 10);
      const radians = ((sprite?.rotation || 0) * Math.PI) / 180;
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        x: current.x + Math.cos(radians) * steps,
        y: current.y + Math.sin(radians) * steps
      }));
      break;
    }
    case "motion-turn-left":
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        rotation: current.rotation - parseNumber(getBlockParameter(block, "degrees"), 15)
      }));
      break;
    case "motion-turn-right":
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        rotation: current.rotation + parseNumber(getBlockParameter(block, "degrees"), 15)
      }));
      break;
    case "motion-go-to":
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        x: parseNumber(getBlockParameter(block, "x")),
        y: parseNumber(getBlockParameter(block, "y"))
      }));
      break;
    case "motion-glide-to": {
      const seconds = Math.max(0, parseNumber(getBlockParameter(block, "seconds"), 1));
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        x: parseNumber(getBlockParameter(block, "x")),
        y: parseNumber(getBlockParameter(block, "y"))
      }));
      nextState = replaceThread(nextState, threadIndex, {
        ...nextState.threads[threadIndex],
        sleepUntil: nextState.timeMs + seconds * 1000
      });
      break;
    }
    case "motion-point-direction":
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        rotation: parseNumber(getBlockParameter(block, "direction"), 90)
      }));
      break;
    case "motion-rotation-style":
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        rotationStyle: getBlockParameter(block, "style")
      }));
      break;
    case "looks-switch-costume": {
      const costumeName = getBlockParameter(block, "costume");
      nextState = updateSprite(nextState, thread.spriteId, (current) => {
        if (costumeName === "случайный" && current.costumes.length) {
          const randomIndex = Math.floor(Math.random() * current.costumes.length);
          return { ...current, currentCostumeId: current.costumes[randomIndex].id };
        }

        const matched = current.costumes.find((costume) => costume.name === costumeName) || current.costumes[0];
        return matched ? { ...current, currentCostumeId: matched.id } : current;
      });
      break;
    }
    case "looks-next-costume":
      nextState = updateSprite(nextState, thread.spriteId, (current) => {
        if (!current.costumes.length) {
          return current;
        }

        const currentIndex = current.costumes.findIndex((costume) => costume.id === current.currentCostumeId);
        const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % current.costumes.length;
        return { ...current, currentCostumeId: current.costumes[nextIndex].id };
      });
      break;
    case "looks-say": {
      const message = getBlockParameter(block, "message");
      const seconds = Math.max(0, parseNumber(getBlockParameter(block, "seconds"), 2));
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        bubble: {
          type: "say",
          message,
          expiresAt: nextState.timeMs + seconds * 1000
        }
      }));
      nextState = replaceThread(nextState, threadIndex, {
        ...nextState.threads[threadIndex],
        sleepUntil: nextState.timeMs + seconds * 1000
      });
      break;
    }
    case "looks-think":
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        bubble: {
          type: "think",
          message: getBlockParameter(block, "message"),
          expiresAt: null
        }
      }));
      break;
    case "looks-change-size":
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        scale: current.scale + parseNumber(getBlockParameter(block, "delta"), 10) / 100
      }));
      break;
    case "looks-set-size":
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        scale: parseNumber(getBlockParameter(block, "size"), 100) / 100
      }));
      break;
    case "looks-show":
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({ ...current, visible: true }));
      break;
    case "looks-hide":
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({ ...current, visible: false }));
      break;
    case "sound-play":
      nextState = appendLog(nextState, "info", `${sprite?.name || "Спрайт"} воспроизводит звук ${getBlockParameter(block, "sound")}.`);
      break;
    case "sound-stop":
      nextState = appendLog(nextState, "info", "Все звуки остановлены.");
      break;
    case "sound-change-volume":
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        volume: current.volume + parseNumber(getBlockParameter(block, "delta"), 10)
      }));
      break;
    case "sound-set-volume":
      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        volume: parseNumber(getBlockParameter(block, "volume"), 100)
      }));
      break;
    case "event-broadcast": {
      const message = getBlockParameter(block, "message");
      nextState = appendLog(nextState, "info", `Broadcast: ${message}`);
      nextState = spawnScripts(nextState, (script) => script.trigger.type === "broadcast" && script.trigger.message === message);
      break;
    }
    case "control-wait":
      nextState = replaceThread(nextState, threadIndex, {
        ...nextState.threads[threadIndex],
        sleepUntil: nextState.timeMs + Math.max(0, parseNumber(getBlockParameter(block, "seconds"), 1)) * 1000
      });
      break;
    case "control-repeat": {
      const times = Math.max(0, Math.floor(parseNumber(getBlockParameter(block, "times"), 10)));
      if (times > 0) {
        nextState = replaceThread(nextState, threadIndex, {
          ...nextState.threads[threadIndex],
          stack: [...nextState.threads[threadIndex].stack, { kind: "repeat", block, remaining: times }]
        });
      }
      break;
    }
    case "control-forever":
      nextState = replaceThread(nextState, threadIndex, {
        ...nextState.threads[threadIndex],
        stack: [...nextState.threads[threadIndex].stack, { kind: "forever", block }]
      });
      break;
    case "control-if":
      if (evaluateCondition(getBlockParameter(block, "condition"), thread.spriteId, nextState)) {
        nextState = replaceThread(nextState, threadIndex, {
          ...nextState.threads[threadIndex],
          stack: [...nextState.threads[threadIndex].stack, ...asStack(getBlockSection(block, "if"))]
        });
      }
      break;
    case "control-if-else": {
      const branch = evaluateCondition(getBlockParameter(block, "condition"), thread.spriteId, nextState) ? "if" : "else";
      nextState = replaceThread(nextState, threadIndex, {
        ...nextState.threads[threadIndex],
        stack: [...nextState.threads[threadIndex].stack, ...asStack(getBlockSection(block, branch))]
      });
      break;
    }
    case "control-wait-until":
      nextState = replaceThread(nextState, threadIndex, {
        ...nextState.threads[threadIndex],
        waitingCondition: getBlockParameter(block, "condition")
      });
      break;
    case "control-repeat-until":
      nextState = replaceThread(nextState, threadIndex, {
        ...nextState.threads[threadIndex],
        stack: [
          ...nextState.threads[threadIndex].stack,
          { kind: "repeatUntil", block, condition: getBlockParameter(block, "condition") }
        ]
      });
      break;
    case "control-stop": {
      const target = getBlockParameter(block, "target");

      if (target === "всё") {
        return stopVm(appendLog(nextState, "warn", "Выполнение остановлено блоком `остановить всё`."));
      }

      nextState = replaceThread(nextState, threadIndex, markThreadDone(nextState.threads[threadIndex]));
      break;
    }
    case "sensing-ask-and-wait":
      if (nextState.prompt) {
        nextState = replaceThread(nextState, threadIndex, {
          ...nextState.threads[threadIndex],
          sleepUntil: nextState.timeMs + 16,
          stack: [...nextState.threads[threadIndex].stack, { kind: "block", block }]
        });
        break;
      }

      nextState = updateSprite(nextState, thread.spriteId, (current) => ({
        ...current,
        bubble: {
          type: "say",
          message: getBlockParameter(block, "question"),
          expiresAt: null
        }
      }));
      nextState = replaceThread(nextState, threadIndex, {
        ...nextState.threads[threadIndex],
        waitingForAnswer: true
      });
      nextState = appendLog(nextState, "info", `Вопрос: ${getBlockParameter(block, "question")}`);
      nextState = {
        ...nextState,
        prompt: {
          spriteId: thread.spriteId,
          threadId: nextState.threads[threadIndex].id,
          question: getBlockParameter(block, "question")
        }
      };
      break;
    case "sensing-reset-timer":
      nextState = { ...nextState, timerStartedAt: nextState.timeMs };
      break;
    case "variable-create": {
      const variableName = getBlockParameter(block, "name").trim() || "новая переменная";
      nextState =
        variableName in nextState.variables
          ? appendLog(nextState, "warn", `Переменная \`${variableName}\` уже существует.`)
          : withUpdatedVariable(nextState, variableName, 0, `Создана переменная ${variableName} = 0`);
      break;
    }
    case "variable-set": {
      const variableName = getBlockParameter(block, "variable");
      const rawValue = getBlockParameter(block, "value");
      const value = rawValue !== "" && Number.isFinite(Number(rawValue)) ? Number(rawValue) : rawValue;
      nextState = withUpdatedVariable(nextState, variableName, value, `${variableName} = ${String(value)}`);
      break;
    }
    case "variable-change": {
      const variableName = getBlockParameter(block, "variable");
      const nextValue = Number(nextState.variables[variableName] ?? 0) + parseNumber(getBlockParameter(block, "delta"), 1);
      nextState = withUpdatedVariable(nextState, variableName, nextValue, `${variableName} = ${nextValue}`);
      break;
    }
    case "variable-show": {
      const variableName = getBlockParameter(block, "variable");
      nextState = appendLog(
        {
          ...nextState,
          visibleVariables: nextState.visibleVariables.includes(variableName)
            ? nextState.visibleVariables
            : [...nextState.visibleVariables, variableName]
        },
        "debug",
        `Показ переменной ${variableName}`
      );
      break;
    }
    case "variable-hide": {
      const variableName = getBlockParameter(block, "variable");
      nextState = appendLog(
        {
          ...nextState,
          visibleVariables: nextState.visibleVariables.filter((item) => item !== variableName)
        },
        "debug",
        `Скрыта переменная ${variableName}`
      );
      break;
    }
    default:
      if (block.type === "reporter" || block.type === "boolean") {
        const value = block.type === "boolean" ? evaluateBoolean(block, thread.spriteId, nextState) : evaluateReporter(block, thread.spriteId, nextState);
        nextState = appendLog(nextState, "debug", `${block.name || block.id}: ${String(value)}`);
      } else if (block.type !== "hat") {
        nextState = appendLog(nextState, "error", `Неизвестный блок: ${block.name || block.id}`);
      }
      break;
  }

  return nextState;
}

function executeThreadItem(state: ScratchVmState, index: number): ScratchVmState {
  const sourceThread = state.threads[index];
  if (!sourceThread) {
    return state;
  }

  let thread: VmThread = syncThreadState(sourceThread, state);

  const item = thread.stack[thread.stack.length - 1];

  if (!item) {
    return replaceThread(state, index, markThreadDone(thread));
  }

  thread = {
    ...thread,
    stack: thread.stack.slice(0, -1),
    currentBlockId: item.block.instanceId
  };

  let nextState = replaceThread(state, index, thread);

  switch (item.kind) {
    case "repeat": {
      if (!item.remaining) {
        break;
      }

      const body = getBlockSection(item.block, "body");
      if (!body.length) {
        nextState = appendLog(nextState, "warn", "Пустой цикл `повторить` пропущен.");
        break;
      }

      const nextThread = nextState.threads[index];
      nextState = replaceThread(nextState, index, {
        ...nextThread,
        stack: [...nextThread.stack, { kind: "repeat", block: item.block, remaining: item.remaining - 1 }, ...asStack(body)]
      });
      break;
    }
    case "forever": {
      const body = getBlockSection(item.block, "body");
      if (!body.length) {
        nextState = appendLog(nextState, "warn", "Пустой цикл `всегда` остановлен, чтобы не зависнуть.");
        nextState = replaceThread(nextState, index, markThreadDone(nextState.threads[index]));
        break;
      }

      const nextThread = nextState.threads[index];
      nextState = replaceThread(nextState, index, {
        ...nextThread,
        stack: [...nextThread.stack, { kind: "forever", block: item.block }, ...asStack(body)]
      });
      break;
    }
    case "repeatUntil": {
      if (evaluateCondition(item.condition, thread.spriteId, nextState)) {
        break;
      }

      const body = getBlockSection(item.block, "body");
      if (!body.length) {
        nextState = appendLog(nextState, "warn", "Пустой цикл `повторять до` остановлен, чтобы не зависнуть.");
        nextState = replaceThread(nextState, index, markThreadDone(nextState.threads[index]));
        break;
      }

      const nextThread = nextState.threads[index];
      nextState = replaceThread(nextState, index, {
        ...nextThread,
        stack: [...nextThread.stack, { kind: "repeatUntil", block: item.block, condition: item.condition }, ...asStack(body)]
      });
      break;
    }
    case "block":
      nextState = executeBlock(nextState, index, item.block);
      break;
  }

  return nextState;
}

function resetFromSnapshot(snapshot: VmProjectSnapshot, state: ScratchVmState, status: ScratchVmState["status"]) {
  return {
    ...state,
    status,
    sprites: snapshot.sprites.map((sprite) => sanitizeSprite(sprite)),
    threads: [],
    variables: { ...DEFAULT_VARIABLES },
    visibleVariables: ["счёт"],
    answer: "",
    prompt: null,
    input: {
      ...state.input,
      mouseDown: false,
      pressedKeys: []
    },
    timeMs: 0,
    timerStartedAt: 0,
    activeBlockIdsBySprite: {},
    nextThreadId: 1,
    schedulerCursor: 0,
    frameWarning: null
  } satisfies ScratchVmState;
}

export function createProjectSnapshot(
  sprites: VmSpriteState[],
  workspaces: Record<string, WorkspaceBlock[]>
): VmProjectSnapshot {
  return {
    sprites: sprites.map((sprite) => sanitizeSprite(sprite)),
    workspaces: cloneWorkspaces(workspaces)
  };
}

export function createScratchVm(initialSprites: VmSpriteState[]): ScratchVmState {
  return {
    status: "stopped",
    sprites: initialSprites.map((sprite) => sanitizeSprite(sprite)),
    threads: [],
    logs: [],
    variables: { ...DEFAULT_VARIABLES },
    visibleVariables: ["счёт"],
    answer: "",
    prompt: null,
    input: {
      mouseX: 0,
      mouseY: 0,
      mouseDown: false,
      pressedKeys: []
    },
    timeMs: 0,
    timerStartedAt: 0,
    activeBlockIdsBySprite: {},
    lastResetSnapshot: null,
    nextThreadId: 1,
    schedulerCursor: 0,
    frameWarning: null
  };
}

export function startVm(state: ScratchVmState, snapshot: VmProjectSnapshot) {
  let nextState: ScratchVmState = {
    ...resetFromSnapshot(cloneSnapshot(snapshot), state, "running"),
    lastResetSnapshot: cloneSnapshot(snapshot)
  };

  nextState = appendLog(nextState, "info", "Запуск по зелёному флагу.");
  nextState = spawnScripts(nextState, (script) => script.trigger.type === "flag");
  return advanceVmFrame(nextState, 0);
}

export function pauseVm(state: ScratchVmState) {
  if (state.status !== "running") {
    return state;
  }

  return appendLog({ ...state, status: "paused" }, "info", "Выполнение поставлено на паузу.");
}

export function resumeVm(state: ScratchVmState) {
  if (state.status !== "paused") {
    return state;
  }

  return appendLog({ ...state, status: "running" }, "info", "Выполнение продолжено.");
}

export function stopVm(state: ScratchVmState) {
  if (!state.lastResetSnapshot) {
    return refreshActiveBlocks({
      ...state,
      status: "stopped",
      threads: [],
      activeBlockIdsBySprite: {},
      frameWarning: null
    });
  }

  return refreshActiveBlocks(resetFromSnapshot(cloneSnapshot(state.lastResetSnapshot), state, "stopped"));
}

export function advanceVmFrame(state: ScratchVmState, deltaMs: number) {
  if (state.status !== "running") {
    return refreshActiveBlocks(state);
  }

  let nextState: ScratchVmState = removeFinishedThreads(
    clearExpiredBubbles({
      ...state,
      timeMs: state.timeMs + Math.max(0, deltaMs),
      frameWarning: null
    })
  );
  let steps = 0;

  while (steps < MAX_STEPS_PER_FRAME) {
    const index = findNextReadyThreadIndex(nextState);
    if (index === -1) {
      break;
    }

    nextState = executeThreadItem({ ...nextState, schedulerCursor: index + 1 }, index);
    nextState = clearExpiredBubbles(removeFinishedThreads(nextState));

    if (nextState.status === "stopped") {
      return refreshActiveBlocks(nextState);
    }

    steps += 1;
  }

  if (steps >= MAX_STEPS_PER_FRAME && findNextReadyThreadIndex(nextState) !== -1) {
    nextState = appendLog(
      nextState,
      "warn",
      "VM ограничила число шагов за кадр. Проверь бесконечный цикл или добавь `ждать`."
    );
    nextState = {
      ...nextState,
      frameWarning: "Лимит шагов на кадр достигнут. Выполнение продолжится на следующем кадре."
    };
  }

  return refreshActiveBlocks(nextState);
}

export function dispatchKeyEvent(state: ScratchVmState, key: string) {
  if (state.status !== "running") {
    return state;
  }

  const normalizedKey = normalizeKey(key);
  const nextState = spawnScripts(
    {
      ...state,
      input: {
        ...state.input,
        pressedKeys: state.input.pressedKeys.includes(normalizedKey)
          ? state.input.pressedKeys
          : [...state.input.pressedKeys, normalizedKey]
      }
    },
    (script) => script.trigger.type === "key" && script.trigger.key === normalizedKey
  );

  return refreshActiveBlocks(nextState);
}

export function releaseKey(state: ScratchVmState, key: string) {
  const normalizedKey = normalizeKey(key);
  return {
    ...state,
    input: {
      ...state.input,
      pressedKeys: state.input.pressedKeys.filter((item) => item !== normalizedKey)
    }
  };
}

export function updateMousePosition(state: ScratchVmState, mouseX: number, mouseY: number) {
  return {
    ...state,
    input: {
      ...state.input,
      mouseX,
      mouseY
    }
  };
}

export function setMouseDown(state: ScratchVmState, mouseDown: boolean) {
  return {
    ...state,
    input: {
      ...state.input,
      mouseDown
    }
  };
}

export function dispatchSpriteClick(state: ScratchVmState, spriteId: string) {
  if (state.status !== "running") {
    return state;
  }

  return refreshActiveBlocks(
    spawnScripts(state, (script) => script.trigger.type === "sprite-click" && script.spriteId === spriteId)
  );
}

export function submitVmAnswer(state: ScratchVmState, answer: string) {
  if (!state.prompt) {
    return state;
  }

  const prompt = state.prompt;
  let nextState = appendLog(
    {
      ...state,
      answer,
      prompt: null,
      threads: state.threads.map((thread) =>
        thread.id === prompt.threadId
          ? {
              ...thread,
              waitingForAnswer: false
            }
          : thread
      )
    },
    "info",
    `Ответ: ${answer || "пусто"}`
  );

  nextState = updateSprite(nextState, prompt.spriteId, (sprite) => ({
    ...sprite,
    bubble: null
  }));

  return refreshActiveBlocks(nextState);
}
