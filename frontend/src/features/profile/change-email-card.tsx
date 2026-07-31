"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api";
import { confirmEmailChange, requestEmailChange } from "@/services/auth";
import { useI18n } from "@/hooks/use-i18n";

/** 资料页：更改登录邮箱（当前密码 + 新邮箱验证码） */
export function ChangeEmailCard() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();

  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [pendingEmail, setPendingEmail] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const timer = window.setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    setSubmitting(true);
    try {
      const data = await requestEmailChange(newEmail.trim(), password);
      setPendingEmail(data?.new_email ?? newEmail.trim().toLowerCase());
      setDevCode(data?.dev_code ?? null);
      setStep("confirm");
      setCode(data?.dev_code ?? "");
      startCooldown();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await confirmEmailChange(code.trim());
      await refreshUser();
      setDone(true);
      setStep("request");
      setNewEmail("");
      setPassword("");
      setCode("");
      setDevCode(null);
      setPendingEmail("");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !password) return;
    setError(null);
    setSubmitting(true);
    try {
      const data = await requestEmailChange(
        pendingEmail || newEmail.trim(),
        password
      );
      setDevCode(data?.dev_code ?? null);
      if (data?.dev_code) setCode(data.dev_code);
      startCooldown();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("email.title")}</CardTitle>
        <CardDescription>
          {t("email.current")}
          {user?.email ?? "…"}。{t("email.desc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {done && (
          <p className="mb-4 flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {t("email.updated")}
            {user?.email}
          </p>
        )}

        {step === "request" ? (
          <form className="space-y-4" onSubmit={handleRequest}>
            <div className="space-y-2">
              <Label htmlFor="new_email">{t("email.new")}</Label>
              <Input
                id="new_email"
                type="email"
                autoComplete="email"
                placeholder="new@school.edu"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_password">{t("email.currentPassword")}</Label>
              <Input
                id="email_password"
                type="password"
                autoComplete="current-password"
                placeholder={t("email.passwordHint")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting || !newEmail || !password}>
              {submitting ? t("email.sending") : t("email.sendCode")}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleConfirm}>
            <p className="text-sm text-muted-foreground">
              {t("email.codeSent")}
              <span className="font-medium text-foreground">{pendingEmail}</span>
              {t("email.codeValid")}
            </p>
            {devCode && (
              <div className="rounded-md border border-dashed border-primary/40 bg-accent/50 p-3 text-xs">
                <p className="mb-1 font-medium text-accent-foreground">
                  {t("email.devMode")}
                </p>
                <p className="font-mono text-lg tracking-widest text-primary">{devCode}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email_code">{t("email.code")}</Label>
              <Input
                id="email_code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={t("email.codePlaceholder")}
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting || !code.trim()}>
                {submitting ? t("email.confirming") : t("email.confirm")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting || cooldown > 0}
                onClick={handleResend}
              >
                {cooldown > 0
                  ? t("email.resendIn", { s: cooldown })
                  : t("email.resend")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={submitting}
                onClick={() => {
                  setStep("request");
                  setError(null);
                  setCode("");
                  setDevCode(null);
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
