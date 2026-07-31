"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  PRODUCT_CATEGORY_META,
  formatPrice,
} from "@/features/marketplace/constants";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

/** 商品卡片：图片、标题、价格、分类、卖家 */
export function ProductCard({ product }: { product: Product }) {
  const { t } = useI18n();
  const meta = PRODUCT_CATEGORY_META[product.category];
  const sold = product.status === "sold";
  const priceLabel =
    product.price === 0 ? t("marketplace.free") : formatPrice(product.price);

  return (
    <Link href={`/product/${product.id}`} className="block">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] bg-secondary">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={cn("object-cover", sold && "opacity-60")}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageOff className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
          <Badge
            className={cn(
              "absolute left-2 top-2 border-transparent",
              meta.className
            )}
          >
            {t(`product.${product.category}`)}
          </Badge>
          {sold && (
            <Badge
              variant="secondary"
              className="absolute right-2 top-2 bg-background/90"
            >
              {t("marketplace.sold")}
            </Badge>
          )}
        </div>
        <CardContent className="space-y-1.5 p-4">
          <p className="line-clamp-1 font-medium">{product.title}</p>
          <p className="text-lg font-semibold text-primary">{priceLabel}</p>
          <p className="truncate text-xs text-muted-foreground">
            {product.seller.name} · {product.seller.grade}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
