import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  type Edge,
  type Node,
  type OnConnect,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from 'sonner';
import {
  Save,
  Loader2,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFlowStore, type FlowNodeData, type FlowNodeType } from '@/store/flowStore';
import InspectorPanel from './inspector/InspectorPanel';
import { validateFlow } from './flowValidation';
import { collectFlowVariableRefs, findUnassignedReads } from './flowVariables';
import {
  StartNode,
  SendMessageNode,
  InteractiveMenuNode,
  EndFlowNode,
  ConditionNode,
  AskInputNode,
  ApiCallNode,
  AiReplyNode,
  SwitchLanguageNode,
  SwitchModeNode,
  SystemFunctionNode,
  LoopGotoNode,
  RateServiceTemplateNode,
} from './nodes/AllNodes';

const PALETTE_ITEM_STYLE: Record<
  FlowNodeType,
  { Icon: LucideIcon; gradient: string; glow: string }
> = {
  start: { Icon: Flag, gradient: 'from-emerald-500 to-emerald-700', glow: 'shadow-emerald-500/30' },
  send_message: { Icon: MessageSquareText, gradient: 'from-sky-500 to-blue-700', glow: 'shadow-sky-500/30' },
  interactive_menu: { Icon: ListTree, gradient: 'from-violet-500 to-purple-700', glow: 'shadow-violet-500/30' },
  end_flow: { Icon: OctagonX, gradient: 'from-slate-500 to-slate-800', glow: 'shadow-slate-500/25' },
  condition: { Icon: Split, gradient: 'from-amber-500 to-orange-700', glow: 'shadow-amber-500/30' },
  ask_input: { Icon: MessageCircleQuestion, gradient: 'from-cyan-500 to-teal-700', glow: 'shadow-cyan-500/30' },
  api_call: { Icon: Webhook, gradient: 'from-indigo-500 to-indigo-800', glow: 'shadow-indigo-500/30' },
  ai_reply: { Icon: WandSparkles, gradient: 'from-fuchsia-500 to-pink-700', glow: 'shadow-fuchsia-500/30' },
  switch_language: { Icon: Globe, gradient: 'from-teal-500 to-cyan-800', glow: 'shadow-teal-500/30' },
  switch_mode: { Icon: UserCog, gradient: 'from-rose-500 to-red-700', glow: 'shadow-rose-500/30' },
  system_function: { Icon: FunctionSquare, gradient: 'from-lime-600 to-green-800', glow: 'shadow-lime-500/25' },
  loop_goto: { Icon: Repeat, gradient: 'from-pink-500 to-rose-700', glow: 'shadow-pink-500/30' },
  rate_service_template: { Icon: Star, gradient: 'from-green-600 to-emerald-900', glow: 'shadow-green-500/30' },
};

function FlowVariablesRail({ nodes }: { nodes: Array<Node<FlowNodeData>> }) {
  const { writes, reads, unassigned } = useMemo(() => {
    const refs = collectFlowVariableRefs(nodes);
    const w = [...new Set(refs.filter((r) => r.kind === 'write').map((r) => r.name))].filter(Boolean).sort();
    const rd = [...new Set(refs.filter((r) => r.kind === 'read').map((r) => r.name))].filter(Boolean).sort();
    return { writes: w, reads: rd, unassigned: findUnassignedReads(refs) };
  }, [nodes]);

  if (writes.length === 0 && reads.length === 0) {
    return (
      <div className="pt-4 border-t border-border mt-2">
        <div className="text-xs font-semibold">Flow variables</div>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">No variables yet. Add Ask Input, API Call, or use {'{{name}}'} in messages.</p>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-border mt-2 space-y-3">
      <div>
        <div className="text-xs font-semibold">Flow variables</div>
        <p className="text-[10px] text-muted-foreground mt-0.5">Reference while wiring nodes (runtime session vars).</p>
      </div>
      {writes.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-emerald-600/90 dark:text-emerald-400 mb-1">Set (write)</div>
          <ul className="flex flex-wrap gap-1">
            {writes.map((n) => (
              <li key={n} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20">
                {`{{${n}}}`}
              </li>
            ))}
          </ul>
        </div>
      )}
      {reads.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-sky-600/90 dark:text-sky-400 mb-1">Used (read)</div>
          <ul className="flex flex-wrap gap-1">
            {reads.map((n) => (
              <li key={n} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-900 dark:text-sky-200 border border-sky-500/20">
                {`{{${n}}}`}
              </li>
            ))}
          </ul>
        </div>
      )}
      {unassigned.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5">
          <div className="text-[10px] font-medium text-amber-900 dark:text-amber-200">Read but not set in this flow</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {unassigned.map((u) => (
              <span key={u} className="font-mono mr-1">
                {u}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

const Palette = ({ onAdd, nodes }: { onAdd: (type: FlowNodeType) => void; nodes: Array<Node<FlowNodeData>> }) => {
  const groups: Array<{ title: string; items: Array<{ type: FlowNodeType; label: string }> }> = [
    {
      title: 'Flow Control',
      items: [
        { type: 'start', label: 'Start' },
        { type: 'end_flow', label: 'End Flow' },
        { type: 'loop_goto', label: 'Loop / Goto' },
      ],
    },
    {
      title: 'Messaging',
      items: [
        { type: 'send_message', label: 'Send Message' },
        { type: 'interactive_menu', label: 'Interactive Menu' },
        { type: 'ask_input', label: 'Ask User Input' },
        { type: 'rate_service_template', label: 'Rate Service Template' },
      ],
    },
    {
      title: 'Logic',
      items: [
        { type: 'condition', label: 'Condition' },
        { type: 'switch_language', label: 'Switch Language' },
        { type: 'switch_mode', label: 'Switch Mode' },
      ],
    },
    {
      title: 'Integration',
      items: [
        { type: 'api_call', label: 'API Call' },
        { type: 'system_function', label: 'System Function' },
      ],
    },
    {
      title: 'AI',
      items: [{ type: 'ai_reply', label: 'AI Reply' }],
    },
  ];

  return (
    <div className="w-72 shrink-0 border-r border-border bg-card/60 backdrop-blur flex flex-col min-h-0 max-h-full">
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <div className="mb-4 rounded-xl border border-border/80 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 px-3 py-2.5">
          <div className="text-sm font-semibold tracking-tight">Node palette</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Tap a tile to drop it on the canvas</div>
        </div>

        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/90 mb-2 pl-0.5">{g.title}</div>
              <div className="space-y-1.5">
                {g.items.map((item) => {
                  const meta = PALETTE_ITEM_STYLE[item.type];
                  const Icon = meta.Icon;
                  return (
                    <button
                      type="button"
                      key={item.type}
                      onClick={() => onAdd(item.type)}
                      className={cn(
                        'group w-full flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 px-2 py-2 text-left text-sm',
                        'shadow-sm backdrop-blur-sm transition-all duration-200',
                        'hover:border-primary/35 hover:bg-card/90 hover:shadow-md hover:-translate-y-px',
                        'active:translate-y-0 active:shadow-sm',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      )}
                    >
                      <span
                        className={cn(
                          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg',
                          meta.gradient,
                          meta.glow,
                          'ring-1 ring-inset ring-white/25',
                          'group-hover:ring-white/40 group-hover:scale-[1.03] transition-transform duration-200',
                        )}
                      >
                        <Icon className="relative z-10 h-[18px] w-[18px] drop-shadow" strokeWidth={2.25} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium leading-snug break-words group-hover:text-foreground">{item.label}</span>
                        <span className="mt-0.5 block text-[10px] capitalize leading-snug text-muted-foreground break-words opacity-80 group-hover:opacity-100">
                          {String(item.type).replaceAll('_', ' ')}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <FlowVariablesRail nodes={nodes} />
      </div>
    </div>
  );
};

const Inspector = () => {
  const { selectedNodeId, nodes } = useFlowStore();
  const node = nodes.find((n) => n.id === selectedNodeId) as Node<FlowNodeData> | undefined;

  if (!node) {
    return (
      <div className="w-[300px] shrink-0 border-l border-border bg-card/60 backdrop-blur p-4">
        <div className="text-sm font-semibold">Inspector</div>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Click a node on the canvas to edit its settings. Click an empty area to deselect.
        </p>
      </div>
    );
  }

  return <InspectorPanel node={node} />;
};

const Canvas = () => {
  const { nodes, edges, setNodes, setEdges, deleteEdge, addNode, loadFlow, saveFlow, dirty, loading, saving, lastSavedAt } = useFlowStore();
  const rf = useReactFlow();
  const [zoomPct, setZoomPct] = useState(100);
  const [panButtons, setPanButtons] = useState<number[]>([1]); // middle-click drag

  useEffect(() => {
    loadFlow().catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load flow'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setPanButtons([0, 1]);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setPanButtons([1]);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  const onNodesChange = useCallback(
    (changes: Parameters<typeof applyNodeChanges>[0]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: Parameters<typeof applyEdgeChanges>[0]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges],
  );

  const onConnect = useCallback<OnConnect>((params) => {
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));
  }, [setEdges]);

  const onEdgeClick = useCallback(
    (_: MouseEvent, edge: Edge) => {
      deleteEdge(edge.id);
    },
    [deleteEdge],
  );

  const onAdd = (type: FlowNodeType) => {
    const viewport = rf.getViewport();
    const center = rf.project({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    addNode({ type, position: { x: center.x - viewport.x / viewport.zoom, y: center.y - viewport.y / viewport.zoom } });
  };

  const onInitZoom = () => {
    const z = rf.getViewport().zoom;
    setZoomPct(Math.round(z * 100));
  };

  const nodeTypes = useMemo(
    () => ({
      start: StartNode,
      send_message: SendMessageNode,
      interactive_menu: InteractiveMenuNode,
      end_flow: EndFlowNode,
      condition: ConditionNode,
      ask_input: AskInputNode,
      api_call: ApiCallNode,
      ai_reply: AiReplyNode,
      switch_language: SwitchLanguageNode,
      switch_mode: SwitchModeNode,
      system_function: SystemFunctionNode,
      loop_goto: LoopGotoNode,
      rate_service_template: RateServiceTemplateNode,
    }),
    [],
  );

  const issues = useMemo(() => validateFlow(nodes as Array<Node<FlowNodeData>>, edges), [nodes, edges]);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="h-12 shrink-0 border-b border-border bg-card/60 backdrop-blur px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-semibold text-sm">Flow Builder</div>
          <div className="text-xs text-muted-foreground">
            Zoom: {zoomPct}% {lastSavedAt ? `• Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : ''}
          </div>
          {dirty && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
              Unsaved
            </span>
          )}
          {issues.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive dark:text-red-300 border border-destructive/25">
              {issues.filter((i) => i.level === 'error').length} errors • {issues.filter((i) => i.level === 'warning').length} warnings
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => saveFlow().then(() => toast.success('Flow saved')).catch((e) => toast.error(e instanceof Error ? e.message : 'Save failed'))}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      <div className="flex-1 min-h-0 flex">
        <Palette onAdd={onAdd} nodes={nodes as Array<Node<FlowNodeData>>} />

        <div className="flex-1 min-h-0 bg-background">
          {loading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeClick={onEdgeClick}
              connectionLineType={ConnectionLineType.SmoothStep}
              connectionLineStyle={{ strokeWidth: 2 }}
              panOnDrag={panButtons}
              minZoom={0.2}
              maxZoom={2}
              onMove={() => onInitZoom()}
              onInit={() => onInitZoom()}
              nodeDragThreshold={2}
              nodesDraggable
              nodesConnectable
              elementsSelectable
              nodeOrigin={[0, 0]}
              selectionOnDrag
              zoomOnScroll
              panOnScroll
              fitView
            >
              <Background variant={BackgroundVariant.Dots} gap={22} size={1} />
            </ReactFlow>
          )}
        </div>

        <Inspector />
      </div>
    </div>
  );
};

const FlowBuilderSection = () => {
  return (
    <div className="h-full w-full bg-background text-foreground">
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
    </div>
  );
};

export default FlowBuilderSection;

