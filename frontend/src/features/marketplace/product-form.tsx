"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { getApiErrorMessage } from "@/lib/api";
import { fetchUploadStatus, uploadImage } from "@/services/products";
import { PRODUCT_CATEGORIES } from "@/types/product";

export type ProductFormValues = {
  title: string;
  description: string;
  category: (typeof PRODUCT_CATEGORIES)[number];
  price: number;
};

type ProductFormProps = {
  defaultValues?: Partial<ProductFormValues> & { image_url?: string | null };
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (
    values: ProductFormValues & { image_url: string | null }
  ) => Promise<void>;
};

/** 商品表单：发布与编辑共用 */
export function ProductForm({
  defaultValues,
  submitLabel,
  submittingLabel,
  onSubmit,
}: ProductFormProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    defaultValues?.image_url ?? null
  );
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
    defaultValues?.image_url ?? null
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: uploadEnabled } = useQuery({
    queryKey: ["upload-status"],
    queryFn: fetchUploadStatus,
    staleTime: 5 * 60 * 1000,
  });

  const productSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t("marketplace.form.errTitle")).max(200),
        description: z.string().min(1, t("marketplace.form.errDesc")).max(5000),
        category: z.enum(PRODUCT_CATEGORIES, {
          message: t("marketplace.form.errCategory"),
        }),
        price: z
          .number({ message: t("marketplace.form.errPrice") })
          .min(0, t("marketplace.form.errPriceNeg"))
          .max(99999999, t("marketplace.form.errPriceHigh")),
      }),
    [t]
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      ...defaultValues,
    },
  });

  const handleFileChange = (file: File | null) => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setExistingImageUrl(null);
    } else {
      setImagePreview(null);
      setExistingImageUrl(null);
    }
  };

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      let imageUrl = existingImageUrl;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      await onSubmit({ ...values, image_url: imageUrl });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  });

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      <div className="space-y-2">
        <Label>
          {t("marketplace.form.image")}
          {uploadEnabled === false && t("marketplace.form.imageDisabled")}
        </Label>
        {uploadEnabled === false ? (
          <p className="rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">
            {t("marketplace.form.imageHint")}
          </p>
        ) : imagePreview ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border">
            <Image
              src={imagePreview}
              alt={t("marketplace.form.imageAlt")}
              fill
              unoptimized
              className="object-cover"
            />
            <button
              type="button"
              aria-label={t("marketplace.form.imageRemove")}
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 shadow hover:bg-background"
              onClick={() => {
                handleFileChange(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm">{t("marketplace.form.imagePick")}</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">{t("marketplace.form.title")}</Label>
        <Input
          id="title"
          placeholder={t("marketplace.form.titlePh")}
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("marketplace.form.desc")}</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder={t("marketplace.form.descPh")}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("marketplace.form.category")}</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("marketplace.form.categoryPh")} />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {t(`product.${item}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">{t("marketplace.form.price")}</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step="0.01"
            placeholder={t("marketplace.form.pricePh")}
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>
      </div>

      {serverError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
