"use client";

import { useMemo, useState } from "react";
import { FolderOpen, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const initialFiles = [
  { id: "f1", name: "math-homework.docx", target: "Учеба" },
  { id: "f2", name: "class-photo.jpg", target: "Фото" },
  { id: "f3", name: "project-presentation.pptx", target: "Проекты" },
  { id: "f4", name: "biology-notes.pdf", target: "Учеба" }
];

const folders = ["Учеба", "Фото", "Проекты"] as const;

export function FileSortingGame({ onSuccess }: { onSuccess: () => void }) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const remaining = useMemo(
    () => initialFiles.filter((file) => !placements[file.id]),
    [placements]
  );

  function handleDrop(folder: string, fileId: string) {
    setPlacements((prev) => ({
      ...prev,
      [fileId]: folder
    }));
  }

  function check() {
    const success = initialFiles.every((file) => placements[file.id] === file.target);
    if (success) {
      setMessage("Отлично! Все файлы разложены по правильным папкам.");
      onSuccess();
    } else {
      setMessage("Почти получилось. Проверь, где должны лежать учебные файлы и фото.");
    }
  }

  function reset() {
    setPlacements({});
    setMessage("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-dashed border-border bg-white/70 p-4">
        <p className="mb-3 text-sm font-medium text-muted-foreground">Перетащи файлы в подходящие папки</p>
        <div className="flex flex-wrap gap-3">
          {remaining.map((file) => (
            <div
              key={file.id}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", file.id)}
              className="cursor-grab rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-sm"
            >
              {file.name}
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {folders.map((folder) => (
          <Card
            key={folder}
            className="min-h-48 border-dashed"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop(folder, event.dataTransfer.getData("text/plain"));
            }}
          >
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2 font-semibold">
                <FolderOpen className="h-5 w-5 text-pop-sky" />
                {folder}
              </div>
              <div className="space-y-2">
                {Object.entries(placements)
                  .filter(([, target]) => target === folder)
                  .map(([fileId]) => {
                    const file = initialFiles.find((entry) => entry.id === fileId);
                    return (
                      <div key={fileId} className="rounded-2xl bg-accent/60 px-3 py-2 text-sm font-medium">
                        {file?.name}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={check}>Проверить</Button>
        <Button variant="outline" onClick={reset} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Сбросить
        </Button>
      </div>
      {message ? <p className="text-sm font-medium text-pop-ink">{message}</p> : null}
    </div>
  );
}
