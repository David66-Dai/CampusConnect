"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api";
import { createPost } from "@/services/posts";
import { fetchUploadStatus, uploadImage } from "@/services/products";
import { getInitials } from "@/utils/avatar";

const MAX_CONTENT_LENGTH = 5000;

/** 发帖器：文字 + 可选图片 */
export function PostComposer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: uploadEnabled } = useQuery({
    queryKey: ["upload-status"],
    queryFn: fetchUploadStatus,
    staleTime: 5 * 60 * 1000,
  });

  const handleFileChange = (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      await createPost({ content: trimmed, image_url: imageUrl });
      setContent("");
      handleFileChange(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-sm text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <Textarea
            rows={3}
            maxLength={MAX_CONTENT_LENGTH}
            placeholder="分享校园生活、提问求助、找搭子…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {imagePreview && (
          <div className="relative ml-13 aspect-video max-w-md overflow-hidden rounded-lg border sm:ml-[52px]">
            <Image
              src={imagePreview}
              alt="预览"
              fill
              unoptimized
              className="object-cover"
            />
            <button
              type="button"
              aria-label="移除图片"
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 shadow hover:bg-background"
              onClick={() => {
                handleFileChange(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between pl-[52px]">
          {uploadEnabled ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="mr-1 h-4 w-4" />
              图片
            </Button>
          ) : (
            <span />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          <Button
            size="sm"
            disabled={!content.trim() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "发布中…" : "发布"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
