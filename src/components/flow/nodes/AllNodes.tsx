import type { NodeProps } from 'reactflow';
import {
  Flag,
  MessageSquareText,
  ListTree,
  OctagonX,
  Split,
  MessageCircleQuestion,
  Globe,
  UserCog,
  FunctionSquare,
  Repeat,
  Star,
  WandSparkles,
  Webhook,
  LayoutList,
  MousePointerClick,
  Bot,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeFrame, type Port } from './NodeFrame';
import { nodeThemes } from './themes';
import { useFlowStore, type FlowNodeData } from '@/store/flowStore';

const getValue = (data: FlowNodeData | undefined, key: string): unknown => (data ? (data as Record<string, unknown>)[key] : undefined);

export const StartNode = (props: NodeProps) => {
  const { selected, data } = props;
  const welcomeText = (getValue(data as FlowNodeData | undefined, 'welcomeText') as string) || '';
  return (
    <NodeFrame
      title="Start"
      icon={<Flag className="w-4 h-4 text-white" />}
      theme={nodeThemes.start}
      selected={!!selected}
      canDelete={false}
      input={false}
      outputs={[{ id: 'begin', label: 'Begin' }]}
    >
      <div className="text-xs text-muted-foreground">Welcome</div>
      <div className="mt-1 text-sm break-words [overflow-wrap:anywhere]">{welcomeText || '—'}</div>
    </NodeFrame>
  );
};

export const SendMessageNode = (props: NodeProps) => {
  const { id, selected, data } = props;
  const { deleteNode } = useFlowStore();
  const text = (getValue(data as FlowNodeData | undefined, 'text') as string) || '';
  return (
    <NodeFrame
      title="Send Message"
      icon={<MessageSquareText className="w-4 h-4 text-white" />}
      theme={nodeThemes.send_message}
      selected={!!selected}
      canDelete
      onDelete={() => deleteNode(id)}
      input
      outputs={[{ id: 'out', label: 'Next' }]}
    >
      <div className="text-xs text-muted-foreground">Text</div>
      <div className="mt-1 break-words [overflow-wrap:anywhere]">{text || '—'}</div>
    </NodeFrame>
  );
};

export const InteractiveMenuNode = (props: NodeProps) => {
  const { id, selected, data } = props;
  const { deleteNode } = useFlowStore();
  const mode = (getValue(data as FlowNodeData | undefined, 'mode') as 'list' | 'buttons') || 'list';
  const body = (getValue(data as FlowNodeData | undefined, 'bodyText') as string) || '';

  const outputs: Port[] = [];
  if (mode === 'buttons') {
    const buttons = (getValue(data as FlowNodeData | undefined, 'buttons') as Array<{ id: string; title: string }> | undefined) || [];
    for (const b of buttons) outputs.push({ id: `btn:${b.id}`, label: b.title || 'Button' });
  } else {
    const sections =
      (getValue(data as FlowNodeData | undefined, 'sections') as Array<{ title: string; rows: Array<{ id: string; title: string }> }> | undefined) || [];
    for (const s of sections) {
      for (const r of s.rows || []) outputs.push({ id: `row:${r.id}`, label: r.title || 'Row' });
    }
  }
  outputs.push({ id: 'fallback', label: 'Fallback' });

  return (
    <NodeFrame
      title="Interactive Menu"
      icon={<ListTree className="w-4 h-4 text-white" />}
      theme={nodeThemes.interactive_menu}
      selected={!!selected}
      canDelete
      onDelete={() => deleteNode(id)}
      input
      outputs={outputs.length ? outputs : [{ id: 'fallback', label: 'Fallback' }]}
    >
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mode</div>
        <div
          className={cn(
            'inline-flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium shadow-sm',
            mode === 'list'
              ? 'border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-purple-500/10 text-violet-900 dark:text-violet-100'
              : 'border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-950 dark:text-amber-100',
          )}
        >
          {mode === 'list' ? (
            <LayoutList className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          ) : (
            <MousePointerClick className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          )}
          <span className="min-w-0 flex-1 break-words leading-snug">
            {mode === 'list' ? 'List message (sections & rows)' : 'Quick reply buttons (max 3)'}
          </span>
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">Body</div>
      <div className="mt-1 break-words [overflow-wrap:anywhere]">{body || '—'}</div>
    </NodeFrame>
  );
};

export const EndFlowNode = (props: NodeProps) => {
  const { id, selected, data } = props;
  const { deleteNode } = useFlowStore();
  const closing = (getValue(data as FlowNodeData | undefined, 'closingText') as string) || '';
  return (
    <NodeFrame
      title="End Flow"
      icon={<OctagonX className="w-4 h-4 text-white" />}
      theme={nodeThemes.end_flow}
      selected={!!selected}
      canDelete
      onDelete={() => deleteNode(id)}
      input
      outputs={[]}
    >
      <div className="text-xs text-muted-foreground">Closing</div>
      <div className="mt-1 break-words [overflow-wrap:anywhere]">{closing || '—'}</div>
    </NodeFrame>
  );
};

export const ConditionNode = (props: NodeProps) => {
  const { id, selected, data } = props;
  const { deleteNode } = useFlowStore();
  const variable = (getValue(data as FlowNodeData | undefined, 'variable') as string) || '';
  const op = (getValue(data as FlowNodeData | undefined, 'operator') as string) || '==';
  const value = (getValue(data as FlowNodeData | undefined, 'value') as string) || '';
  return (
    <NodeFrame
      title="Condition"
      icon={<Split className="w-4 h-4 text-white" />}
      theme={nodeThemes.condition}
      selected={!!selected}
      canDelete
      onDelete={() => deleteNode(id)}
      input
      outputs={[
        { id: 'true', label: 'True' },
        { id: 'false', label: 'False' },
      ]}
    >
      <div className="text-xs text-muted-foreground">Rule</div>
      <div className="mt-1 break-words font-mono text-sm [overflow-wrap:anywhere]">{`${variable || '{{var}}'} ${op} ${value || '…'}`}</div>
    </NodeFrame>
  );
};

export const AskInputNode = (props: NodeProps) => {
  const { id, selected, data } = props;
  const { deleteNode } = useFlowStore();
  const question = (getValue(data as FlowNodeData | undefined, 'questionText') as string) || '';
  const saveTo = (getValue(data as FlowNodeData | undefined, 'variableName') as string) || '';
  return (
    <NodeFrame
      title="Ask User Input"
      icon={<MessageCircleQuestion className="w-4 h-4 text-white" />}
      theme={nodeThemes.ask_input}
      selected={!!selected}
      canDelete
      onDelete={() => deleteNode(id)}
      input
      outputs={[{ id: 'answer', label: 'Got Answer' }]}
    >
      <div className="text-xs text-muted-foreground">Question</div>
      <div className="mt-1 break-words [overflow-wrap:anywhere]">{question || '—'}</div>
      <div className="mt-2 text-xs text-muted-foreground">Save to</div>
      <div className="mt-1 font-mono text-sm">{saveTo ? `{{${saveTo}}}` : '—'}</div>
    </NodeFrame>
  );
};

export const ApiCallNode = (props: NodeProps) => {
  const { id, selected, data } = props;
  const { deleteNode } = useFlowStore();
  const method = (getValue(data as FlowNodeData | undefined, 'method') as string) || 'GET';
  const url = (getValue(data as FlowNodeData | undefined, 'url') as string) || '';
  const mappings = (getValue(data as FlowNodeData | undefined, 'mappings') as Array<{ id: string; label: string }> | undefined) || [];
  const extracts =
    (getValue(data as FlowNodeData | undefined, 'responseExtracts') as Array<{ jsonPath: string; variableName: string }> | undefined) || [];
  const extractCount = extracts.filter((x) => (x.jsonPath || '').trim() && (x.variableName || '').trim()).length;

  const outputs: Port[] = [
    { id: 'success', label: 'Success' },
    ...mappings.map((m) => ({ id: `map:${m.id}`, label: m.label || 'Mapping' })),
    { id: 'error', label: 'Error' },
  ];

  return (
    <NodeFrame
      title="API Call"
      icon={<Webhook className="w-4 h-4 text-white" />}
      theme={nodeThemes.api_call}
      selected={!!selected}
      canDelete
      onDelete={() => deleteNode(id)}
      input
      outputs={outputs}
    >
      <div className="text-xs text-muted-foreground">Request</div>
      <div className="mt-1 break-all font-mono text-sm [overflow-wrap:anywhere]">
        <span className="font-semibold text-foreground/90">{method}</span> {url || '—'}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">Branch rules</div>
      <div className="mt-1 text-sm">{mappings.length}</div>
      <div className="mt-2 text-xs text-muted-foreground">Save fields → vars</div>
      <div className="mt-1 text-sm">{extractCount}</div>
    </NodeFrame>
  );
};

export const AiReplyNode = (props: NodeProps) => {
  const { id, selected, data } = props;
  const { deleteNode } = useFlowStore();
  const tone = (getValue(data as FlowNodeData | undefined, 'tone') as string) || 'helpful';
  const lang = (getValue(data as FlowNodeData | undefined, 'language') as string) || 'auto';
  return (
    <NodeFrame
      title="AI Reply"
      icon={<WandSparkles className="w-4 h-4 text-white" />}
      theme={nodeThemes.ai_reply}
      selected={!!selected}
      canDelete
      onDelete={() => deleteNode(id)}
      input
      outputs={[{ id: 'replied', label: 'Replied' }]}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Tone</span>
        <span className="capitalize">{tone}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
        <span>Language</span>
        <span className="uppercase">{lang}</span>
      </div>
    </NodeFrame>
  );
};

export const SwitchLanguageNode = (props: NodeProps) => {
  const { id, selected, data } = props;
  const { deleteNode } = useFlowStore();
  const language = (getValue(data as FlowNodeData | undefined, 'language') as string) || 'EN';
  return (
    <NodeFrame
      title="Switch Language"
      icon={<Globe className="w-4 h-4 text-white" />}
      theme={nodeThemes.switch_language}
      selected={!!selected}
      canDelete
      onDelete={() => deleteNode(id)}
      input
      outputs={[{ id: 'out', label: 'Next' }]}
    >
      <div className="text-xs text-muted-foreground">Language</div>
      <div className="mt-1 font-mono text-sm">{language}</div>
    </NodeFrame>
  );
};

export const SwitchModeNode = (props: NodeProps) => {
  const { id, selected, data } = props;
  const { deleteNode } = useFlowStore();
  const mode = (getValue(data as FlowNodeData | undefined, 'mode') as string) || 'manual';
  const revertMin = (getValue(data as FlowNodeData | undefined, 'autoRevertMinutes') as number) || 0;
  return (
    <NodeFrame
      title="Switch Mode"
      icon={<UserCog className="w-4 h-4 text-white" />}
      theme={nodeThemes.switch_mode}
      selected={!!selected}
      canDelete
      onDelete={() => deleteNode(id)}
      input
      outputs={[{ id: 'out', label: 'Next' }]}
    >
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Routing mode</div>
        <div
          className={cn(
            'inline-flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium shadow-sm',
            mode === 'auto'
              ? 'border-teal-500/40 bg-gradient-to-r from-teal-500/15 to-cyan-500/10 text-teal-950 dark:text-teal-100'
              : 'border-rose-500/40 bg-gradient-to-r from-rose-500/15 to-red-500/10 text-rose-950 dark:text-rose-100',
          )}
        >
          {mode === 'auto' ? (
            <Bot className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          ) : (
            <UserRound className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          )}
          <span className="min-w-0 flex-1 break-words leading-snug">
            {mode === 'auto' ? 'Auto — flow runs on each message' : 'Manual — agent-only; flow pauses'}
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>Auto-revert</span>
        <span className="break-words font-medium text-foreground">{revertMin ? `${revertMin} min` : 'Never'}</span>
      </div>
    </NodeFrame>
  );
};

export const SystemFunctionNode = (props: NodeProps) => {
  const { id, selected, data } = props;
  const { deleteNode } = useFlowStore();
  const fn = (getValue(data as FlowNodeData | undefined, 'functionName') as string) || 'track_order';
  return (
    <NodeFrame
      title="System Function"
      icon={<FunctionSquare className="w-4 h-4 text-white" />}
      theme={nodeThemes.system_function}
      selected={!!selected}
      canDelete
      onDelete={() => deleteNode(id)}
      input
      outputs={[
        { id: 'success', label: 'Success' },
        { id: 'error', label: 'Error' },
      ]}
    >
      <div className="text-xs text-muted-foreground">Function</div>
      <div className="mt-1 font-mono text-sm">{fn}</div>
    </NodeFrame>
  );
};

export const LoopGotoNode = (props: NodeProps) => {
  const { id, selected, data } = props;
  const { deleteNode } = useFlowStore();
  const target = (getValue(data as FlowNodeData | undefined, 'targetNodeId') as string) || '';
  return (
    <NodeFrame
      title="Loop / Goto"
      icon={<Repeat className="w-4 h-4 text-white" />}
      theme={nodeThemes.loop_goto}
      selected={!!selected}
      canDelete
      onDelete={() => deleteNode(id)}
      input
      outputs={[]}
    >
      <div className="text-xs text-muted-foreground">Target</div>
      <div className="mt-1 font-mono text-sm">{target || '—'}</div>
      <div className="mt-2 text-xs text-muted-foreground">Resumes on next message</div>
    </NodeFrame>
  );
};

export const RateServiceTemplateNode = (props: NodeProps) => {
  const { id, selected, data } = props;
  const { deleteNode } = useFlowStore();
  const hours = (getValue(data as FlowNodeData | undefined, 'replyWindowHours') as number) || 24;
  const phoneVar = (getValue(data as FlowNodeData | undefined, 'phoneVariable') as string) || 'phone';
  const orderVar = (getValue(data as FlowNodeData | undefined, 'orderNumberVariable') as string) || 'order_number';
  return (
    <NodeFrame
      title="Rate Service Template"
      icon={<Star className="w-4 h-4 text-white" />}
      theme={nodeThemes.rate_service_template}
      selected={!!selected}
      canDelete
      onDelete={() => deleteNode(id)}
      input
      outputs={[{ id: 'sent', label: 'Sent' }]}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Window</span>
        <span>{hours}h</span>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">Phone var</div>
      <div className="mt-1 font-mono text-sm">{`{{${phoneVar}}}`}</div>
      <div className="mt-2 text-xs text-muted-foreground">Order var</div>
      <div className="mt-1 font-mono text-sm">{`{{${orderVar}}}`}</div>
    </NodeFrame>
  );
};

