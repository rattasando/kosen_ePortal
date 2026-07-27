import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import MappingListClient from "@/components/admin/MappingListClient";

export default function StudentMappingPage() {
  return (
    <>
      <AdminTopBar
        title="Applications"
        description="จัดการใบสมัครและการจับคู่นักเรียนกับตำแหน่งงาน"
      />
      <MappingListClient />
    </>
  );
}
