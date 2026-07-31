import Image from "next/image";

import { cn } from "@/lib/utils";

/** 导航栏品牌图标（自定义 CampusConnect icon） */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand-icon.png"
      alt="CampusConnect"
      width={20}
      height={20}
      className={cn("h-5 w-5 rounded-md", className)}
      priority
    />
  );
}
