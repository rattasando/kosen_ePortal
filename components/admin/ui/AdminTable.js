export default function AdminTable({ columns, rows, onRowClick, onCellClick }) {
  const cols = columns.map((c) =>
    typeof c === "string" ? { label: c, align: "left" } : c,
  );

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            {cols.map((col, i) =>
              col.width ? <col key={i} style={{ width: col.width }} /> : <col key={i} />
            )}
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              {cols.map((col, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 font-semibold text-muted ${col.align === "center" ? "text-center" : "text-left"}${col.noWrap ? " whitespace-nowrap" : ""}`}
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
                    onClick={onCellClick ? (e) => onCellClick(e, i, j) : undefined}
                    className={`px-4 py-3 text-foreground ${cols[j]?.align === "center" ? "text-center" : ""}`}
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
