import type { Node } from 'reactflow';
import type { FlowNodeData, FlowNodeType } from '@/store/flowStore';

export type FlowVarRef = {
  name: string;
  kind: 'write' | 'read';
  nodeId: string;
  detail: string;
};

function extractTemplateVars(text: string): string[] {
  const out: string[] = [];
  const re = /\{\{([^}]+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    if (name) out.push(name);
  }
  return out;
}

function humanType(type: string): string {
  return String(type).replaceAll('_', ' ');
}

/** Scan flow nodes for variable writes (set) and reads ({{name}} or explicit fields). */
export function collectFlowVariableRefs(nodes: Array<Node<FlowNodeData>>): FlowVarRef[] {
  const refs: FlowVarRef[] = [];

  for (const n of nodes) {
    const d = (n.data ?? {}) as Record<string, unknown>;
    const id = n.id;
    const label = `${humanType(String(n.type))} (${id})`;

    const addReads = (text: string, hint: string) => {
      for (const v of extractTemplateVars(text)) {
        refs.push({ name: v, kind: 'read', nodeId: id, detail: `${label}: ${hint}` });
      }
    };

    switch (n.type as FlowNodeType) {
      case 'start':
        addReads(String(d.welcomeText ?? ''), 'welcome text');
        break;
      case 'send_message':
        addReads(String(d.text ?? ''), 'message');
        break;
      case 'end_flow':
        addReads(String(d.closingText ?? ''), 'closing');
        break;
      case 'condition': {
        const vname = String(d.variable ?? '').trim();
        if (vname) refs.push({ name: vname, kind: 'read', nodeId: id, detail: `${label}: compares variable` });
        addReads(String(d.value ?? ''), 'compare value');
        break;
      }
      case 'ask_input': {
        const vn = String(d.variableName ?? '').trim();
        if (vn) refs.push({ name: vn, kind: 'write', nodeId: id, detail: `${label}: stores user answer` });
        addReads(String(d.questionText ?? ''), 'question');
        break;
      }
      case 'interactive_menu':
        addReads(String(d.headerText ?? ''), 'header');
        addReads(String(d.bodyText ?? ''), 'body');
        break;
      case 'api_call': {
        const srv = String(d.saveResponseVar ?? '').trim();
        if (srv) refs.push({ name: srv, kind: 'write', nodeId: id, detail: `${label}: full JSON response` });
        const extracts = Array.isArray(d.responseExtracts) ? d.responseExtracts : [];
        for (const ex of extracts) {
          const o = ex as Record<string, unknown>;
          const varName = String(o.variableName ?? '').trim();
          const jp = String(o.jsonPath ?? '').trim();
          if (varName) {
            refs.push({
              name: varName,
              kind: 'write',
              nodeId: id,
              detail: `${label}: response path ${jp || '?'}`,
            });
          }
        }
        addReads(String(d.url ?? ''), 'URL');
        break;
      }
      case 'ai_reply': {
        const sav = String(d.saveAsVar ?? '').trim();
        if (sav) refs.push({ name: sav, kind: 'write', nodeId: id, detail: `${label}: AI reply text` });
        addReads(String(d.systemPrompt ?? ''), 'system prompt');
        break;
      }
      case 'system_function': {
        const fr = String(d.saveResultVar ?? '').trim();
        if (fr) refs.push({ name: fr, kind: 'write', nodeId: id, detail: `${label}: function result` });
        const params = Array.isArray(d.parameters) ? d.parameters : [];
        for (const p of params) {
          const o = p as Record<string, unknown>;
          const uv = String(o.useVariable ?? '').trim();
          if (uv) refs.push({ name: uv, kind: 'read', nodeId: id, detail: `${label}: parameter variable` });
        }
        break;
      }
      case 'rate_service_template': {
        const phone = String(d.phoneVariable ?? '').trim();
        const order = String(d.orderNumberVariable ?? '').trim();
        if (phone) refs.push({ name: phone, kind: 'read', nodeId: id, detail: `${label}: phone field` });
        if (order) refs.push({ name: order, kind: 'read', nodeId: id, detail: `${label}: order # field` });
        addReads(String(d.templateText ?? ''), 'template');
        break;
      }
      default:
        break;
    }
  }

  return refs;
}

/** Variable names used in {{}} but with no writer node in this flow (heuristic). */
export function findUnassignedReads(refs: FlowVarRef[]): string[] {
  const written = new Set(refs.filter((r) => r.kind === 'write').map((r) => r.name));
  const readNames = refs.filter((r) => r.kind === 'read').map((r) => r.name);
  const uniq = [...new Set(readNames)];
  return uniq.filter((n) => n && !written.has(n)).sort();
}
