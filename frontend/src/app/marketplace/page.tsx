"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PackageOpen, PackagePlus } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/features/marketplace/product-card";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { fetchProducts } from "@/services/products";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/types/product";

type CategoryFilter = ProductCategory | "All";

export default function MarketplacePage() {
  const { t } = useI18n();
  const [category, setCategory] = useState<CategoryFilter>("All");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", category],
    queryFn: () =>
      fetchProducts(category === "All" ? undefined : { category }),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("marketplace.title")}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {t("marketplace.desc")}
            </p>
          </div>
          <Button asChild>
            <Link href="/marketplace/create">
              <PackagePlus className="mr-1 h-4 w-4" />
              {t("marketplace.create")}
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["All", ...PRODUCT_CATEGORIES] as CategoryFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                category === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {item === "All" ? t("common.all") : t(`product.${item}`)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("marketplace.loadFail")}
            </CardContent>
          </Card>
        ) : !data || data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <PackageOpen className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {category === "All"
                  ? t("marketplace.empty")
                  : t("marketplace.emptyCategory")}
              </p>
              <Button asChild variant="outline">
                <Link href="/marketplace/create">{t("marketplace.create")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
