import AdminTopBar from "@/components/admin/AdminTopBar";
import FaqListClient from "@/components/admin/FaqListClient";

export default function FAQPage() {
  return (
    <>
      <AdminTopBar title="FAQ" description="จัดการคำถามที่พบบ่อย สามารถเพิ่ม แก้ไข เรียงลำดับ และกำหนดสถานะการเผยแพร่ได้" />
      <FaqListClient />
    </>
  );
}
