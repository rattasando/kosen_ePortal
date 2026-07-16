import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminTable from "@/components/admin/AdminTable";

export default function DocumentsPage() {
  return (
    <>
      <AdminTopBar
        title="Documents"
        description="Review and manage student document submissions and verification."
      />
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap gap-2">
          {["All", "Pending", "Verified", "Rejected"].map((tab, i) => (
            <button
              key={tab}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                i === 0 ? "bg-primary text-white" : "bg-surface-muted text-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AdminTable
          columns={["Student", "Document Type", "Submitted", "Status", "Action"]}
          rows={[
            ["Somchai Prasert", "Transcript", "Jun 10, 2026", "Verified", "View"],
            ["Nattaya Wong", "ID Card Copy", "Jun 12, 2026", "Pending", "Review"],
            ["Pichai Srisuk", "Recommendation Letter", "Jun 14, 2026", "Pending", "Review"],
            ["Malee Tanaka", "Portfolio", "Jun 15, 2026", "Verified", "View"],
          ]}
        />
      </div>
    </>
  );
}
