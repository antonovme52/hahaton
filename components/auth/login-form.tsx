"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, LogIn } from "lucide-react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setError("")
    setIsLoading(true)

    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      setError("Неверный email или пароль.")
      return
    }

    router.refresh()
    router.push("/dashboard")
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Вход в платформу</CardTitle>
        <CardDescription>Войди и продолжай обучение.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <FloatingInput id="email" label="Email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-sm text-red-500">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <FloatingInput
              id="password"
              label="Пароль"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? <p className="text-sm text-red-500">{form.formState.errors.password.message}</p> : null}
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Войти
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link href="/register" className="font-semibold text-pop-coral">
            Зарегистрироваться
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
