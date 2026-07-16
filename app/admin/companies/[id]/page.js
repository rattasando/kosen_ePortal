import CompanyDetailClient from "@/components/admin/CompanyDetailClient";

export default async function CompanyDetailPage({ params }) {
  const { id } = await params;
  return <CompanyDetailClient id={id} />;
}
