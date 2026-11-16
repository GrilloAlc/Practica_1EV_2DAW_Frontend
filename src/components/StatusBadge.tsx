import './StatusBadge.css';

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  return <span className="status-badge">{status}</span>;
}

export default StatusBadge;
