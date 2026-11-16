import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button aria-label="Página anterior" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>←</button>
      {pages.map((page) => (
        <button
          key={page}
          className={page === currentPage ? 'pagination-active' : ''}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button aria-label="Página siguiente" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>→</button>
    </div>
  );
}

export default Pagination;
