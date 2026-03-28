"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, UserPlus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["student", "parent", "teacher"]),
})

type FormValues = z.infer<typeof schema>

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "student",
    },
  })
  const selectedRole = useWatch({ control: form.control, name: "role" })

  async function onSubmit(values: FormValues) {
    setError("")
    setIsLoading(true)

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })

    const data = await response.json()
    setIsLoading(false)

    if (!response.ok) {
      setError(data.message || "Ошибка регистрации.")
      return
    }

    router.push("/login")
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Создать аккаунт</CardTitle>
        <CardDescription>Выбери роль и начни работу.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <FloatingInput id="name" label="Имя" autoComplete="name" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <FloatingInput id="email" label="Email" type="email" autoComplete="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <FloatingInput
              id="password"
              label="Пароль"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
          </div>
          <div className="space-y-2">
            <Label>Роль</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["student", "Ученик"],
                ["parent", "Родитель"],
                ["teacher", "Учитель"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => form.setValue("role", value as "student" | "parent" | "teacher")}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    selectedRole === value ? "border-pop-coral bg-orange-50 text-pop-coral" : "bg-white/80 text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Зарегистрироваться
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-semibold text-pop-coral">
            Войти
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
