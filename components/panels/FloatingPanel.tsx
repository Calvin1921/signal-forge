"use client";

import { type ReactNode, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Minimize2, Maximize2, X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

interface FloatingPanelProps {
  title: string;
  children: ReactNode;
  initialPosition?: { x: number; y: number };
  onClose?: () => void;
  width?: number;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

export function FloatingPanel({
  title,
  children,
  initialPosition = { x: 100, y: 100 },
  onClose,
  width = 300,
}: FloatingPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={constraintsRef}
        initial={{ x: initialPosition.x, y: initialPosition.y, opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={springTransition}
        className="fixed z-50 pointer-events-auto"
        style={{ width }}
      >
        <div
          className="glass rounded-[var(--radius-lg)] overflow-hidden"
        >
          {/* Header - drag handle */}
          <div className="panel-header flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing select-none">
            <span className="text-footnote font-medium text-primary">{title}</span>
            <div className="flex items-center gap-1">
              <IconButton size="sm" onClick={() => setMinimized(!minimized)}>
                {minimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              </IconButton>
              {onClose && (
                <IconButton size="sm" onClick={onClose}>
                  <X size={12} />
                </IconButton>
              )}
            </div>
          </div>
          {/* Body */}
          {!minimized && <div className="p-4">{children}</div>}
        </div>
      </motion.div>
    </>
  );
}
