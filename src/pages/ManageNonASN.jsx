import EmployeeDirectoryView from '../components/EmployeeDirectoryView';

const ManageNonASN = () => (
  <EmployeeDirectoryView
    roleParam="non_asn"
    idLabel="NIK"
    totalCardTitle="Total Non-ASN"
    totalCardSubtext="Tenaga Ahli, Honorer & Magang"
    identityColumnHeader="Identitas Non-ASN (NIK)"
    roleColumnHeader="Status Biometrik"
    searchPlaceholder="Cari NIK, Nama, atau Instansi..."
    emptyText="Tidak ada data tenaga Non-ASN ditemukan."
    unitLabel="tenaga Non-ASN"
    editModalTitle="Edit Data Tenaga Non-ASN"
  />
);

export default ManageNonASN;
