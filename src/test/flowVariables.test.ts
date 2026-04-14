import { describe, expect, it } from 'vitest';
import type { Node } from 'reactflow';
import { collectFlowVariableRefs, findUnassignedReads } from '@/components/flow/flowVariables';
import type { FlowNodeData } from '@/store/flowStore';

describe('collectFlowVariableRefs', () => {
  it('records API response extracts as writes', () => {
    const nodes: Array<Node<FlowNodeData>> = [
      {
        id: 'a1',
        type: 'api_call',
        position: { x: 0, y: 0 },
        data: {
          responseExtracts: [{ jsonPath: 'data.id', variableName: 'order_id' }],
        },
      },
    ];
    const refs = collectFlowVariableRefs(nodes);
    expect(refs.some((r) => r.kind === 'write' && r.name === 'order_id')).toBe(true);
  });

  it('flags reads without writers', () => {
    const nodes: Array<Node<FlowNodeData>> = [
      {
        id: 's1',
        type: 'send_message',
        position: { x: 0, y: 0 },
        data: { text: 'Hello {{missing_var}}' },
      },
    ];
    const refs = collectFlowVariableRefs(nodes);
    expect(findUnassignedReads(refs)).toContain('missing_var');
  });
});
