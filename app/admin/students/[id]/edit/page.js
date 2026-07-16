"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditRedirect() {
    const { id } = useParams();
    const router = useRouter();

    useEffect(() => {
        router.replace(`/admin/students/${id}?edit=1`);
    }, [id]);

    return null;
}
