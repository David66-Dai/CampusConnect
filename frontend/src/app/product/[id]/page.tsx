"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ImageOff,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PRODUCT_CATEGORY_META,
  formatPrice,
} from "@/features/marketplace/constants";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  deleteProduct,
  fetchProductDetail,
  markProductSold,
} from "@/services/products";
import { getInitials } from "@/utils/avatar";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProductDetail(productId),
    enabled: Number.isFinite(productId),
  });

  const soldMutation = useMutation({
    mutationFn: () => markProductSold(productId),
    onSuccess: async (updated) => {
      setActionError(null);
      queryClient.setQueryData(["product", productId], updated);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => setActionError(getApiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/marketplace");
    },
    onError: (error) => setActionError(getApiErrorMessage(error)),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  if (isError || !product) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-muted-foreground">商品不存在或加载失败</p>
              <Button asChild variant="outline">
                <Link href="/marketplace">返回市场</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const meta = PRODUCT_CATEGORY_META[product.category];
  const sold = product.status === "sold";

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/marketplace">
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回市场
          </Link>
        </Button>

        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-[4/3] bg-secondary md:aspect-auto md:min-h-[360px]">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={cn("object-cover", sold && "opacity-60")}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageOff className="h-10 w-10 text-muted-foreground/40" />
                </div>
              )}
              {sold && (
                <Badge className="absolute left-3 top-3 bg-background/90 text-foreground">
                  已卖掉
                </Badge>
              )}
            </div>

            <CardContent className="flex flex-col gap-4 p-6">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn("border-transparent", meta.className)}>
                    {meta.label}
                  </Badge>
                  {sold && <Badge variant="secondary">已卖掉</Badge>}
                  {product.is_seller && (
                    <Badge variant="outline">我发布的</Badge>
                  )}
                </div>
                <h1 className="text-2xl font-semibold leading-snug">
                  {product.title}
                </h1>
                <p className="text-3xl font-semibold text-primary">
                  {formatPrice(product.price)}
                </p>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                发布于 {formatDateTime(product.created_at)}
              </p>

              <Separator />

              <div className="flex-1">
                <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                  商品描述
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Link
                  href={`/users/${product.seller.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md transition-opacity hover:opacity-80"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={product.seller.avatar_url ?? undefined}
                      alt={product.seller.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-sm text-primary">
                      {getInitials(product.seller.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium">{product.seller.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {product.seller.grade}
                    </p>
                  </div>
                </Link>
                {!product.is_seller && (
                  <Button size="sm" asChild>
                    <Link href={`/messages?user=${product.seller.id}`}>
                      <MessageCircle className="mr-1 h-4 w-4" />
                      联系卖家
                    </Link>
                  </Button>
                )}
              </div>

              {product.is_seller && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/product/${product.id}/edit`}>
                      <Pencil className="mr-1 h-4 w-4" />
                      编辑
                    </Link>
                  </Button>
                  {!sold && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={soldMutation.isPending}
                      onClick={() => {
                        if (window.confirm("确定标记为已卖掉吗？商品将从市场列表中隐藏。")) {
                          soldMutation.mutate();
                        }
                      }}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      {soldMutation.isPending ? "处理中…" : "卖掉了"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm("确定删除商品吗？此操作不可恢复。")) {
                        deleteMutation.mutate();
                      }
                    }}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {deleteMutation.isPending ? "删除中…" : "删除"}
                  </Button>
                </div>
              )}

              {actionError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {actionError}
                </p>
              )}

              <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
                线下交易请选择校内公共场所，注意财物安全。
              </p>
            </CardContent>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
