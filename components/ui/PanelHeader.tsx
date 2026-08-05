"use client";

import { type ReactNode } from "react";

interface PanelHeaderProps {
  title: string;
  children?: ReactNode;
}

export function PanelHeader({ title, children }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 shrink-0 panel-header">
      <span className="text-footnote font-medium text-secondary">{title}</span>
      {children && <div className="flex items-center gap-1">{children}</div>}
    </div>
  );
}
