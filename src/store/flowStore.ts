import { create } from 'zustand';
import type { Edge, Node, XYPosition } from 'reactflow';
import { api } from '@/lib/api';

export type FlowNodeType =
  | 'start'
  | 'send_message'
  | 'interactive_menu'
  | 'end_flow'
  | 'condition'
  | 'ask_input'
  | 'api_call'
  | 'ai_reply'
  | 'switch_language'
  | 'switch_mode'
  | 'system_function'
  | 'loop_goto'
  | 'rate_service_template';

export type FlowNodeData = Record<string, unknown>;

export interface FlowDoc {
  id: string;
  nodes: Array<Node<FlowNodeData>>;
  edges: Array<Edge>;
  updatedAt?: string | null;
}

interface FlowStoreState {
  nodes: Array<Node<FlowNodeData>>;
  edges: Array<Edge>;
  selectedNodeId: string | null;
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  lastSavedAt: string | null;

  setSelectedNodeId: (id: string | null) => void;
  setNodes: (updater: Array<Node<FlowNodeData>> | ((nodes: Array<Node<FlowNodeData>>) => Array<Node<FlowNodeData>>)) => void;
  setEdges: (updater: Array<Edge> | ((edges: Array<Edge>) => Array<Edge>)) => void;
  markDirty: () => void;

  addNode: (node: { type: FlowNodeType; position: XYPosition; data?: FlowNodeData }) => void;
  deleteNode: (id: string) => void;
  updateNodeData: (id: string, data: FlowNodeData) => void;
  deleteEdge: (edgeId: string) => void;

  loadFlow: () => Promise<void>;
  saveFlow: () => Promise<void>;
}

function uuid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export const useFlowStore = create<FlowStoreState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  dirty: false,
  loading: false,
  saving: false,
  lastSavedAt: null,

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setNodes: (updater) =>
    set((s) => {
      const next = typeof updater === 'function' ? updater(s.nodes) : updater;
      const selected = next.filter((n) => n.selected);
      const selectedNodeId = selected.length === 1 ? selected[0].id : null;
      return { nodes: next, dirty: true, selectedNodeId };
    }),

  setEdges: (updater) =>
    set((s) => {
      const next = typeof updater === 'function' ? updater(s.edges) : updater;
      return { edges: next, dirty: true };
    }),
  markDirty: () => set({ dirty: true }),

  addNode: ({ type, position, data }) => {
    const id = type === 'start' ? 'start' : uuid(type);
    if (type === 'start' && get().nodes.some((n) => n.id === 'start')) return;

    const defaults: Record<FlowNodeType, FlowNodeData> = {
      start: { welcomeText: 'Welcome!' },
      send_message: { text: '' },
      interactive_menu: { mode: 'list', headerText: '', bodyText: '', buttonLabel: 'View options', sections: [], buttons: [], saveSelectionAs: '' },
      end_flow: { closingText: '' },
      condition: { variable: '', operator: '==', value: '' },
      ask_input: { questionText: '', variableName: '', validateType: 'any', errorMessage: '' },
      api_call: {
        method: 'GET',
        url: '',
        auth: { type: 'none' },
        headers: [],
        bodyType: 'none',
        body: null,
        mappings: [],
        responseExtracts: [],
        saveResponseVar: '',
      },
      ai_reply: { systemPrompt: '', tone: 'helpful', language: 'auto', includeHistory: true, saveAsVar: '' },
      switch_language: { language: 'EN' },
      switch_mode: { mode: 'manual', autoRevertMinutes: 0, triggerWords: 'stop,cancel,انهاء,وقف' },
      system_function: { functionName: 'track_order', parameters: [], saveResultVar: '' },
      loop_goto: { targetNodeId: '' },
      rate_service_template: { templateText: '', replyWindowHours: 24, phoneVariable: 'phone', orderNumberVariable: 'order_number' },
    };

    set((s) => ({
      nodes: [
        ...s.nodes.map((n) => ({ ...n, selected: false })),
        {
          id,
          type,
          position,
          selected: true,
          data: { ...(defaults[type] ?? {}), ...(data ?? {}) },
        },
      ],
      dirty: true,
      selectedNodeId: id,
    }));
  },

  deleteNode: (id) => {
    if (id === 'start') return;
    set((s) => {
      const nodes = s.nodes.filter((n) => n.id !== id);
      const edges = s.edges.filter((e) => e.source !== id && e.target !== id);
      const selected = nodes.filter((n) => n.selected);
      const selectedNodeId = selected.length === 1 ? selected[0].id : null;
      return { nodes, edges, dirty: true, selectedNodeId };
    });
  },

  updateNodeData: (id, data) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...(n.data ?? {}), ...data } } : n)),
      dirty: true,
    }));
  },

  deleteEdge: (edgeId) => {
    set((s) => ({ edges: s.edges.filter((e) => e.id !== edgeId), dirty: true }));
  },

  loadFlow: async () => {
    set({ loading: true });
    try {
      const res = await api.get<{ data: FlowDoc }>('/flow');
      const rawNodes = (res.data.nodes || []) as Array<Node<FlowNodeData>>;
      set({
        nodes: rawNodes.map((n) => ({ ...n, selected: false })),
        edges: (res.data.edges || []) as Array<Edge>,
        dirty: false,
        selectedNodeId: null,
        lastSavedAt: res.data.updatedAt ?? null,
      });
    } finally {
      set({ loading: false });
    }
  },

  saveFlow: async () => {
    const { nodes, edges } = get();
    const nodesPayload = nodes.map(({ selected: _sel, ...rest }) => rest);
    set({ saving: true });
    try {
      const res = await api.put<{ data: { updatedAt: string } }>('/flow', { nodes: nodesPayload, edges });
      set({ dirty: false, lastSavedAt: res.data.updatedAt ?? null });
    } finally {
      set({ saving: false });
    }
  },
}));

