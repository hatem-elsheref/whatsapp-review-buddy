import { describe, expect, it } from 'vitest';
import type { Edge, Node } from 'reactflow';
import { validateFlow } from '@/components/flow/flowValidation';

describe('validateFlow', () => {
  it('reports missing start node', () => {
    const issues = validateFlow([], []);
    expect(issues.some((i) => i.message.includes('Missing Start'))).toBe(true);
  });

  it('warns when condition outputs not connected', () => {
    const nodes: Array<Node<Record<string, unknown>>> = [
      { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
      { id: 'c1', type: 'condition', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [{ id: 'e1', source: 'start', sourceHandle: 'begin', target: 'c1', targetHandle: 'in' }];
    const issues = validateFlow(nodes as unknown as Parameters<typeof validateFlow>[0], edges);
    expect(issues.some((i) => i.message.includes('Condition'))).toBe(true);
  });

  it('warns when interactive menu has no fallback edge', () => {
    const nodes: Array<Node<Record<string, unknown>>> = [
      { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
      { id: 'm1', type: 'interactive_menu', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: Edge[] = [{ id: 'e1', source: 'start', sourceHandle: 'begin', target: 'm1', targetHandle: 'in' }];
    const issues = validateFlow(nodes as unknown as Parameters<typeof validateFlow>[0], edges);
    expect(issues.some((i) => i.message.includes('Fallback'))).toBe(true);
  });

  it('has no errors for minimal valid start-only graph', () => {
    const nodes: Array<Node<Record<string, unknown>>> = [{ id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} }];
    const issues = validateFlow(nodes as unknown as Parameters<typeof validateFlow>[0], []);
    expect(issues.filter((i) => i.level === 'error')).toHaveLength(0);
  });
});

