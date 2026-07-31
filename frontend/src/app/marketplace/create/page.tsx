"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
import { ProductForm } from "@/features/marketplace/product-form";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { createProduct } from "@/services/products";

export default function CreateProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { t } = useI18n();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/marketplace">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("marketplace.back")}
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("marketplace.create")}</CardTitle>
            <CardDescription>{t("marketplace.createDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm
              submitLabel={t("marketplace.create")}
              submittingLabel={t("marketplace.publishing")}
              onSubmit={async (values) => {
                const product = await createProduct(values);
                await queryClient.invalidateQueries({ queryKey: ["products"] });
                await refreshUser();
                router.push(`/product/${product.id}`);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
