import AdminTopBar from "@/components/admin/AdminTopBar";
import NewsListClient from "@/components/admin/NewsListClient";

export default function AdminNewsPage() {
  return (
    <>
      <AdminTopBar
        title="News"
        description="จัดการและเผยแพร่ข่าวสารที่แสดงในหน้าเว็บไซต์"
      />
      <NewsListClient />
    </>
  );
}
