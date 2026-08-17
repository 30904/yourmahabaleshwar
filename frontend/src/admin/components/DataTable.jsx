export default function DataTable({ columns, data, emptyMessage = 'No records found', onRowClick }) {
  if (!data?.length) {
    return <div className="admin-card p-12 text-center text-slate-500">{emptyMessage}</div>;
  }

  return (
    <div className="admin-card overflow-hidden">
      <div className="admin-table-wrap overflow-x-auto theme-scrollbar">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row._id || row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}