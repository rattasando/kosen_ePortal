import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import ContactListClient from "@/components/admin/ContactListClient";

export default function AdminContactPage() {
  return (
    <>
      <AdminTopBar title="Contact Us" description="จัดการข้อมูลติดต่อ มหาวิทยาลัยพาร์ทเนอร์ และโซเชียลมีเดีย" />
      <ContactListClient />
    </>
  );
}
