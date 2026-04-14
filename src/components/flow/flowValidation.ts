import type { Edge, Node } from 'reactflow';
import type { FlowNodeData, FlowNodeType } from '@/store/flowStore';

export type FlowIssue = { level: 'warning' | 'error'; message: string; nodeId?: string };

function hasOut(edges: Edge[], nodeId: string, sourceHandle: string) {
  return edges.some((e) => e.source === nodeId && (e.sourceHandle || '') === sourceHandle);
}

export function validateFlow(nodes: Array<Node<FlowNodeData>>, edges: Edge[]): FlowIssue[] {
  const issues: FlowIssue[] = [];

  const startNodes = nodes.filter((n) => n.type === 'start');
  if (startNodes.length === 0) issues.push({ level: 'error', message: 'Missing Start node.' });
  if (startNodes.length > 1) issues.push({ level: 'error', message: 'Only one Start node is allowed.' });

  for (const n of nodes) {
    const type = n.type as FlowNodeType;
    if (type === 'start' && !hasOut(edges, n.id, 'begin')) {
      issues.push({ level: 'warning', nodeId: n.id, message: 'Start node has no “Begin” connection.' });
    }
    if (type === 'send_message' && !hasOut(edges, n.id, 'out')) {
      issues.push({ level: 'warning', nodeId: n.id, message: 'Send Message has no “Next” connection.' });
    }
    if (type === 'condition' && (!hasOut(edges, n.id, 'true') || !hasOut(edges, n.id, 'false'))) {
      issues.push({ level: 'warning', nodeId: n.id, message: 'Condition should connect both True and False.' });
    }
    if (type === 'ask_input' && !hasOut(edges, n.id, 'answer')) {
      issues.push({ level: 'warning', nodeId: n.id, message: 'Ask User Input has no “Got Answer” connection.' });
    }
    if (type === 'interactive_menu' && !hasOut(edges, n.id, 'fallback')) {
      issues.push({ level: 'warning', nodeId: n.id, message: 'Interactive Menu should have a Fallback connection.' });
    }
    if (type === 'api_call' && (!hasOut(edges, n.id, 'success') || !hasOut(edges, n.id, 'error'))) {
      issues.push({ level: 'warning', nodeId: n.id, message: 'API Call should connect Success and Error.' });
    }
    if (type === 'ai_reply' && !hasOut(edges, n.id, 'replied')) {
      issues.push({ level: 'warning', nodeId: n.id, message: 'AI Reply has no “Replied” connection.' });
    }
    if (type === 'switch_language' && !hasOut(edges, n.id, 'out')) {
      issues.push({ level: 'warning', nodeId: n.id, message: 'Switch Language has no “Next” connection.' });
    }
    if (type === 'switch_mode' && !hasOut(edges, n.id, 'out')) {
      issues.push({ level: 'warning', nodeId: n.id, message: 'Switch Mode has no “Next” connection.' });
    }
    if (type === 'system_function' && (!hasOut(edges, n.id, 'success') || !hasOut(edges, n.id, 'error'))) {
      issues.push({ level: 'warning', nodeId: n.id, message: 'System Function should connect Success and Error.' });
    }
    if (type === 'rate_service_template' && !hasOut(edges, n.id, 'sent')) {
      issues.push({ level: 'warning', nodeId: n.id, message: 'Rate Service Template has no “Sent” connection.' });
    }
  }

  return issues;
}

