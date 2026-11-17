import DailyAttendanceReportView from '../components/DailyAttendanceReportView';

const ReportNonAsn = () => (
  <DailyAttendanceReportView
    fixedRole="non_asn"
    totalLabel="Total Rekap Non-ASN"
    totalSubtextDefault="Tenaga Non-ASN terdaftar sesuai filter"
    personColumnTitle="Tenaga Non-ASN"
    searchLabel="Pencarian Non-ASN"
    searchPlaceholder="Cari NIK atau Nama Non-ASN..."
    emptyTitle="Tidak ada data presensi Non-ASN ditemukan"
    dataUnitLabel="data Non-ASN"
    csvFilenamePrefix="Laporan_Presensi_NonASN"
    showKegiatanShortcut={false}
  />
);

export default ReportNonAsn;
