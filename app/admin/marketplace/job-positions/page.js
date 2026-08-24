import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import JobListClient from "@/components/admin/JobListClient";

export default function JobPositionsPage() {
  return (
    <>
      <AdminTopBar
        title="ตำแหน่งงาน"
        description="จัดการตำแหน่งงานและโอกาสฝึกงานสำหรับนักเรียน KOSEN"
      />
      <div className="p-6">
        <JobListClient />
      </div>
    </>
  );
}
