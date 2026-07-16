import AdminTopBar from "@/components/admin/AdminTopBar";
import InternshipListClient from "@/components/admin/InternshipListClient";

export default function InternshipTrackingPage() {
  return (
    <>
      <AdminTopBar
        title="Internships"
        description="ติดตามความคืบหน้าการฝึกงานของนักเรียน"
      />
      <InternshipListClient />
    </>
  );
}
