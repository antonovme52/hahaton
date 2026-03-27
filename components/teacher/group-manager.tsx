"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function GroupManager({
  students
}: {
  students: Array<{
    id: string;
    user: {
      name: string;
      email: string;
    };
  }>;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/teacher/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        description,
        studentIds: selected
      })
    });

    setLoading(false);

    if (!response.ok) {
      setError("Не удалось создать группу.");
      return;
    }

    setName("");
    setDescription("");
    setSelected([]);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новая группа</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="group-name">Название</Label>
          <Input id="group-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Например, 7A Digital Lab" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="group-description">Описание</Label>
          <Textarea
            id="group-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Коротко опиши направление группы"
          />
        </div>
        <div className="space-y-3">
          <Label>Ученики</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {students.map((student) => (
              <label key={student.id} className="flex items-start gap-3 rounded-[24px] border bg-white/80 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.includes(student.id)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked ? [...current, student.id] : current.filter((item) => item !== student.id)
                    )
                  }
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-pop-ink">{student.user.name}</span>
                  <span className="text-sm text-muted-foreground">{student.user.email}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button onClick={submit} disabled={loading || name.trim().length < 2} className="gap-2">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          Создать группу
        </Button>
      </CardContent>
    </Card>
  );
}
