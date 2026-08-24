import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import CompanyListClient from "@/components/admin/CompanyListClient";

export default function CompaniesListPage() {
  return (
    <>
      <AdminTopBar
        title="บริษัทพาร์ทเนอร์"
        description="รายชื่อบริษัทพาร์ทเนอร์ทั้งหมด — ค้นหา เพิ่ม ลบ และจัดการข้อมูล"
      />
      <div className="p-6">
        <CompanyListClient />
      </div>
    </>
  );
}
