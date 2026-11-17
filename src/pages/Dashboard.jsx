import DailyAttendanceReportView from '../components/DailyAttendanceReportView';

const Dashboard = () => (
  <DailyAttendanceReportView
    fixedRole=""
    totalLabel="Total Rekap Presensi"
    totalSubtextDefault="Seluruh ASN & Non-ASN"
    personColumnTitle="Pegawai"
    searchLabel="Pencarian Pegawai"
    searchPlaceholder="Cari NIP, NIK, atau Nama..."
    emptyTitle="Tidak ada data presensi ditemukan"
    dataUnitLabel="data"
    csvFilenamePrefix="Laporan_Presensi"
    showKegiatanShortcut
  />
);

export default Dashboard;
