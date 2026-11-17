import { useEffect, useId } from 'react';
import Swal from 'sweetalert2';
import {
  AlertTriangle,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const useModalEscape = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
};

export const ErrorBanner = ({ message, onRetry }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center text-red-700 shrink-0">
          <AlertTriangle size={18} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-900">Gagal Memuat Data</p>
          <p className="text-xs text-red-800 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-white hover:bg-red-100 text-red-800 border border-red-400 text-xs font-bold transition-colors shrink-0"
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Muat Ulang</span>
        </button>
      )}
    </div>
  );
};

export const TableLoadingRow = ({ colSpan, label = 'Memuat data dari server...' }) => (
  <tr>
    <td colSpan={colSpan} className="py-16 px-4 text-center">
      <div className="flex flex-col items-center justify-center gap-2.5" role="status" aria-live="polite">
        <Loader2 size={26} className="animate-spin text-blue-700" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
    </td>
  </tr>
);

export const TableErrorRow = ({ colSpan, message, onRetry }) => (
  <tr>
    <td colSpan={colSpan} className="py-14 px-4 text-center">
      <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto" role="alert">
        <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
          <AlertTriangle size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">Data Tidak Dapat Dimuat</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {message || 'Terjadi kendala komunikasi dengan server presensi. Periksa koneksi jaringan lalu coba kembali.'}
          </p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="gov-btn-primary text-xs"
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>Coba Lagi</span>
          </button>
        )}
      </div>
    </td>
  </tr>
);

/**
 * Bilah Paginasi Standar untuk menyeragamkan tinggi, kontrol baris, dan navigasi
 * pada seluruh tabel data di menu Konfigurasi maupun halaman pelaporan.
 */
export const TablePaginationBar = ({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  unitLabel = 'data',
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const selectId = useId();
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems > 0 ? (safePage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(safePage * itemsPerPage, totalItems);

  return (
    <div className="px-5 py-3.5 border-t border-slate-200/90 bg-slate-50/75 flex flex-wrap justify-between items-center gap-4 min-h-[64px]">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-slate-700 font-medium tabular-nums">
          Menampilkan <span className="font-bold text-slate-900">{startItem}</span> s.d.{' '}
          <span className="font-bold text-slate-900">{endItem}</span> dari{' '}
          <span className="font-bold text-slate-900">{totalItems}</span> {unitLabel}
        </p>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-300">
            <label htmlFor={selectId} className="text-xs text-slate-700 font-semibold">
              Baris per halaman:
            </label>
            <select
              id={selectId}
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="min-h-[44px] bg-white border border-slate-500 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-2 tabular-nums shadow-soft-xs hover:border-slate-700 focus:border-blue-700"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange && onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          aria-label="Halaman sebelumnya"
          className="gov-btn-secondary px-3 py-2 text-xs"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          <span>Sebelumnya</span>
        </button>

        <span className="min-h-[44px] inline-flex items-center px-3.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 tabular-nums">
          Hal. {safePage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange && onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          aria-label="Halaman berikutnya"
          className="gov-btn-secondary px-3 py-2 text-xs"
        >
          <span>Berikutnya</span>
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export const notifyAlert = ({ icon = 'info', title, text, timer }) =>
  Swal.fire({
    icon,
    title,
    text,
    timer,
    showConfirmButton: !timer,
    confirmButtonColor: '#1D4ED8',
    confirmButtonText: 'Tutup',
  });

export const confirmAction = async ({
  title,
  text,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  isDanger = true,
}) => {
  const res = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: isDanger ? '#B91C1C' : '#1D4ED8',
    cancelButtonColor: '#475569',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return res.isConfirmed;
};
