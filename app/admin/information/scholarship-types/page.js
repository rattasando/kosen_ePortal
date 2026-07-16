import AdminTopBar from "@/components/admin/AdminTopBar";
import ScholarshipTypesListClient from "@/components/admin/ScholarshipTypesListClient";

export default function AdminScholarshipTypesPage() {
  return (
    <>
      <AdminTopBar
        title="Scholarship Types"
        description="จัดการประเภทท ุนการศึกษาที่แสดงผลในหน้าเว็บไซต์"
      />
      <ScholarshipTypesListClient />
    </>
  );
}
