import './StatCard.css';

interface StatCardProps {
  label: string;
  value: number;
  note?: string;
}

function StatCard({ label, value, note }: StatCardProps) {
  return (
    <div className="stat-card">
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value">{value}</p>
      {note && <p className="stat-card-note">{note}</p>}
    </div>
  );
}

export default StatCard;
