import Link from "next/link";

/** Link-based pager for server-paginated admin lists (preserves the ?status= filter). */
export function AdminPager({
  page,
  totalPages,
  total,
  size,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  total: number;
  size: number;
  basePath: string;
  params?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;
  const from = page * size + 1;
  const to = Math.min((page + 1) * size, total);

  const href = (p: number) => {
    const qs = new URLSearchParams(params);
    qs.set("page", String(p));
    return `${basePath}?${qs.toString()}`;
  };

  return (
    <div className="pager">
      <span className="info">
        {from}–{to} of {total}
      </span>
      <div className="pg-btns">
        {page > 0 && (
          <Link className="pg-btn" href={href(page - 1)} aria-label="Previous page">
            ‹
          </Link>
        )}
        {Array.from({ length: totalPages }, (_, i) => (
          <Link key={i} className={`pg-btn${i === page ? " is-active" : ""}`} href={href(i)}>
            {i + 1}
          </Link>
        ))}
        {page < totalPages - 1 && (
          <Link className="pg-btn" href={href(page + 1)} aria-label="Next page">
            ›
          </Link>
        )}
      </div>
    </div>
  );
}
