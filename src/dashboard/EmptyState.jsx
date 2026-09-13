import MascotCard from '../components/MascotCard';

export function EmptyState({ title, message, actionLabel, onAction, showMascot = true }) {
  return <div className="empty-state">{showMascot ? <MascotCard character="janna" mood="encouraging" size="sm" message="Belum ada rekod lagi. Jom mula sedikit demi sedikit." /> : null}<b>{title}</b><p>{message}</p>{actionLabel && onAction && <button type="button" className="secondary" onClick={onAction}>{actionLabel}</button>}</div>;
}
