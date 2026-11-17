import DailyAttendanceReportView from '../components/DailyAttendanceReportView';

const ReportAsn = () => (
  <DailyAttendanceReportView
    fixedRole="asn"
    totalLabel="Total Rekap ASN"
    totalSubtextDefault="Pegawai ASN & Admin OPD terdaftar"
    personColumnTitle="Pegawai ASN"
    searchLabel="Pencarian ASN"
    searchPlaceholder="Cari NIP atau Nama ASN..."
    emptyTitle="Tidak ada data presensi ASN ditemukan"
    dataUnitLabel="data ASN"
    csvFilenamePrefix="Laporan_Presensi_ASN"
    showKegiatanShortcut={false}
  />
);

export default ReportAsn;
