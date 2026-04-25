import type { ReactNode } from "react";

interface Props {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="empty-state-title">{title}</p>
      {subtitle && <p className="empty-state-sub">{subtitle}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
