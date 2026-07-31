"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api";
import { resetPassword } from "@/services/auth";

const schema = z
  .object({
    password: z.string().min(6, "密码至少 6 位").max(128),
    confirm: z.string().min(1, "请再次输入密码"),
  })
  .refine((values) => values.password === values.confirm, {
    message: "两次输入的密码不一致",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await resetPassword(token, values.password);
      setDone(true);
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  });

  if (!token) {
    return (
      <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
        链接缺少重置凭证，请重新从「忘记密码」页面发起申请。
      </p>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <p className="text-sm text-muted-foreground">
          密码已重置，请使用新密码登录。
        </p>
        <Button className="w-full" asChild>
          <Link href="/login">去登录</Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">新密码</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="至少 6 位"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">确认新密码</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="再次输入"
          {...register("confirm")}
        />
        {errors.confirm && (
          <p className="text-sm text-destructive">{errors.confirm.message}</p>
        )}
      </div>
      {serverError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "重置中…" : "重置密码"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.12),_transparent_55%)]" />
      <Card className="relative z-10 w-full max-w-md border-border/60 shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <Link href="/" className="text-sm font-medium text-primary">
            CampusConnect
          </Link>
          <CardTitle className="text-2xl tracking-tight">重置密码</CardTitle>
          <CardDescription>设置一个新密码</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary">
            返回登录
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
