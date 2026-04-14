import type { ReactNode } from 'react';
import { Handle, Position } from 'reactflow';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Port = {
  id: string;
  label: string;
};

export type NodeTheme = {
  headerBg: string;
  ring: string;
  iconBg: string;
};

const handleClass =
  '!w-3 !h-3 !bg-muted-foreground !border-2 !border-background !rounded-full';

export function NodeFrame({
  title,
  icon,
  theme,
  selected,
  canDelete,
  onDelete,
  input,
  outputs,
  children,
}: {
  title: string;
  icon: ReactNode;
  theme: NodeTheme;
  selected: boolean;
  canDelete: boolean;
  onDelete?: () => void;
  input?: boolean;
  outputs: Port[];
  children: ReactNode;
}) {
  // Extra space for bottom handle rail (labels + handles).
  const bottomRail = outputs.length > 0 ? 52 : 0;
  const height = Math.max(110, 74 + bottomRail);

  return (
    <div
      className={cn(
        'relative w-[280px] rounded-xl border border-border bg-card/90 backdrop-blur shadow-sm',
        selected ? `ring-2 ${theme.ring}` : '',
      )}
      style={{ minHeight: height }}
    >
      {input && (
        <Handle
          type="target"
          position={Position.Top}
          id="in"
          className={cn(handleClass, '!top-0 !-translate-y-1/2 !translate-x-[-50%]')}
          style={{ left: '50%' }}
        />
      )}

      <div className={cn('node-drag-handle flex items-center justify-between px-3 py-2 cursor-grab rounded-t-xl', theme.headerBg)}>
        <div className="flex items-center gap-2">
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', theme.iconBg)}>
            {icon}
          </div>
          <div className="text-sm font-semibold text-white">{title}</div>
        </div>

        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="text-white/80 hover:text-white transition-colors"
            title="Delete node"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="nodrag min-w-0 max-w-full px-3 py-3 text-sm leading-snug text-foreground break-words [overflow-wrap:anywhere]">
        {children}
      </div>

      {outputs.length > 0 && (
        <div className="relative mx-3 mb-2 mt-1 min-h-11 border-t border-border/60 pt-2">
          {outputs.map((p, idx) => {
            const pct = outputs.length === 1 ? 50 : ((idx + 1) / (outputs.length + 1)) * 100;
            return (
              <div key={p.id} className="contents">
                <div
                  className="absolute max-w-[100px] whitespace-normal break-words text-center text-[10px] leading-tight text-muted-foreground select-none [overflow-wrap:anywhere]"
                  style={{
                    left: `${pct}%`,
                    transform: 'translateX(-50%)',
                    bottom: 24,
                  }}
                  title={p.label}
                >
                  {p.label}
                </div>
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id={p.id}
                  className={cn(handleClass, '!bottom-0 !translate-y-1/2 !translate-x-[-50%]')}
                  style={{ left: `${pct}%` }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
