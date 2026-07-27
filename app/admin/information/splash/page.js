import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import SplashConfigClient from "@/components/admin/SplashConfigClient";

export default function SplashPage() {
  return (
    <>
      <AdminTopBar
        title="Splash"
        description="ตั้งค่า Popup ที่แสดงในหน้า Home เช่น ประกาศ โปรโมชัน หรือกิจกรรมพิเศษ"
      />
      <SplashConfigClient />
    </>
  );
}
