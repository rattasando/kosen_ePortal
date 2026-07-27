"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/components/admin/contexts/PageTitleContext";

export default function AdminTopBar({ title, description }) {
  const { setPage } = usePageTitle();
  useEffect(() => {
    setPage({ title, description });
    return () => setPage({ title: "", description: "" });
  }, [title, description, setPage]);
  return null;
}
