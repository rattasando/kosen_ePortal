import AdminTopBar from "@/components/admin/AdminTopBar";
import UserListClient from "@/components/admin/UserListClient";

export default function UserManagementPage() {
  return (
    <>
      <AdminTopBar
        title="User Management"
        description="จัดการบัญชีผู้ใช้งาน บทบาท และสิทธิ์การเข้าถึงระบบ"
      />
      <UserListClient />
    </>
  );
}
