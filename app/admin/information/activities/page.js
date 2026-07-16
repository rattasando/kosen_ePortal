"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ActivitiesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/information/news");
  }, [router]);
  return null;
}
