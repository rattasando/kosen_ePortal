export default function StatCard({ label, value, change, icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <p className="mt-1 text-xs font-medium text-success">{change}</p>
          )}
        </div>
        {icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-lg">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
