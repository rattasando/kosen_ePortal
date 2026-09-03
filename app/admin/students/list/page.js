import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import StudentListClient from "@/components/admin/StudentListClient";

export default function StudentsListPage() {
  return (
    <>
      <AdminTopBar
        title="Students"
        description="จัดการข้อมูลนักเรียน โปรไฟล์ และสถานะการลงทะเบียน"
      />
      <StudentListClient />
    </>
  );
}
