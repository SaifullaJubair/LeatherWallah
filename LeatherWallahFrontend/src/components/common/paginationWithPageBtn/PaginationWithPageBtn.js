"use client";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const PaginationWithPageBtn = ({ rows, page, setPage, setRows, totalData }) => {
  const lastPage = Math.ceil(totalData / rows);
  if (lastPage <= 1) return null;

  const getPages = () => {
    const pages = [];
    const delta = 2;
    const left = page - delta;
    const right = page + delta;

    for (let i = 1; i <= lastPage; i++) {
      if (i === 1 || i === lastPage || (i >= left && i <= right)) {
        pages.push(i);
      }
    }

    const withEllipsis = [];
    let prev = null;
    for (const p of pages) {
      if (prev && p - prev > 1) withEllipsis.push("...");
      withEllipsis.push(p);
      prev = p;
    }
    return withEllipsis;
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Prev */}
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${
          page === 1
            ? "border-gray-100 text-gray-300 cursor-not-allowed bg-white"
            : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 bg-white"
        }`}
      >
        <FiChevronLeft size={15} />
      </button>

      {/* Page numbers */}
      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium border transition-all ${
              page === p
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary hover:bg-primary/5"
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => setPage(page + 1)}
        disabled={page === lastPage}
        className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${
          page === lastPage
            ? "border-gray-100 text-gray-300 cursor-not-allowed bg-white"
            : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 bg-white"
        }`}
      >
        <FiChevronRight size={15} />
      </button>
    </div>
  );
};

export default PaginationWithPageBtn;
