import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import MappingListClient from "@/components/admin/MappingListClient";

export default function StudentMappingPage() {
  return (
    <>
      <AdminTopBar
        title="ใบสมัครงาน"
        description="จัดการใบสมัครและการจับคู่นักเรียนกับตำแหน่งงาน"
      />
      <div className="p-6">
        <MappingListClient />
      </div>
    </>
  );
}
