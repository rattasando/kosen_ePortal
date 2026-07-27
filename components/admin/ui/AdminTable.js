export default function AdminTable({ columns, rows, onRowClick, onCellClick }) {
  const cols = columns.map((c) =>
    typeof c === "string" ? { label: c, align: "left" } : c,
  );

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              {cols.map((col, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 font-semibold text-muted ${col.align === "center" ? "text-center" : "text-left"}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                onClick={onRowClick ? () => onRowClick(i) : undefined}
                className={`border-b border-border last:border-0 hover:bg-surface-muted/50 ${onRowClick ? "cursor-pointer hover:bg-accent-soft" : ""}`}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    onClick={onCellClick ? (e) => { e.stopPropagation(); onCellClick(i, j); } : undefined}
                    className={`px-4 py-3 text-foreground ${cols[j]?.align === "center" ? "text-center" : ""} ${onCellClick ? "cursor-pointer" : ""}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
