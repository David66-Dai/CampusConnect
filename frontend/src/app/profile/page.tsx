"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, CheckCircle2, Loader2, Trophy } from "lucide-react";
import { z } from "zod";

import { AppShell } from "@/components/layout/app-shell";
import { TagInput } from "@/components/tag-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { ChangeEmailCard } from "@/features/profile/change-email-card";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { getApiErrorMessage } from "@/lib/api";
import { updateMe } from "@/services/auth";
import { fetchUploadStatus, uploadImage } from "@/services/products";
import { getInitials } from "@/utils/avatar";
import { getLevelName } from "@/utils/level";

const profileSchema = z.object({
  name: z.string().min(1, "请输入姓名").max(100),
  grade: z.string().min(1, "请输入年级").max(50),
  bio: z.string().max(2000, "最多 2000 字").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Cloudinary 未配置时隐藏上传按钮
  const { data: uploadEnabled } = useQuery({
    queryKey: ["upload-status"],
    queryFn: fetchUploadStatus,
    staleTime: 5 * 60 * 1000,
  });

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file) return;
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const url = await uploadImage(file);
      await updateMe({ avatar_url: url });
      await refreshUser();
    } catch (error) {
      setAvatarError(getApiErrorMessage(error));
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", grade: "", bio: "" },
  });

  // 用户数据就绪后填充表单
  useEffect(() => {
    if (!user) return;
    reset({
      name: user.name,
      grade: user.grade,
      bio: user.bio ?? "",
    });
    setInterests(user.interests);
    setSkills(user.skills);
    setGoals(user.goals);
  }, [user, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSaved(false);
    try {
      await updateMe({
        ...values,
        bio: values.bio || null,
        interests,
        skills,
        goals,
      });
      await refreshUser();
      // 标签变化会影响匹配与推荐结果
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      await queryClient.invalidateQueries({ queryKey: ["recommended-partners"] });
      setSaved(true);
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar className="h-20 w-20 border">
              <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.name} />
              <AvatarFallback className="text-xl">
                {user ? getInitials(user.name) : "…"}
              </AvatarFallback>
            </Avatar>
            {uploadEnabled && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition hover:text-primary"
                  aria-label="上传头像"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                />
              </>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{t("profile.title")}</h1>
            {user && (
              <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-4 w-4 text-primary" />
                Lv.{user.level} · {getLevelName(user.level)}
                <Badge variant="secondary">{user.xp} XP</Badge>
              </p>
            )}
            {avatarError && (
              <p className="mt-2 text-sm text-destructive">{avatarError}</p>
            )}
          </div>
        </div>

        <ChangeEmailCard />

        <Card>
          <CardHeader>
            <CardTitle>{t("profile.basic")}</CardTitle>
            <CardDescription>{t("profile.basicDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit} noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("profile.name")}</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">{t("profile.grade")}</Label>
                  <Input id="grade" {...register("grade")} />
                  {errors.grade && (
                    <p className="text-sm text-destructive">
                      {errors.grade.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t("profile.bio")}</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  placeholder={t("profile.bioPlaceholder")}
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("profile.interests")}</Label>
                <TagInput
                  value={interests}
                  onChange={setInterests}
                  placeholder={t("profile.tagInterests")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("profile.goals")}</Label>
                <TagInput
                  value={goals}
                  onChange={setGoals}
                  placeholder={t("profile.tagGoals")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("profile.skills")}</Label>
                <TagInput
                  value={skills}
                  onChange={setSkills}
                  placeholder={t("profile.tagSkills")}
                />
              </div>

              {serverError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {serverError}
                </p>
              )}
              {saved && (
                <p className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("profile.saved")}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("profile.saving") : t("profile.save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
