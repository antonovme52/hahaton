/* eslint-disable @next/next/no-img-element */
"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bug, Eye, EyeOff, Flag, ImagePlus, Pause, Play, Plus, Square, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BlockProgrammingStudio } from "@/components/programming/block-programming-studio";
import { createStarterWorkspace, type WorkspaceBlock } from "@/lib/block-programming";
import {
  advanceVmFrame,
  createProjectSnapshot,
  createScratchVm,
  dispatchKeyEvent,
  dispatchSpriteClick,
  pauseVm,
  releaseKey,
  resumeVm,
  setMouseDown,
  startVm,
  stopVm,
  submitVmAnswer,
  updateMousePosition,
  type VmCostume,
  type VmSpriteState
} from "@/lib/scratch-vm";
import { cn } from "@/lib/utils";

type Costume = VmCostume;
type Sprite = VmSpriteState;

type SpriteTemplate = {
  id: string;
  title: string;
  description: string;
  accent: string;
  costumes: Array<{ name: string; assetUrl: string }>;
};

type DragState = {
  spriteId: string;
  offsetX: number;
  offsetY: number;
};

const STAGE_WIDTH = 480;
const STAGE_HEIGHT = 360;

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function svgAsset(markup: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${markup}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function costume(name: string, markup: string) {
  return { name, assetUrl: svgAsset(markup) };
}

const spriteGallery: SpriteTemplate[] = [
  {
    id: "cat",
    title: "Cat",
    description: "Весёлый герой для первых сцен.",
    accent: "from-[#ffd166] to-[#ff8f5a]",
    costumes: [
      costume("Стоит", '<ellipse cx="60" cy="104" rx="30" ry="8" fill="#000" opacity=".12"/><path d="M36 28 48 10l12 20M84 28 72 10 60 30" fill="#f68b2b"/><rect x="24" y="28" width="72" height="62" rx="28" fill="#ff9f1c"/><ellipse cx="60" cy="56" rx="28" ry="24" fill="#ffbf69"/><circle cx="48" cy="54" r="9" fill="#fff"/><circle cx="72" cy="54" r="9" fill="#fff"/><circle cx="49" cy="55" r="3" fill="#1f2f46"/><circle cx="71" cy="55" r="3" fill="#1f2f46"/><path d="M53 68q7 7 14 0" stroke="#b95e2f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M28 70c-14 6-16 26 6 28" stroke="#f68b2b" stroke-width="8" fill="none" stroke-linecap="round"/>'),
      costume("Машет", '<ellipse cx="60" cy="104" rx="30" ry="8" fill="#000" opacity=".12"/><path d="M36 28 48 10l12 20M84 28 72 10 60 30" fill="#f68b2b"/><rect x="24" y="28" width="72" height="62" rx="28" fill="#ff9f1c"/><ellipse cx="60" cy="56" rx="28" ry="24" fill="#ffbf69"/><circle cx="48" cy="54" r="9" fill="#fff"/><circle cx="72" cy="54" r="9" fill="#fff"/><circle cx="49" cy="55" r="3" fill="#1f2f46"/><circle cx="71" cy="55" r="3" fill="#1f2f46"/><path d="M53 68q7 7 14 0" stroke="#b95e2f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M92 68c18-8 18 18-2 22" stroke="#f68b2b" stroke-width="8" fill="none" stroke-linecap="round"/>')
    ]
  },
  {
    id: "robot",
    title: "Robot",
    description: "Для алгоритмов и квестов.",
    accent: "from-[#86d8ff] to-[#4f9cf7]",
    costumes: [
      costume("Обычный", '<ellipse cx="60" cy="106" rx="28" ry="8" fill="#000" opacity=".12"/><rect x="30" y="24" width="60" height="38" rx="14" fill="#8cccf6"/><rect x="39" y="34" width="42" height="18" rx="9" fill="#17324d"/><circle cx="49" cy="43" r="4" fill="#8de0ff"/><circle cx="71" cy="43" r="4" fill="#8de0ff"/><rect x="36" y="66" width="48" height="28" rx="12" fill="#d8ecff"/><rect x="22" y="68" width="12" height="28" rx="6" fill="#77b1ef"/><rect x="86" y="68" width="12" height="28" rx="6" fill="#77b1ef"/><rect x="42" y="94" width="10" height="16" rx="5" fill="#6c89a4"/><rect x="68" y="94" width="10" height="16" rx="5" fill="#6c89a4"/><circle cx="60" cy="18" r="5" fill="#ffd166"/><path d="M60 22V28" stroke="#6c89a4" stroke-width="4" stroke-linecap="round"/>'),
      costume("Машет", '<ellipse cx="60" cy="106" rx="28" ry="8" fill="#000" opacity=".12"/><rect x="30" y="24" width="60" height="38" rx="14" fill="#8cccf6"/><rect x="39" y="34" width="42" height="18" rx="9" fill="#17324d"/><circle cx="49" cy="43" r="4" fill="#8de0ff"/><circle cx="71" cy="43" r="4" fill="#8de0ff"/><rect x="36" y="66" width="48" height="28" rx="12" fill="#d8ecff"/><path d="M28 72c-16-18 2-26 12-10" stroke="#77b1ef" stroke-width="12" fill="none" stroke-linecap="round"/><rect x="86" y="68" width="12" height="28" rx="6" fill="#77b1ef"/><rect x="42" y="94" width="10" height="16" rx="5" fill="#6c89a4"/><rect x="68" y="94" width="10" height="16" rx="5" fill="#6c89a4"/><circle cx="60" cy="18" r="5" fill="#ffd166"/><path d="M60 22V28" stroke="#6c89a4" stroke-width="4" stroke-linecap="round"/>')
    ]
  },
  {
    id: "rocket",
    title: "Rocket",
    description: "Для космических историй.",
    accent: "from-[#c4b5fd] to-[#fb7185]",
    costumes: [
      costume("Старт", '<ellipse cx="60" cy="106" rx="24" ry="8" fill="#000" opacity=".12"/><path d="M60 12c22 14 28 42 20 74H40C32 54 38 26 60 12Z" fill="#f8fafc"/><circle cx="60" cy="46" r="10" fill="#7dd3fc"/><path d="M40 84 20 98 32 72Z" fill="#fb7185"/><path d="M80 84 100 98 88 72Z" fill="#fb7185"/><path d="M48 86 60 102 72 86Z" fill="#f59e0b"/><path d="M50 14h20Q64 4 60 4q-4 0-10 10Z" fill="#fb7185"/>'),
      costume("Полёт", '<ellipse cx="60" cy="106" rx="24" ry="8" fill="#000" opacity=".12"/><path d="M60 12c22 14 28 42 20 74H40C32 54 38 26 60 12Z" fill="#f8fafc"/><circle cx="60" cy="46" r="10" fill="#7dd3fc"/><path d="M40 84 20 98 32 72Z" fill="#fb7185"/><path d="M80 84 100 98 88 72Z" fill="#fb7185"/><path d="M44 86 60 114 76 86Z" fill="#f97316"/><path d="M50 14h20Q64 4 60 4q-4 0-10 10Z" fill="#fb7185"/>')
    ]
  },
  {
    id: "star",
    title: "Star",
    description: "Коллекционный спрайт.",
    accent: "from-[#fde68a] to-[#f59e0b]",
    costumes: [
      costume("Яркая", '<ellipse cx="60" cy="106" rx="28" ry="8" fill="#000" opacity=".12"/><path d="m60 14 12 28 30 4-22 20 8 28-28-16-28 16 8-28-22-20 30-4Z" fill="#facc15"/><circle cx="60" cy="54" r="7" fill="#fff6bf" opacity=".7"/>'),
      costume("Сияет", '<ellipse cx="60" cy="106" rx="28" ry="8" fill="#000" opacity=".12"/><path d="m60 14 12 28 30 4-22 20 8 28-28-16-28 16 8-28-22-20 30-4Z" fill="#f59e0b"/><path d="m60 24 6 16 16 2-12 10 4 16-14-8-14 8 4-16-12-10 16-2Z" fill="#fff6cf"/>')
    ]
  },
  {
    id: "fish",
    title: "Fish",
    description: "Для морских сцен.",
    accent: "from-[#67e8f9] to-[#0ea5e9]",
    costumes: [
      costume("Плывёт", '<ellipse cx="60" cy="106" rx="24" ry="8" fill="#000" opacity=".12"/><ellipse cx="54" cy="60" rx="28" ry="20" fill="#22d3ee"/><path d="M84 60 106 42v36Z" fill="#0ea5e9"/><path d="M44 44 52 30l10 14Z" fill="#8be9ff"/><circle cx="42" cy="56" r="4" fill="#17324d"/><path d="M34 68q8 8 16 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>'),
      costume("Подмигивает", '<ellipse cx="60" cy="106" rx="24" ry="8" fill="#000" opacity=".12"/><ellipse cx="54" cy="60" rx="28" ry="20" fill="#22d3ee"/><path d="M84 60 106 42v36Z" fill="#0ea5e9"/><path d="M44 44 52 30l10 14Z" fill="#8be9ff"/><path d="M36 56h12" stroke="#17324d" stroke-width="4" stroke-linecap="round"/><path d="M34 68q8 8 16 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>')
    ]
  },
  {
    id: "flower",
    title: "Flower",
    description: "Декор для сцены.",
    accent: "from-[#f9a8d4] to-[#fb7185]",
    costumes: [
      costume("Открыт", '<ellipse cx="60" cy="106" rx="24" ry="8" fill="#000" opacity=".12"/><path d="M60 54v40" stroke="#22c55e" stroke-width="8" stroke-linecap="round"/><circle cx="60" cy="42" r="12" fill="#facc15"/><circle cx="60" cy="22" r="16" fill="#f472b6"/><circle cx="82" cy="42" r="16" fill="#f472b6"/><circle cx="60" cy="62" r="16" fill="#f472b6"/><circle cx="38" cy="42" r="16" fill="#f472b6"/><path d="M60 82c-14-8-18 6-12 12" stroke="#22c55e" stroke-width="6" fill="none" stroke-linecap="round"/>'),
      costume("Покачнулся", '<ellipse cx="60" cy="106" rx="24" ry="8" fill="#000" opacity=".12"/><path d="M58 54c8 12 10 28 8 40" stroke="#22c55e" stroke-width="8" stroke-linecap="round"/><circle cx="68" cy="42" r="12" fill="#facc15"/><circle cx="68" cy="22" r="16" fill="#f472b6"/><circle cx="90" cy="42" r="16" fill="#f472b6"/><circle cx="68" cy="62" r="16" fill="#f472b6"/><circle cx="46" cy="42" r="16" fill="#f472b6"/><path d="M68 82c14-8 18 6 12 12" stroke="#22c55e" stroke-width="6" fill="none" stroke-linecap="round"/>')
    ]
  },
  {
    id: "monster",
    title: "Monster",
    description: "Забавный персонаж.",
    accent: "from-[#86efac] to-[#14b8a6]",
    costumes: [
      costume("Улыбается", '<ellipse cx="60" cy="106" rx="28" ry="8" fill="#000" opacity=".12"/><rect x="26" y="24" width="68" height="72" rx="28" fill="#34d399"/><path d="M34 24 42 10l8 14M70 24 78 10l8 14" fill="#10b981"/><circle cx="46" cy="48" r="10" fill="#fff"/><circle cx="74" cy="48" r="10" fill="#fff"/><circle cx="46" cy="50" r="4" fill="#17324d"/><circle cx="74" cy="50" r="4" fill="#17324d"/><path d="M44 72q16 14 32 0" stroke="#17324d" stroke-width="5" fill="none" stroke-linecap="round"/>'),
      costume("Удивлён", '<ellipse cx="60" cy="106" rx="28" ry="8" fill="#000" opacity=".12"/><rect x="26" y="24" width="68" height="72" rx="28" fill="#34d399"/><path d="M34 24 42 10l8 14M70 24 78 10l8 14" fill="#10b981"/><circle cx="46" cy="48" r="12" fill="#fff"/><circle cx="74" cy="48" r="12" fill="#fff"/><circle cx="46" cy="50" r="4" fill="#17324d"/><circle cx="74" cy="50" r="4" fill="#17324d"/><ellipse cx="60" cy="76" rx="10" ry="12" fill="#17324d"/>')
    ]
  },
  {
    id: "ufo",
    title: "UFO",
    description: "Тарелка для космоса.",
    accent: "from-[#93c5fd] to-[#818cf8]",
    costumes: [
      costume("Зависло", '<ellipse cx="60" cy="106" rx="28" ry="8" fill="#000" opacity=".12"/><ellipse cx="60" cy="52" rx="22" ry="18" fill="#dbeafe"/><ellipse cx="60" cy="68" rx="42" ry="16" fill="#818cf8"/><circle cx="42" cy="68" r="4" fill="#fef08a"/><circle cx="60" cy="68" r="4" fill="#fef08a"/><circle cx="78" cy="68" r="4" fill="#fef08a"/><path d="M44 84 36 100M60 84v16M76 84l8 16" stroke="#bfdbfe" stroke-width="6" stroke-linecap="round"/>'),
      costume("Луч", '<ellipse cx="60" cy="106" rx="28" ry="8" fill="#000" opacity=".12"/><ellipse cx="60" cy="52" rx="22" ry="18" fill="#dbeafe"/><ellipse cx="60" cy="68" rx="42" ry="16" fill="#818cf8"/><circle cx="42" cy="68" r="4" fill="#fef08a"/><circle cx="60" cy="68" r="4" fill="#fef08a"/><circle cx="78" cy="68" r="4" fill="#fef08a"/><path d="M46 84 30 114h60L74 84Z" fill="#fde68a" opacity=".45"/>')
    ]
  }
];

function getCurrentCostume(sprite: Sprite) {
  return sprite.costumes.find((item) => item.id === sprite.currentCostumeId) || sprite.costumes[0] || null;
}

function normalizeSprite(sprite: Sprite) {
  const currentCostume = getCurrentCostume(sprite);
  const scale = clamp(sprite.scale, 0.4, 2.4);
  const halfWidth = ((currentCostume?.width || 120) * scale) / 2;
  const halfHeight = ((currentCostume?.height || 120) * scale) / 2;

  return {
    ...sprite,
    scale,
    x: clamp(sprite.x, -STAGE_WIDTH / 2 + halfWidth, STAGE_WIDTH / 2 - halfWidth),
    y: clamp(sprite.y, -STAGE_HEIGHT / 2 + halfHeight, STAGE_HEIGHT / 2 - halfHeight)
  };
}

function makeSpriteFromTemplate(template: SpriteTemplate, index: number): Sprite {
  const costumes: Costume[] = template.costumes.map((item) => ({
    id: uid("costume"),
    name: item.name,
    assetUrl: item.assetUrl,
    width: 120,
    height: 120,
    source: "builtin"
  }));

  return normalizeSprite({
    id: uid("sprite"),
    name: `${template.title} ${index + 1}`,
    x: -150 + (index % 4) * 100,
    y: 50 - Math.floor(index / 4) * 80,
    rotation: 0,
    scale: 0.8,
    visible: true,
    currentCostumeId: costumes[0]?.id || "",
    costumes,
    volume: 100,
    rotationStyle: "все направления",
    bubble: null
  });
}

function makeUploadedSprite(fileName: string, assetUrl: string, index: number): Sprite {
  const costumeId = uid("costume");
  const name = fileName.replace(/\.[^/.]+$/, "") || `Sprite ${index + 1}`;

  return normalizeSprite({
    id: uid("sprite"),
    name,
    x: -140 + (index % 4) * 90,
    y: 30 - Math.floor(index / 4) * 70,
    rotation: 0,
    scale: 0.8,
    visible: true,
    currentCostumeId: costumeId,
    costumes: [
      {
        id: costumeId,
        name,
        assetUrl,
        width: 120,
        height: 120,
        source: "upload"
      }
    ],
    volume: 100,
    rotationStyle: "все направления",
    bubble: null
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function initialSprites() {
  return [makeSpriteFromTemplate(spriteGallery[0], 0), makeSpriteFromTemplate(spriteGallery[1], 1)];
}

function initialWorkspaces(sprites: Sprite[]) {
  return Object.fromEntries(sprites.map((sprite) => [sprite.id, createStarterWorkspace()])) as Record<string, WorkspaceBlock[]>;
}

function mapKeyboardKey(key: string) {
  switch (key) {
    case " ":
    case "Spacebar":
      return "пробел";
    case "ArrowUp":
      return "стрелка вверх";
    case "ArrowDown":
      return "стрелка вниз";
    case "ArrowLeft":
      return "стрелка влево";
    case "ArrowRight":
      return "стрелка вправо";
    default:
      return key.length === 1 ? key.toUpperCase() : key;
  }
}

function runtimeStatusLabel(status: "stopped" | "running" | "paused") {
  switch (status) {
    case "running":
      return "Выполняется";
    case "paused":
      return "Пауза";
    case "stopped":
      return "Остановлено";
  }
}

function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360;
}

function spriteTransform(sprite: Sprite) {
  const translate = `translate(${sprite.x} ${-sprite.y})`;

  switch (sprite.rotationStyle) {
    case "не вращать":
      return `${translate} scale(${sprite.scale})`;
    case "влево-вправо": {
      const normalizedRotation = normalizeRotation(sprite.rotation);
      const facingLeft = normalizedRotation > 90 && normalizedRotation < 270;
      return `${translate} scale(${facingLeft ? -sprite.scale : sprite.scale} ${sprite.scale})`;
    }
    default:
      return `${translate} rotate(${sprite.rotation}) scale(${sprite.scale})`;
  }
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  disabled = false,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-[22px] bg-[#f7fbff] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6f9ac5]">{label}</p>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-[#26527c] shadow-sm">
          {Math.round(value)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          "h-2 w-full appearance-none rounded-full bg-[#d8ebff] accent-[#ff9f1c]",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        )}
      />
    </div>
  );
}

export function ScratchStudio() {
  const seededSprites = useMemo(() => initialSprites(), []);
  const [projectTitle, setProjectTitle] = useState("Scratch Stage Studio");
  const [vmState, setVmState] = useState(() => createScratchVm(seededSprites));
  const [activeSpriteId, setActiveSpriteId] = useState<string | null>(seededSprites[0]?.id || null);
  const [spriteWorkspaces, setSpriteWorkspaces] = useState<Record<string, WorkspaceBlock[]>>(() =>
    initialWorkspaces(seededSprites)
  );
  const [debugMode, setDebugMode] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"blocks" | "stage" | "workspace">("blocks");
  const [toolPanel, setToolPanel] = useState<"sprites" | "gallery" | "inspector" | "costumes">("sprites");
  const [answerDraft, setAnswerDraft] = useState("");
  const stageRef = useRef<SVGSVGElement | null>(null);
  const spriteUploadRef = useRef<HTMLInputElement | null>(null);
  const costumeUploadRef = useRef<HTMLInputElement | null>(null);
  const answerInputRef = useRef<HTMLInputElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const frameTimeRef = useRef<number | null>(null);

  const sprites = vmState.sprites;
  const interactiveLocked = vmState.status !== "stopped";

  const activeSprite = useMemo(
    () => sprites.find((sprite) => sprite.id === activeSpriteId) || null,
    [activeSpriteId, sprites]
  );
  const activeCostume = activeSprite ? getCurrentCostume(activeSprite) : null;
  const promptSprite = useMemo(
    () => sprites.find((sprite) => sprite.id === vmState.prompt?.spriteId) || null,
    [sprites, vmState.prompt?.spriteId]
  );

  function updateSprites(updater: (sprites: Sprite[]) => Sprite[]) {
    setVmState((current) =>
      current.status !== "stopped"
        ? current
        : {
            ...current,
            sprites: updater(current.sprites).map((sprite) => normalizeSprite(sprite))
          }
    );
  }

  function updateSprite(spriteId: string, updater: (sprite: Sprite) => Sprite) {
    updateSprites((current) => current.map((sprite) => (sprite.id === spriteId ? normalizeSprite(updater(sprite)) : sprite)));
  }

  function stagePoint(clientX: number, clientY: number) {
    const rect = stageRef.current?.getBoundingClientRect();

    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: ((clientX - rect.left) / rect.width) * STAGE_WIDTH - STAGE_WIDTH / 2,
      y: STAGE_HEIGHT / 2 - ((clientY - rect.top) / rect.height) * STAGE_HEIGHT
    };
  }

  useEffect(() => {
    let frameId = 0;

    function frame(now: number) {
      setVmState((current) => {
        if (current.status !== "running") {
          frameTimeRef.current = now;
          return current;
        }

        const previous = frameTimeRef.current ?? now;
        frameTimeRef.current = now;
        return advanceVmFrame(current, Math.min(100, now - previous));
      });
      frameId = window.requestAnimationFrame(frame);
    }

    frameId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (vmState.prompt) {
      answerInputRef.current?.focus();
    }
  }, [vmState.prompt]);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const dragState = dragStateRef.current;

      if (!dragState) {
        return;
      }

      const point = stagePoint(event.clientX, event.clientY);
      setVmState((current) =>
        current.status !== "stopped"
          ? current
          : {
              ...current,
              sprites: current.sprites.map((sprite) =>
                sprite.id === dragState.spriteId
                  ? normalizeSprite({
                      ...sprite,
                      x: point.x + dragState.offsetX,
                      y: point.y + dragState.offsetY
                    })
                  : sprite
              )
            }
      );
    }

    function stopDrag() {
      dragStateRef.current = null;
      setVmState((current) => setMouseDown(current, false));
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mappedKey = mapKeyboardKey(event.key);
      if (event.repeat) {
        return;
      }

      setVmState((current) => dispatchKeyEvent(current, mappedKey));
    }

    function onKeyUp(event: KeyboardEvent) {
      const mappedKey = mapKeyboardKey(event.key);
      setVmState((current) => releaseKey(current, mappedKey));
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  async function onImportSprite(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || interactiveLocked) {
      return;
    }

    const assetUrl = await readFileAsDataUrl(file);
    const sprite = makeUploadedSprite(file.name, assetUrl, sprites.length);
    updateSprites((current) => [...current, sprite]);
    setSpriteWorkspaces((current) => ({
      ...current,
      [sprite.id]: createStarterWorkspace()
    }));
    setActiveSpriteId(sprite.id);
    event.target.value = "";
  }

  async function onImportCostume(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !activeSpriteId || interactiveLocked) {
      return;
    }

    const assetUrl = await readFileAsDataUrl(file);
    const costumeId = uid("costume");
    const costumeName = file.name.replace(/\.[^/.]+$/, "") || "Costume";

    updateSprite(activeSpriteId, (sprite) => ({
      ...sprite,
      currentCostumeId: costumeId,
      costumes: [
        ...sprite.costumes,
        {
          id: costumeId,
          name: costumeName,
          assetUrl,
          width: 120,
          height: 120,
          source: "upload"
        }
      ]
    }));

    event.target.value = "";
  }

  function onSpritePointerDown(event: React.PointerEvent<SVGGElement>, spriteId: string) {
    const sprite = sprites.find((item) => item.id === spriteId);

    if (!sprite) {
      return;
    }

    setActiveSpriteId(spriteId);
    if (interactiveLocked) {
      return;
    }

    const point = stagePoint(event.clientX, event.clientY);
    dragStateRef.current = {
      spriteId,
      offsetX: sprite.x - point.x,
      offsetY: sprite.y - point.y
    };
  }

  function addFromGallery(template: SpriteTemplate) {
    if (interactiveLocked) {
      return;
    }

    const sprite = makeSpriteFromTemplate(template, sprites.length);
    updateSprites((current) => [...current, sprite]);
    setSpriteWorkspaces((current) => ({
      ...current,
      [sprite.id]: createStarterWorkspace()
    }));
    setActiveSpriteId(sprite.id);
  }

  function deleteSprite(spriteId: string) {
    if (interactiveLocked) {
      return;
    }

    const next = sprites.filter((sprite) => sprite.id !== spriteId);
    updateSprites(() => next);
    setSpriteWorkspaces((current) => {
      const nextWorkspaces = { ...current };
      delete nextWorkspaces[spriteId];
      return nextWorkspaces;
    });
    setActiveSpriteId((current) => (current === spriteId ? next[0]?.id || null : current));
  }

  function handleGreenFlag() {
    frameTimeRef.current = null;
    setAnswerDraft("");
    setVmState((current) => startVm(current, createProjectSnapshot(current.sprites, spriteWorkspaces)));
  }

  function handlePauseToggle() {
    frameTimeRef.current = null;
    setVmState((current) => (current.status === "running" ? pauseVm(current) : resumeVm(current)));
  }

  function handleStop() {
    frameTimeRef.current = null;
    setAnswerDraft("");
    setVmState((current) => stopVm(current));
  }

  function handlePromptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVmState((current) => submitVmAnswer(current, answerDraft));
    setAnswerDraft("");
  }

  function renderSpriteLibrary() {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#6f9ac5]">Sprites</p>
            <h3 className="text-xl font-black text-[#26527c]">Список спрайтов</h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#d8ebff] bg-white"
            onClick={() => spriteUploadRef.current?.click()}
            disabled={interactiveLocked}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>

        {sprites.length ? (
          <div className="grid gap-3">
            {sprites.map((sprite) => {
              const currentCostume = getCurrentCostume(sprite);
              const selected = sprite.id === activeSpriteId;

              return (
                <div
                  key={sprite.id}
                  onClick={() => setActiveSpriteId(sprite.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveSpriteId(sprite.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "rounded-[24px] border p-3 text-left transition-all",
                    selected
                      ? "border-[#ff9c68] bg-[#fff4ea] shadow-[0_12px_28px_rgba(255,159,28,0.16)]"
                      : "border-[#d8ebff] bg-white hover:-translate-y-0.5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-[#eef7ff]">
                        {currentCostume ? (
                          <img src={currentCostume.assetUrl} alt={currentCostume.name} className="h-12 w-12 object-contain" draggable={false} />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        {selected ? (
                          <Input
                            value={sprite.name}
                            onChange={(event) =>
                              updateSprite(sprite.id, (current) => ({
                                ...current,
                                name: event.target.value
                              }))
                            }
                            onClick={(event) => event.stopPropagation()}
                            disabled={interactiveLocked}
                            className="h-10 border-[#d8ebff] bg-white font-bold text-[#26527c]"
                          />
                        ) : (
                          <p className="font-black text-[#26527c]">{sprite.name}</p>
                        )}
                        <p className="mt-1 text-sm text-[#5e7a98]">
                          {sprite.visible ? "Visible" : "Hidden"} • {sprite.costumes.length} costumes
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full border-[#d8ebff] bg-white"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteSprite(sprite.id);
                      }}
                      disabled={interactiveLocked}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#d8ebff] bg-white p-6 text-sm text-[#5e7a98]">
            На сцене пока нет спрайтов. Добавь персонажа из галереи или импортируй своё изображение.
          </div>
        )}
      </div>
    );
  }

  function renderSpriteGallery() {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#6f9ac5]">Gallery</p>
          <h3 className="text-xl font-black text-[#26527c]">Готовые спрайты</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {spriteGallery.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => addFromGallery(template)}
              disabled={interactiveLocked}
              className="rounded-[24px] border border-[#d8ebff] bg-white p-3 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br", template.accent)}>
                  <img src={template.costumes[0].assetUrl} alt={template.title} className="h-12 w-12 object-contain" draggable={false} />
                </div>
                <div>
                  <p className="font-black text-[#26527c]">{template.title}</p>
                  <p className="mt-1 text-sm text-[#5e7a98]">{template.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderInspector() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#6f9ac5]">Inspector</p>
            <h3 className="text-xl font-black text-[#26527c]">Активный спрайт</h3>
          </div>
          {activeSprite ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#d8ebff] bg-white"
              onClick={() =>
                updateSprite(activeSprite.id, (sprite) => ({
                  ...sprite,
                  visible: !sprite.visible
                }))
              }
              disabled={interactiveLocked}
            >
              {activeSprite.visible ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
              {activeSprite.visible ? "Hide" : "Show"}
            </Button>
          ) : null}
        </div>

        {activeSprite && activeCostume ? (
          <>
            <div className="rounded-[24px] bg-[#f7fbff] p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[22px] bg-white shadow-sm">
                  <img src={activeCostume.assetUrl} alt={activeCostume.name} className="h-20 w-20 object-contain" draggable={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <Input
                    value={activeSprite.name}
                    onChange={(event) =>
                      updateSprite(activeSprite.id, (sprite) => ({
                        ...sprite,
                        name: event.target.value
                      }))
                    }
                    disabled={interactiveLocked}
                    className="h-11 border-[#d8ebff] bg-white font-bold text-[#26527c]"
                  />
                  <p className="mt-3 text-sm text-[#5e7a98]">
                    Current costume: <span className="font-semibold text-[#26527c]">{activeCostume.name}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Slider
                label="X"
                value={activeSprite.x}
                min={-200}
                max={200}
                step={1}
                disabled={interactiveLocked}
                onChange={(value) => updateSprite(activeSprite.id, (sprite) => ({ ...sprite, x: value }))}
              />
              <Slider
                label="Y"
                value={activeSprite.y}
                min={-140}
                max={140}
                step={1}
                disabled={interactiveLocked}
                onChange={(value) => updateSprite(activeSprite.id, (sprite) => ({ ...sprite, y: value }))}
              />
              <Slider
                label="Rotation"
                value={activeSprite.rotation}
                min={-180}
                max={180}
                step={1}
                disabled={interactiveLocked}
                onChange={(value) => updateSprite(activeSprite.id, (sprite) => ({ ...sprite, rotation: value }))}
              />
              <Slider
                label="Scale"
                value={activeSprite.scale * 100}
                min={40}
                max={240}
                step={5}
                suffix="%"
                disabled={interactiveLocked}
                onChange={(value) => updateSprite(activeSprite.id, (sprite) => ({ ...sprite, scale: value / 100 }))}
              />
            </div>
          </>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#d8ebff] bg-[#f8fbff] p-6 text-sm text-[#5e7a98]">
            Выбери спрайт из списка или добавь новый из галереи.
          </div>
        )}
      </div>
    );
  }

  function renderCostumes() {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#6f9ac5]">Costumes</p>
            <h3 className="text-xl font-black text-[#26527c]">Костюмы спрайта</h3>
          </div>
          <Button
            type="button"
            className="bg-[#ff9f1c] text-white hover:bg-[#f28c0f]"
            onClick={() => costumeUploadRef.current?.click()}
            disabled={!activeSprite || interactiveLocked}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Add costume
          </Button>
        </div>

        {activeSprite ? (
          <div className="grid gap-3">
            {activeSprite.costumes.map((item) => {
              const selected = item.id === activeSprite.currentCostumeId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    updateSprite(activeSprite.id, (sprite) => ({
                      ...sprite,
                      currentCostumeId: item.id
                    }))
                  }
                  disabled={interactiveLocked}
                  className={cn(
                    "flex items-center gap-3 rounded-[22px] border p-3 text-left transition-all",
                    selected ? "border-[#ff9c68] bg-[#fff4ea]" : "border-[#d8ebff] bg-[#f9fcff] hover:-translate-y-0.5",
                    interactiveLocked && "cursor-not-allowed opacity-70"
                  )}
                >
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[18px] bg-white shadow-sm">
                    <img src={item.assetUrl} alt={item.name} className="h-14 w-14 object-contain" draggable={false} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-[#26527c]">{item.name}</p>
                    <p className="mt-1 text-sm text-[#5e7a98]">{item.source === "upload" ? "Uploaded" : "Built-in"} costume</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#d8ebff] bg-[#f8fbff] p-6 text-sm text-[#5e7a98]">
            Здесь появятся костюмы выбранного спрайта.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="xl:hidden">
        <Card className="border-[#d3e6ff] bg-white shadow-[0_20px_50px_rgba(46,115,255,0.1)]">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2 rounded-[24px] border border-[#d8ebff] bg-[#f7fbff] p-1">
              {[
                { id: "blocks", label: "Blocks Studio" },
                { id: "stage", label: "Stage Editor" },
                { id: "workspace", label: "Workspace" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMobilePanel(tab.id as typeof mobilePanel)}
                  className={cn(
                    "rounded-[18px] px-3 py-2 text-sm font-semibold transition",
                    mobilePanel === tab.id ? "bg-white text-[#244a73] shadow-sm" : "text-[#6f88a5]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className={cn(mobilePanel !== "blocks" && "hidden xl:block")}>
          <BlockProgrammingStudio
            sprites={sprites.map((sprite) => ({
              id: sprite.id,
              name: sprite.name,
              costumeNames: sprite.costumes.map((costume) => costume.name)
            }))}
            activeSpriteId={activeSpriteId}
            onActiveSpriteChange={setActiveSpriteId}
            workspaces={spriteWorkspaces}
            onWorkspacesChange={setSpriteWorkspaces}
            activeExecutionIdsBySprite={debugMode ? vmState.activeBlockIdsBySprite : {}}
            disabled={interactiveLocked}
          />
        </div>

        <div className={cn("space-y-6 2xl:space-y-8", mobilePanel !== "stage" && "hidden xl:block")}>
          <Card className="overflow-hidden border-[#d3e6ff] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] shadow-[0_24px_60px_rgba(46,115,255,0.12)]">
            <div className="border-b border-[#d9ebff] bg-[linear-gradient(120deg,#eef7ff_0%,#ffffff_40%,#fff3e1_100%)] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="reward">Stage Editor</Badge>
                    <Badge variant="outline">{sprites.length} sprites</Badge>
                    <Badge variant="info">{sprites.reduce((sum, sprite) => sum + sprite.costumes.length, 0)} costumes</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#6f9ac5]">Step 2</p>
                    <h3 className="mt-2 text-2xl font-black text-[#244a73]">Проверка сценария на сцене</h3>
                    <p className="mt-1 max-w-2xl text-sm text-[#5e7a98]">
                      Запускай проект, останавливай выполнение и смотри, как ведут себя выбранные спрайты.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  className="bg-pop-ink text-white hover:bg-[#172338]"
                  onClick={() => spriteUploadRef.current?.click()}
                  disabled={interactiveLocked}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import sprite
                </Button>
              </div>
            </div>

            <CardContent className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.2fr)_340px] 2xl:gap-6 2xl:grid-cols-[minmax(0,1.24fr)_380px]">
              <div className="space-y-5">
                <div className="overflow-hidden rounded-[30px] border border-[#d8ebff] bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8ebff] bg-[linear-gradient(180deg,#f9fcff_0%,#f3f9ff_100%)] px-5 py-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.35em] text-[#6f9ac5]">Stage</p>
                      <h2 className="text-2xl font-black text-[#26527c]">Scene</h2>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Badge variant={vmState.status === "running" ? "reward" : vmState.status === "paused" ? "info" : "outline"}>
                        {runtimeStatusLabel(vmState.status)}
                      </Badge>
                      <Button type="button" className="bg-[#1dba68] text-white hover:bg-[#179759]" onClick={handleGreenFlag}>
                        <Flag className="mr-2 h-4 w-4" />
                        Флаг
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#d8ebff] bg-white"
                        onClick={handlePauseToggle}
                        disabled={vmState.status === "stopped"}
                      >
                        {vmState.status === "paused" ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                        {vmState.status === "paused" ? "Продолжить" : "Пауза"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#ffd2c5] bg-white text-[#b4532a]"
                        onClick={handleStop}
                        disabled={vmState.status === "stopped"}
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Стоп
                      </Button>
                      <button
                        type="button"
                        onClick={() => setDebugMode((current) => !current)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm transition",
                          debugMode
                            ? "border-[#cdebd8] bg-[#eefcf4] text-[#19704b]"
                            : "border-[#d8ebff] bg-white text-[#4c7399]"
                        )}
                      >
                        <Bug className="h-4 w-4" />
                        Debug
                      </button>
                    </div>
                  </div>

                  <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_top,#ffffff_0%,#eff8ff_30%,#dcedff_72%,#cfe7ff_100%)]">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.6),rgba(255,255,255,0))]" />
                <svg
                  ref={stageRef}
                  viewBox={`${-STAGE_WIDTH / 2} ${-STAGE_HEIGHT / 2} ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
                  className="h-full w-full touch-none select-none"
                  onPointerMove={(event) => {
                    const point = stagePoint(event.clientX, event.clientY);
                    setVmState((current) => updateMousePosition(current, point.x, point.y));
                  }}
                  onPointerDownCapture={(event) => {
                    const point = stagePoint(event.clientX, event.clientY);
                    setVmState((current) => setMouseDown(updateMousePosition(current, point.x, point.y), true));
                  }}
                  onPointerUpCapture={() => setVmState((current) => setMouseDown(current, false))}
                  onPointerLeave={() => setVmState((current) => setMouseDown(current, false))}
                >
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" x={-240} y={-180}>
                      <path d="M40 0H0V40" fill="none" stroke="rgba(38,82,124,.12)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect x={-240} y={-180} width={480} height={360} fill="url(#grid)" />
                  <rect x={-240} y={106} width={480} height={74} fill="rgba(116,198,97,.28)" />
                  <rect x={-240} y={124} width={480} height={56} fill="#7bc96f" opacity=".82" />
                  <circle cx="170" cy="-112" r="34" fill="rgba(255,255,255,.7)" />

                  {sprites
                    .filter((sprite) => sprite.visible)
                    .map((sprite) => {
                      const currentCostume = getCurrentCostume(sprite);

                      if (!currentCostume) {
                        return null;
                      }

                      const selected = sprite.id === activeSpriteId;

                      return (
                        <g
                          key={sprite.id}
                          transform={spriteTransform(sprite)}
                          onPointerDown={(event) => onSpritePointerDown(event, sprite.id)}
                          onClick={() => {
                            setActiveSpriteId(sprite.id);
                            setVmState((current) => dispatchSpriteClick(current, sprite.id));
                          }}
                          className={cn(interactiveLocked ? "cursor-pointer" : "cursor-grab active:cursor-grabbing")}
                        >
                          {selected ? (
                            <rect x={-70} y={-70} width={140} height={140} rx="20" fill="none" stroke="#ff8f5a" strokeDasharray="10 6" strokeWidth="3" />
                          ) : null}
                          <image href={currentCostume.assetUrl} x={-60} y={-60} width={120} height={120} preserveAspectRatio="xMidYMid meet" />
                        </g>
                      );
                    })}
                </svg>

                {sprites
                  .filter((sprite) => sprite.visible && sprite.bubble)
                  .map((sprite) => (
                    <div
                      key={`${sprite.id}-bubble`}
                      className="pointer-events-none absolute z-20"
                      style={{
                        left: `${((sprite.x + STAGE_WIDTH / 2) / STAGE_WIDTH) * 100}%`,
                        top: `${((STAGE_HEIGHT / 2 - sprite.y) / STAGE_HEIGHT) * 100}%`,
                        transform: "translate(-50%, -120%)"
                      }}
                    >
                      <div
                        className={cn(
                          "max-w-[180px] rounded-[18px] border px-3 py-2 text-sm font-semibold shadow-lg",
                          sprite.bubble?.type === "think"
                            ? "border-[#d8ebff] bg-white text-[#31557c]"
                            : "border-[#ffdfcf] bg-white text-[#8d4f28]"
                        )}
                      >
                        {sprite.bubble?.message}
                      </div>
                    </div>
                  ))}

                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-[#4876a6] shadow-sm">
                    480 x 360
                  </div>
                  {activeSprite ? (
                    <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#4876a6] shadow-sm">
                      {activeSprite.name}: x {Math.round(activeSprite.x)}, y {Math.round(activeSprite.y)}
                    </div>
                  ) : null}
                </div>
                {vmState.visibleVariables.length ? (
                  <div className="absolute right-4 top-4 flex max-w-[42%] flex-wrap justify-end gap-2">
                    {vmState.visibleVariables.map((name) => (
                      <div key={name} className="rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-[#31557c] shadow-sm">
                        {name}: {String(vmState.variables[name] ?? 0)}
                      </div>
                    ))}
                  </div>
                ) : null}
                {vmState.frameWarning ? (
                  <div className="absolute inset-x-4 bottom-4 rounded-[20px] border border-[#ffd1ad] bg-[#fff3e6]/95 px-4 py-3 text-sm font-semibold text-[#9a5a24] shadow-lg">
                    {vmState.frameWarning}
                  </div>
                ) : null}
                {vmState.prompt ? (
                  <div className="absolute inset-x-4 bottom-4 z-30 rounded-[24px] border border-[#d8ebff] bg-white/96 p-4 shadow-[0_20px_50px_rgba(27,78,136,0.18)] backdrop-blur">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#6f9ac5]">Question</p>
                        <h4 className="mt-1 text-lg font-black text-[#244a73]">
                          {promptSprite ? `${promptSprite.name} спрашивает` : "Ожидается ответ"}
                        </h4>
                        <p className="mt-1 text-sm text-[#5e7a98]">{vmState.prompt.question}</p>
                      </div>
                      <Badge variant="info">Блок `спросить и ждать`</Badge>
                    </div>
                    <form onSubmit={handlePromptSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <Input
                        ref={answerInputRef}
                        value={answerDraft}
                        onChange={(event) => setAnswerDraft(event.target.value)}
                        placeholder="Введите ответ для спрайта"
                        className="border-[#d7ebff] bg-white text-[#244a73]"
                      />
                      <Button type="submit" className="bg-pop-ink text-white hover:bg-[#172338] sm:min-w-[150px]">
                        Ответить
                      </Button>
                    </form>
                  </div>
                ) : null}
                  </div>
                </div>

            <Card className="border-[#d9ebff] bg-[#fbfdff]">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-[#6f9ac5]">Console</p>
                    <h3 className="text-xl font-black text-[#26527c]">Лог выполнения</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{Object.keys(vmState.variables).length} vars</Badge>
                    <Badge variant={vmState.logs.some((entry) => entry.level === "error") ? "reward" : "info"}>
                      {vmState.logs.length} logs
                    </Badge>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#d8ebff] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#6f9ac5]">Variables</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(vmState.variables).map(([name, value]) => (
                      <div key={name} className="rounded-full bg-[#f4f9ff] px-3 py-1.5 text-sm font-semibold text-[#31557c]">
                        {name} = {String(value)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="min-h-[220px] max-h-[280px] overflow-auto rounded-[24px] border border-[#d8ebff] bg-[#0f2138] p-4 font-mono text-sm text-[#d5e7ff]">
                  {vmState.logs.length ? (
                    <div className="space-y-2">
                      {vmState.logs.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-3">
                          <span className="min-w-[56px] text-[#7fb6f4]">
                            {(entry.timeMs / 1000).toFixed(2)}s
                          </span>
                          <span
                            className={cn(
                              "min-w-[54px] uppercase",
                              entry.level === "error"
                                ? "text-[#ff9f9f]"
                                : entry.level === "warn"
                                  ? "text-[#ffd59e]"
                                  : entry.level === "debug"
                                    ? "text-[#8ce0b7]"
                                    : "text-[#a9ccff]"
                            )}
                          >
                            {entry.level}
                          </span>
                          <span>{entry.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#8fb2d8]">Здесь появятся ошибки, предупреждения и значения переменных во время выполнения.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#d9ebff] bg-white">
              <CardContent className="space-y-5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-[#6f9ac5]">Tools</p>
                    <h3 className="text-xl font-black text-[#26527c]">Управление проектом</h3>
                  </div>
                  <Badge variant="outline">{activeSprite?.name || "Без выбора"}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-[24px] border border-[#d8ebff] bg-[#f7fbff] p-1">
                  {[
                    { id: "sprites", label: "Спрайты" },
                    { id: "gallery", label: "Галерея" },
                    { id: "inspector", label: "Инспектор" },
                    { id: "costumes", label: "Костюмы" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setToolPanel(tab.id as typeof toolPanel)}
                      className={cn(
                        "rounded-[18px] px-3 py-2 text-sm font-semibold transition",
                        toolPanel === tab.id ? "bg-white text-[#244a73] shadow-sm" : "text-[#6f88a5]"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {toolPanel === "sprites" ? renderSpriteLibrary() : null}
                {toolPanel === "gallery" ? renderSpriteGallery() : null}
                {toolPanel === "inspector" ? renderInspector() : null}
                {toolPanel === "costumes" ? renderCostumes() : null}
              </CardContent>
            </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={cn(mobilePanel !== "workspace" && "hidden xl:block")}>
          <Card className="overflow-hidden border-[#d3e6ff] bg-white shadow-[0_24px_60px_rgba(46,115,255,0.12)]">
            <div className="relative border-b border-[#d9ebff] px-5 py-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,209,102,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(108,199,255,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,245,228,0.7))]" />
              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="reward">Workspace</Badge>
                    <Badge
                      variant={vmState.status === "running" ? "reward" : vmState.status === "paused" ? "info" : "outline"}
                      className={vmState.status === "stopped" ? "border-white/80 bg-white/80 text-pop-ink" : ""}
                    >
                      {runtimeStatusLabel(vmState.status)}
                    </Badge>
                    <Badge variant="outline" className="border-white/80 bg-white/80 text-pop-ink">
                      {sprites.length} sprites
                    </Badge>
                    <Badge variant="info">{vmState.logs.length} logs</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.32em] text-[#6f9ac5]">Step 3</p>
                    <h2 className="text-3xl font-black text-[#244a73]">Проект и инструменты</h2>
                    <Input
                      value={projectTitle}
                      onChange={(event) => setProjectTitle(event.target.value)}
                      disabled={interactiveLocked}
                      className="mt-3 h-12 min-w-[260px] border-[#d7ebff] bg-white text-lg font-black text-[#244a73] sm:w-[420px]"
                    />
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5e7a98]">
                      После сборки блоков и проверки сцены здесь удобно следить за проектом, логами и панелями управления.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-[#d8ebff] bg-white/80 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[#6f9ac5]">Активный спрайт</p>
                    <p className="mt-2 text-lg font-black text-[#244a73]">{activeSprite?.name || "Не выбран"}</p>
                  </div>
                  <div className="rounded-[24px] border border-[#d8ebff] bg-white/80 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[#6f9ac5]">Переменные</p>
                    <p className="mt-2 text-lg font-black text-[#244a73]">{Object.keys(vmState.variables).length}</p>
                  </div>
                  <div className="rounded-[24px] border border-[#d8ebff] bg-white/80 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[#6f9ac5]">Потоки</p>
                    <p className="mt-2 text-lg font-black text-[#244a73]">{vmState.threads.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <input ref={spriteUploadRef} type="file" accept="image/*" className="hidden" onChange={onImportSprite} />
      <input ref={costumeUploadRef} type="file" accept="image/*" className="hidden" onChange={onImportCostume} />
    </div>
  );
}
