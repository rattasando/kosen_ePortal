import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import JobListClient from "@/components/admin/JobListClient";

export default function JobPositionsPage() {
  return (
    <>
      <AdminTopBar
        title="Job Positions"
        description="จัดการตำแหน่งงานและโอกาสฝึกงานสำหรับนักเรียน KOSEN"
      />
      <JobListClient />
    </>
  );
}
