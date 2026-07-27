import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import BannerListClient from "@/components/admin/BannerListClient";

export default function BannerPage() {
  return (
    <>
      <AdminTopBar title="Banner" description="จัดการสไลด์ Banner ที่แสดงในหน้า Home" />
      <BannerListClient />
    </>
  );
}
