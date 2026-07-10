import React from 'react';

export default function DashboardLayout({ sidebar, children, className = '' }) {
  return <main className={`dashboard-shell ${className}`.trim()}>{sidebar}{children}</main>;
}
