import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminTable from "@/components/admin/AdminTable";

export default function AcademicTrackingPage() {
  return (
    <>
      <AdminTopBar
        title="Academic Tracking"
        description="Monitor student grades, course progress, and academic standing."
      />
      <div className="space-y-6 p-6">
        <div className="admin-stat-grid">
          {[
            { label: "Average GPA", value: "3.42" },
            { label: "On Probation", value: "28" },
            { label: "Dean's List", value: "186" },
            { label: "Courses Completed", value: "94%" },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <p className="text-sm text-muted">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <AdminTable
          columns={["Student", "Semester", "Credits", "GPA", "Standing"]}
          rows={[
            ["Somchai Prasert", "2026/1", "18", "3.72", "Good Standing"],
            ["Nattaya Wong", "2026/1", "18", "3.85", "Dean's List"],
            ["Pichai Srisuk", "2026/1", "15", "2.10", "Probation"],
            ["Malee Tanaka", "2026/1", "21", "3.91", "Dean's List"],
          ]}
        />
      </div>
    </>
  );
}
