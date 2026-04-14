import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFlowStore } from '@/store/flowStore';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import { api } from '@/lib/api';

describe('flowStore', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.put).mockReset();
    useFlowStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      dirty: false,
      loading: false,
      saving: false,
      lastSavedAt: null,
    });
  });

  it('setNodes derives selectedNodeId from exactly one selected node', () => {
    useFlowStore.getState().setNodes([
      { id: 'a', type: 'start', position: { x: 0, y: 0 }, selected: true, data: {} },
    ]);
    expect(useFlowStore.getState().selectedNodeId).toBe('a');

    useFlowStore.getState().setNodes([
      { id: 'a', type: 'start', position: { x: 0, y: 0 }, selected: false, data: {} },
    ]);
    expect(useFlowStore.getState().selectedNodeId).toBeNull();
  });

  it('saveFlow omits selected from nodes sent to API', async () => {
    useFlowStore.setState({
      nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, selected: true, data: { welcomeText: 'Hi' } }],
      edges: [],
    });

    vi.mocked(api.put).mockResolvedValue({
      message: 'Flow saved',
      data: { id: '1', updatedAt: '2026-01-01T12:00:00.000000Z' },
    });

    await useFlowStore.getState().saveFlow();

    expect(api.put).toHaveBeenCalledWith('/flow', {
      nodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { welcomeText: 'Hi' } }],
      edges: [],
    });
    expect(useFlowStore.getState().dirty).toBe(false);
    expect(useFlowStore.getState().lastSavedAt).toBe('2026-01-01T12:00:00.000000Z');
  });

  it('loadFlow clears selection flags on nodes', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        id: '1',
        nodes: [{ id: 'start', type: 'start', position: { x: 1, y: 2 }, selected: true, data: {} }],
        edges: [],
        updatedAt: '2026-02-01T00:00:00.000000Z',
      },
    });

    await useFlowStore.getState().loadFlow();

    expect(useFlowStore.getState().nodes[0]?.selected).toBe(false);
    expect(useFlowStore.getState().selectedNodeId).toBeNull();
  });
});
