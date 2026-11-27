import Icon from '../Icon.jsx';

export default function SummaryCards({ items }) {
  return (
    <div className="summary-grid">
      {items.map((item) => (
        <article className="summary-card" key={item.label}>
          <div className={`summary-icon tone-${item.tone}`}><Icon name={item.icon} size={20} /></div>
          <p>{item.label}</p>
          <strong>{item.value}</strong>
          <small>{item.change}</small>
        </article>
      ))}
    </div>
  );
}
