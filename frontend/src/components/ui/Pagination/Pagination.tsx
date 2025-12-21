import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../Button';
import styles from './Pagination.module.css';

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalItems);

  const handleFirstPage = () => onPageChange(0);
  const handlePreviousPage = () => onPageChange(Math.max(0, page - 1));
  const handleNextPage = () => onPageChange(Math.min(totalPages - 1, page + 1));
  const handleLastPage = () => onPageChange(totalPages - 1);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={styles.pagination}>
      <div className={styles.info}>
        <span>
          Showing {startItem}-{endItem} of {totalItems}
        </span>
        {onPageSizeChange && (
          <div className={styles.pageSize}>
            <label htmlFor="page-size">Items per page:</label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={styles.select}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <Button
          variant="secondary"
          onClick={handleFirstPage}
          disabled={page === 0}
          title="First page"
        >
          <ChevronsLeft size={18} />
        </Button>
        <Button
          variant="secondary"
          onClick={handlePreviousPage}
          disabled={page === 0}
          title="Previous page"
        >
          <ChevronLeft size={18} />
        </Button>

        <div className={styles.pageNumbers}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i;
            } else if (page < 3) {
              pageNum = i;
            } else if (page > totalPages - 4) {
              pageNum = totalPages - 5 + i;
            } else {
              pageNum = page - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? 'primary' : 'secondary'}
                onClick={() => onPageChange(pageNum)}
                className={styles.pageButton}
              >
                {pageNum + 1}
              </Button>
            );
          })}
        </div>

        <Button
          variant="secondary"
          onClick={handleNextPage}
          disabled={page >= totalPages - 1}
          title="Next page"
        >
          <ChevronRight size={18} />
        </Button>
        <Button
          variant="secondary"
          onClick={handleLastPage}
          disabled={page >= totalPages - 1}
          title="Last page"
        >
          <ChevronsRight size={18} />
        </Button>
      </div>
    </div>
  );
}

