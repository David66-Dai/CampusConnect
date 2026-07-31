"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/features/marketplace/product-form";
import { useI18n } from "@/hooks/use-i18n";
import { fetchProductDetail, updateProduct } from "@/services/products";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProductDetail(productId),
    enabled: Number.isFinite(productId),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/product/${productId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("marketplace.backDetail")}
          </Link>
        </Button>

        {isLoading || !product ? (
          <Skeleton className="h-96 w-full" />
        ) : !product.is_seller ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              {t("marketplace.editForbidden")}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("marketplace.edit")}</CardTitle>
              <CardDescription>{t("marketplace.editDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductForm
                defaultValues={{
                  title: product.title,
                  description: product.description,
                  category: product.category,
                  price: product.price,
                  image_url: product.image_url,
                }}
                submitLabel={t("marketplace.save")}
                submittingLabel={t("marketplace.saving")}
                onSubmit={async (values) => {
                  const updated = await updateProduct(productId, values);
                  queryClient.setQueryData(["product", productId], updated);
                  await queryClient.invalidateQueries({ queryKey: ["products"] });
                  router.push(`/product/${productId}`);
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
