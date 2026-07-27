import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import AdminTable from "@/components/admin/ui/AdminTable";

export default function ScholarshipPage() {
  return (
    <>
      <AdminTopBar
        title="Scholarship"
        description="Manage scholarship programs, applications, and awards."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: "Merit Scholarship", amount: "฿50,000/sem", slots: "50" },
            { name: "Industry Partner Grant", amount: "฿80,000/yr", slots: "20" },
            { name: "Need-Based Aid", amount: "฿30,000/sem", slots: "100" },
          ].map((s) => (
            <div key={s.name} className="card p-5">
              <h3 className="font-bold text-foreground">{s.name}</h3>
              <p className="mt-2 text-sm text-muted">Amount: {s.amount}</p>
              <p className="text-sm text-muted">Available slots: {s.slots}</p>
              <button className="btn-secondary mt-4 text-xs">Manage</button>
            </div>
          ))}
        </div>

        <AdminTable
          columns={["Applicant", "Scholarship", "GPA", "Status", "Award Date"]}
          rows={[
            ["Somchai Prasert", "Merit Scholarship", "3.72", "Approved", "Jun 1, 2026"],
            ["Nattaya Wong", "Industry Partner Grant", "3.85", "Approved", "Jun 1, 2026"],
            ["Pichai Srisuk", "Need-Based Aid", "2.10", "Under Review", "—"],
            ["Malee Tanaka", "Merit Scholarship", "3.91", "Approved", "Jun 1, 2026"],
          ]}
        />
      </div>
    </>
  );
}
