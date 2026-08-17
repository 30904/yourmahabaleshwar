const styles = {
  ACTIVE: 'admin-badge-success',
  CONFIRMED: 'admin-badge-success',
  APPROVED: 'admin-badge-success',
  PAID: 'admin-badge-success',
  PENDING: 'admin-badge-warning',
  DRAFT: 'admin-badge-neutral',
  CANCELLED: 'admin-badge-danger',
  REJECTED: 'admin-badge-danger',
  INACTIVE: 'admin-badge-neutral',
  COMPLETED: 'admin-badge-info',
};

export default function StatusBadge({ status }) {
  const key = (status || 'PENDING').toUpperCase();
  return <span className={styles[key] || 'admin-badge-neutral'}>{status}</span>;
}