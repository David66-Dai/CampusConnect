"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
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
import { getApiErrorMessage } from "@/lib/api";
import { forgotPassword } from "@/services/auth";

const schema = z.object({
  email: z.string().email("请输入有效邮箱"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const data = await forgotPassword(values.email);
      setSubmitted(true);
      // 开发环境后端直接返回重置链接，便于无邮件服务时演示
      setDevResetUrl(data?.reset_url ?? null);
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  });

  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.12),_transparent_55%)]" />
      <Card className="relative z-10 w-full max-w-md border-border/60 shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <Link href="/" className="text-sm font-medium text-primary">
            CampusConnect
          </Link>
          <CardTitle className="text-2xl tracking-tight">忘记密码</CardTitle>
          <CardDescription>
            输入注册邮箱，我们会发送重置链接（30 分钟内有效）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-center">
              <MailCheck className="mx-auto h-10 w-10 text-emerald-500" />
              <p className="text-sm text-muted-foreground">
                如果该邮箱已注册，重置链接已发送，请注意查收。
              </p>
              {devResetUrl && (
                <div className="rounded-md border border-dashed border-primary/40 bg-accent/50 p-3 text-left text-xs">
                  <p className="mb-1.5 font-medium text-accent-foreground">
                    本地演示链接（仅开发环境且未配置 SMTP 时出现）
                  </p>
                  <Link
                    href={devResetUrl}
                    className="break-all text-primary underline underline-offset-2"
                  >
                    {devResetUrl}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@school.edu"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              {serverError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {serverError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "发送中…" : "发送重置链接"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          想起密码了？
          <Link href="/login" className="ml-1 font-medium text-primary">
            返回登录
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
