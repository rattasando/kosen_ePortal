import AdminTopBar from "@/components/admin/AdminTopBar";
import DocumentListClient from "@/components/admin/DocumentListClient";

export default function AdminDocumentsPage() {
  return (
    <>
      <AdminTopBar
        title="Documents"
        description="จัดการเอกสาร ประกาศ แบบฟอร์ม และหนังสือเวียนที่แสดงในหน้าเว็บไซต์"
      />
      <DocumentListClient />
    </>
  );
}
