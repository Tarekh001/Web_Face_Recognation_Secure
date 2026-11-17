import EmployeeDirectoryView from '../components/EmployeeDirectoryView';

const ManageASN = () => (
  <EmployeeDirectoryView
    roleParam="asn"
    idLabel="NIP"
    totalCardTitle="Total ASN Terdaftar"
    totalCardSubtext="Termasuk ASN berstatus Admin OPD"
    identityColumnHeader="Identitas Pegawai ASN"
    roleColumnHeader="Peran & Biometrik"
    searchPlaceholder="Cari NIP, Nama, atau Instansi..."
    emptyText="Tidak ada data pegawai ASN ditemukan."
    unitLabel="pegawai ASN"
    editModalTitle="Edit Data Pegawai ASN"
  />
);

export default ManageASN;
