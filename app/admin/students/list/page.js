import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import StudentListClient from "@/components/admin/StudentListClient";

export default function StudentsListPage() {
  return (
    <>
      <AdminTopBar
        title="Students"
        description="Manage student records, profiles, and enrollment status."
      />
      <StudentListClient />
    </>
  );
}
