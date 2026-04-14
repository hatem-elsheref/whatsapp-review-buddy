import type { Node } from 'reactflow';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useFlowStore, type FlowNodeData, type FlowNodeType } from '@/store/flowStore';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none ${props.className || ''}`} />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none ${props.className || ''}`} />
);

const btnSecondary = 'inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs hover:bg-muted transition-colors';
const btnDanger = 'inline-flex items-center justify-center rounded p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10';

type ListRow = { id: string; title: string; description?: string };
type ListSection = { title: string; rows: ListRow[] };
type QuickButton = { id: string; title: string };
type ApiMapping = { id: string; label: string; conditionType: string; expected: string; field: string };
type ResponseExtract = { jsonPath: string; variableName: string };
type SysParam = { name: string; useVariable: string; question: string; validateType: string; errorMessage: string };

function parseSections(raw: unknown): ListSection[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    const obj = s as Record<string, unknown>;
    const title = String(obj.title ?? '');
    const rowsRaw = obj.rows;
    const rows: ListRow[] = Array.isArray(rowsRaw)
      ? rowsRaw.map((r) => {
          const row = r as Record<string, unknown>;
          return {
            id: String(row.id ?? ''),
            title: String(row.title ?? ''),
            description: row.description != null && String(row.description) !== '' ? String(row.description) : undefined,
          };
        })
      : [];
    return { title, rows };
  });
}

function parseButtons(raw: unknown): QuickButton[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 3).map((b, i) => {
    const o = b as Record<string, unknown>;
    return { id: String(o.id ?? `btn_${i}`), title: String(o.title ?? '') };
  });
}

function parseMappings(raw: unknown): ApiMapping[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((m, i) => {
    const o = m as Record<string, unknown>;
    return {
      id: String(o.id ?? `map_${i}`),
      label: String(o.label ?? ''),
      conditionType: String(o.conditionType ?? 'status_equals'),
      expected: String(o.expected ?? ''),
      field: String(o.field ?? ''),
    };
  });
}

function parseParams(raw: unknown): SysParam[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => {
    const o = p as Record<string, unknown>;
    return {
      name: String(o.name ?? ''),
      useVariable: String(o.useVariable ?? ''),
      question: String(o.question ?? ''),
      validateType: String(o.validateType ?? 'any'),
      errorMessage: String(o.errorMessage ?? ''),
    };
  });
}

function parseResponseExtracts(raw: unknown): ResponseExtract[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((ex) => {
    const o = ex as Record<string, unknown>;
    return { jsonPath: String(o.jsonPath ?? ''), variableName: String(o.variableName ?? '') };
  });
}

function ResponseExtractsEditor({ value, onChange }: { value: ResponseExtract[]; onChange: (next: ResponseExtract[]) => void }) {
  const add = () => onChange([...value, { jsonPath: '', variableName: '' }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const updateAt = (i: number, patch: Partial<ResponseExtract>) => onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">
        After each call, copy values from the parsed JSON response into flow variables (dot paths like <span className="font-mono">data.id</span> or{' '}
        <span className="font-mono">items.0.name</span>).
      </p>
      {value.map((r, i) => (
        <div key={i} className="rounded-lg border border-border bg-muted/20 p-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Field {i + 1}</span>
            <button type="button" className={btnDanger} onClick={() => remove(i)} title="Remove">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <Input
            placeholder="JSON path (e.g. data.order_id)"
            className="text-xs font-mono"
            value={r.jsonPath}
            onChange={(e) => updateAt(i, { jsonPath: e.target.value })}
          />
          <Input
            placeholder="Variable name to save"
            className="text-xs font-mono"
            value={r.variableName}
            onChange={(e) => updateAt(i, { variableName: e.target.value })}
          />
        </div>
      ))}
      <button type="button" className={`${btnSecondary} w-full`} onClick={add}>
        <Plus className="w-3.5 h-3.5" />
        Add path → variable
      </button>
    </div>
  );
}

function QuickReplyButtonsEditor({ value, onChange }: { value: QuickButton[]; onChange: (next: QuickButton[]) => void }) {
  const list = value.slice(0, 3);
  const updateAt = (i: number, patch: Partial<QuickButton>) => {
    onChange(list.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  };
  const removeAt = (i: number) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => {
    if (list.length >= 3) return;
    onChange([...list, { id: `btn_${Date.now()}`, title: '' }]);
  };

  return (
    <div className="space-y-2">
      {list.map((b, i) => (
        <div key={`${b.id}-${i}`} className="rounded-lg border border-border bg-muted/20 p-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Button {i + 1}</span>
            <button type="button" className={btnDanger} onClick={() => removeAt(i)} title="Remove">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <Input placeholder="ID (unique, e.g. opt_yes)" value={b.id} onChange={(e) => updateAt(i, { id: e.target.value })} />
          <Input placeholder="Label shown on WhatsApp" value={b.title} onChange={(e) => updateAt(i, { title: e.target.value })} />
        </div>
      ))}
      {list.length < 3 && (
        <button type="button" className={`${btnSecondary} w-full`} onClick={add}>
          <Plus className="w-3.5 h-3.5" />
          Add button
        </button>
      )}
      <p className="text-[11px] text-muted-foreground">Up to 3 quick-reply buttons (WhatsApp limit).</p>
    </div>
  );
}

function ListSectionsEditor({ value, onChange }: { value: ListSection[]; onChange: (next: ListSection[]) => void }) {
  const addSection = () => onChange([...value, { title: 'New section', rows: [{ id: `row_${Date.now()}`, title: '' }] }]);
  const removeSection = (si: number) => onChange(value.filter((_, i) => i !== si));
  const setSectionTitle = (si: number, title: string) =>
    onChange(value.map((s, i) => (i === si ? { ...s, title } : s)));

  const addRow = (si: number) => {
    const next = value.map((s, i) =>
      i === si ? { ...s, rows: [...s.rows, { id: `row_${Date.now()}`, title: '' }] } : s,
    );
    onChange(next);
  };
  const removeRow = (si: number, ri: number) => {
    const next = value.map((s, i) => (i === si ? { ...s, rows: s.rows.filter((_, j) => j !== ri) } : s));
    onChange(next);
  };
  const updateRow = (si: number, ri: number, patch: Partial<ListRow>) => {
    const next = value.map((s, i) =>
      i === si
        ? {
            ...s,
            rows: s.rows.map((r, j) => {
              if (j !== ri) return r;
              const merged: ListRow = { ...r, ...patch };
              if ('description' in patch && patch.description === '') {
                delete merged.description;
              }
              return merged;
            }),
          }
        : s,
    );
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.map((section, si) => (
        <div key={si} className="rounded-lg border border-border bg-muted/20 p-2 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              className="flex-1 text-xs"
              placeholder="Section title"
              value={section.title}
              onChange={(e) => setSectionTitle(si, e.target.value)}
            />
            <button type="button" className={btnDanger} onClick={() => removeSection(si)} title="Remove section">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="pl-2 space-y-2 border-l-2 border-border ml-1">
            {section.rows.map((row, ri) => (
              <div key={`${row.id}-${ri}`} className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] text-muted-foreground">Row {ri + 1}</span>
                  <button type="button" className={btnDanger} onClick={() => removeRow(si, ri)} title="Remove row">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <Input placeholder="Row ID" className="text-xs" value={row.id} onChange={(e) => updateRow(si, ri, { id: e.target.value })} />
                <Input placeholder="Title" className="text-xs" value={row.title} onChange={(e) => updateRow(si, ri, { title: e.target.value })} />
                <Input
                  placeholder="Description (optional)"
                  className="text-xs"
                  value={row.description ?? ''}
                  onChange={(e) => updateRow(si, ri, { description: e.target.value })}
                />
              </div>
            ))}
            <button type="button" className={`${btnSecondary} w-full mt-1`} onClick={() => addRow(si)}>
              <Plus className="w-3 h-3" />
              Add row
            </button>
          </div>
        </div>
      ))}
      <button type="button" className={`${btnSecondary} w-full`} onClick={addSection}>
        <Plus className="w-3.5 h-3.5" />
        Add section
      </button>
    </div>
  );
}

function MappingsEditor({ value, onChange }: { value: ApiMapping[]; onChange: (next: ApiMapping[]) => void }) {
  const add = () => onChange([...value, { id: `map_${Date.now()}`, label: '', conditionType: 'status_equals', expected: '200', field: '' }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const updateAt = (i: number, patch: Partial<ApiMapping>) => onChange(value.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">First matching rule wins. Each mapping adds an output port on the node.</p>
      {value.map((m, i) => (
        <div key={`${m.id}-${i}`} className="rounded-lg border border-border bg-muted/20 p-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Mapping {i + 1}</span>
            <button type="button" className={btnDanger} onClick={() => remove(i)} title="Remove">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <Input placeholder="Handle ID (e.g. ok)" className="text-xs" value={m.id} onChange={(e) => updateAt(i, { id: e.target.value })} />
          <Input placeholder="Label (display)" className="text-xs" value={m.label} onChange={(e) => updateAt(i, { label: e.target.value })} />
          <select
            className="w-full bg-muted rounded-lg px-2 py-1.5 text-xs outline-none"
            value={m.conditionType}
            onChange={(e) => updateAt(i, { conditionType: e.target.value })}
          >
            <option value="status_equals">HTTP status equals</option>
            <option value="body_contains">Response body contains</option>
            <option value="body_field_equals">JSON field equals</option>
          </select>
          {m.conditionType === 'body_field_equals' ? (
            <Input placeholder="JSON path (e.g. data.status)" className="text-xs" value={m.field} onChange={(e) => updateAt(i, { field: e.target.value })} />
          ) : null}
          <Input
            placeholder={m.conditionType === 'status_equals' ? 'Expected status (e.g. 200)' : 'Expected text or value'}
            className="text-xs"
            value={m.expected}
            onChange={(e) => updateAt(i, { expected: e.target.value })}
          />
        </div>
      ))}
      <button type="button" className={`${btnSecondary} w-full`} onClick={add}>
        <Plus className="w-3.5 h-3.5" />
        Add mapping
      </button>
    </div>
  );
}

function ParametersEditor({ value, onChange }: { value: SysParam[]; onChange: (next: SysParam[]) => void }) {
  const add = () => onChange([...value, { name: '', useVariable: '', question: '', validateType: 'any', errorMessage: '' }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const updateAt = (i: number, patch: Partial<SysParam>) => onChange(value.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">Each parameter can read from a flow variable or prompt the user.</p>
      {value.map((p, i) => (
        <div key={i} className="rounded-lg border border-border bg-muted/20 p-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Parameter {i + 1}</span>
            <button type="button" className={btnDanger} onClick={() => remove(i)} title="Remove">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <Input placeholder="Parameter name" className="text-xs" value={p.name} onChange={(e) => updateAt(i, { name: e.target.value })} />
          <Input placeholder="Variable key to read/save (e.g. order_id)" className="text-xs" value={p.useVariable} onChange={(e) => updateAt(i, { useVariable: e.target.value })} />
          <Input placeholder="Question if variable missing" className="text-xs" value={p.question} onChange={(e) => updateAt(i, { question: e.target.value })} />
          <Field label="Validate (when prompting)">
            <select
              value={p.validateType || 'any'}
              onChange={(e) => updateAt(i, { validateType: e.target.value })}
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none"
            >
              {['any', 'numeric', 'digits', 'email', 'phone', 'text'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Input
            placeholder="Error message if invalid"
            className="text-xs"
            value={p.errorMessage}
            onChange={(e) => updateAt(i, { errorMessage: e.target.value })}
          />
        </div>
      ))}
      <button type="button" className={`${btnSecondary} w-full`} onClick={add}>
        <Plus className="w-3.5 h-3.5" />
        Add parameter
      </button>
    </div>
  );
}

export default function InspectorPanel({ node }: { node: Node<FlowNodeData> }) {
  const { updateNodeData, deleteNode, nodes } = useFlowStore();

  const type = node.type as FlowNodeType;
  const d = (node.data ?? {}) as Record<string, unknown>;

  const set = (patch: Record<string, unknown>) => updateNodeData(node.id, patch);

  const allNodeIds = nodes.map((n) => n.id);

  return (
    <div className="w-[300px] shrink-0 border-l border-border bg-card/60 backdrop-blur p-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold capitalize">{String(type).replaceAll('_', ' ')}</div>
          <div className="text-xs text-muted-foreground">Node ID: {node.id}</div>
        </div>
        {node.id !== 'start' && (
          <button type="button" onClick={() => deleteNode(node.id)} className="text-xs text-red-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 rounded">
            Delete
          </button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {type === 'start' && (
          <Field label="Welcome message">
            <Textarea value={String(d.welcomeText ?? '')} onChange={(e) => set({ welcomeText: e.target.value })} rows={4} />
          </Field>
        )}

        {type === 'send_message' && (
          <Field label="Message text (supports {{variable}})">
            <Textarea value={String(d.text ?? '')} onChange={(e) => set({ text: e.target.value })} rows={4} />
          </Field>
        )}

        {type === 'end_flow' && (
          <Field label="Closing message (optional)">
            <Textarea value={String(d.closingText ?? '')} onChange={(e) => set({ closingText: e.target.value })} rows={4} />
          </Field>
        )}

        {type === 'condition' && (
          <>
            <Field label="Variable name">
              <Input value={String(d.variable ?? '')} onChange={(e) => set({ variable: e.target.value })} placeholder="e.g. order_status" />
            </Field>
            <Field label="Operator">
              <select
                value={String(d.operator ?? '==')}
                onChange={(e) => set({ operator: e.target.value })}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none"
              >
                {['==', '!=', '>', '<', '>=', '<=', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_numeric', 'is_empty', 'is_true', 'is_false'].map(
                  (op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Value (text or {{variable}})">
              <Input value={String(d.value ?? '')} onChange={(e) => set({ value: e.target.value })} placeholder="e.g. shipped" />
            </Field>
          </>
        )}

        {type === 'ask_input' && (
          <>
            <Field label="Question text">
              <Textarea value={String(d.questionText ?? '')} onChange={(e) => set({ questionText: e.target.value })} rows={3} />
            </Field>
            <Field label="Variable name to save answer">
              <Input value={String(d.variableName ?? '')} onChange={(e) => set({ variableName: e.target.value })} placeholder="e.g. order_number" />
            </Field>
            <Field label="Validate type">
              <select
                value={String(d.validateType ?? 'any')}
                onChange={(e) => set({ validateType: e.target.value })}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none"
              >
                {['any', 'numeric', 'digits', 'text', 'email', 'phone', 'yes-no'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Error message">
              <Input value={String(d.errorMessage ?? '')} onChange={(e) => set({ errorMessage: e.target.value })} placeholder="Invalid value, please try again." />
            </Field>
          </>
        )}

        {type === 'interactive_menu' && (
          <>
            <Field label="Message mode">
              <div className="grid grid-cols-1 gap-1.5 rounded-xl border border-border/80 bg-muted/35 p-1 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => set({ mode: 'list' })}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-all',
                    String(d.mode ?? 'list') === 'list'
                      ? 'bg-card text-foreground shadow-md ring-1 ring-violet-500/35'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <span className="block font-semibold">List</span>
                  <span className="mt-0.5 block text-[10px] font-normal leading-snug opacity-90">
                    Sections & rows (WhatsApp list)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => set({ mode: 'buttons' })}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-all',
                    String(d.mode ?? 'list') === 'buttons'
                      ? 'bg-card text-foreground shadow-md ring-1 ring-amber-500/35'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <span className="block font-semibold">Quick reply</span>
                  <span className="mt-0.5 block text-[10px] font-normal leading-snug opacity-90">Up to 3 buttons</span>
                </button>
              </div>
            </Field>
            <Field label="Header text (optional)">
              <Input value={String(d.headerText ?? '')} onChange={(e) => set({ headerText: e.target.value })} />
            </Field>
            <Field label="Body text (wraps on canvas & in WhatsApp)">
              <Textarea
                value={String(d.bodyText ?? '')}
                onChange={(e) => set({ bodyText: e.target.value })}
                rows={4}
                className="min-h-[5rem] whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
              />
            </Field>
            <Field label="Save list/button id as variable (optional)">
              <Input
                value={String(d.saveSelectionAs ?? '')}
                onChange={(e) => set({ saveSelectionAs: e.target.value })}
                placeholder="e.g. jobs_department"
              />
            </Field>
            {String(d.mode ?? 'list') === 'list' ? (
              <>
                <Field label="List open button label">
                  <Input value={String(d.buttonLabel ?? 'View options')} onChange={(e) => set({ buttonLabel: e.target.value })} />
                </Field>
                <Field label="Sections & rows">
                  <ListSectionsEditor value={parseSections(d.sections)} onChange={(sections) => set({ sections })} />
                </Field>
              </>
            ) : (
              <Field label="Quick reply buttons">
                <QuickReplyButtonsEditor value={parseButtons(d.buttons)} onChange={(buttons) => set({ buttons })} />
              </Field>
            )}
          </>
        )}

        {type === 'api_call' && (
          <>
            <Field label="Method">
              <select
                value={String(d.method ?? 'GET')}
                onChange={(e) => set({ method: e.target.value })}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none"
              >
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="URL (supports {{variable}})">
              <Input value={String(d.url ?? '')} onChange={(e) => set({ url: e.target.value })} placeholder="https://api.example.com/orders/{{order_id}}" />
            </Field>
            <Field label="Request body type">
              <select
                value={String(d.bodyType ?? 'none')}
                onChange={(e) => set({ bodyType: e.target.value })}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="none">None</option>
                <option value="json">JSON (POST / PUT / PATCH)</option>
              </select>
            </Field>
            {String(d.bodyType ?? 'none') === 'json' ? (
              <Field label="JSON body (use {{var}} inside string values; leave empty for {})">
                <Textarea
                  key={`${node.id}-api-body`}
                  rows={8}
                  className="font-mono text-xs"
                  defaultValue={
                    d.body != null && typeof d.body === 'object' ? JSON.stringify(d.body, null, 2) : typeof d.body === 'string' ? d.body : ''
                  }
                  onBlur={(e) => {
                    const t = e.target.value.trim();
                    if (t === '') {
                      set({ body: null });
                      return;
                    }
                    try {
                      set({ body: JSON.parse(t) as Record<string, unknown> });
                    } catch {
                      toast.error('Invalid JSON body — fix syntax or clear the field.');
                    }
                  }}
                  placeholder={'{\n  "query": "{{search_term}}"\n}'}
                />
              </Field>
            ) : null}
            <Field label="Save full JSON response as variable (optional)">
              <Input value={String(d.saveResponseVar ?? '')} onChange={(e) => set({ saveResponseVar: e.target.value })} placeholder="e.g. api_raw" />
            </Field>
            <Field label="Save response fields → variables">
              <ResponseExtractsEditor value={parseResponseExtracts(d.responseExtracts)} onChange={(responseExtracts) => set({ responseExtracts })} />
            </Field>
            <Field label="Branch rules (match response → output)">
              <MappingsEditor value={parseMappings(d.mappings)} onChange={(mappings) => set({ mappings })} />
            </Field>
          </>
        )}

        {type === 'ai_reply' && (
          <>
            <Field label="Additional system prompt (optional)">
              <Textarea value={String(d.systemPrompt ?? '')} onChange={(e) => set({ systemPrompt: e.target.value })} rows={4} />
            </Field>
            <Field label="Tone">
              <select
                value={String(d.tone ?? 'helpful')}
                onChange={(e) => set({ tone: e.target.value })}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none"
              >
                {['helpful', 'formal', 'casual', 'empathetic', 'technical', 'concise'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Language">
              <select
                value={String(d.language ?? 'auto')}
                onChange={(e) => set({ language: e.target.value })}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none"
              >
                {['auto', 'ar', 'en', 'bilingual'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Save AI response as variable (optional)">
              <Input value={String(d.saveAsVar ?? '')} onChange={(e) => set({ saveAsVar: e.target.value })} placeholder="e.g. ai_reply" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!d.includeHistory} onChange={(e) => set({ includeHistory: e.target.checked })} />
              <span>Include conversation history</span>
            </label>
          </>
        )}

        {type === 'switch_language' && (
          <Field label="Language">
            <select
              value={String(d.language ?? 'EN')}
              onChange={(e) => set({ language: e.target.value })}
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none"
            >
              {['AR', 'EN', 'FR', 'ES', 'DE', 'TR', 'UR'].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        )}

        {type === 'switch_mode' && (
          <>
            <Field label="Routing mode">
              <div className="grid grid-cols-1 gap-1.5 rounded-xl border border-border/80 bg-muted/35 p-1 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => set({ mode: 'manual' })}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-all',
                    String(d.mode ?? 'manual') === 'manual'
                      ? 'bg-card text-foreground shadow-md ring-1 ring-rose-500/35'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <span className="block font-semibold">Manual</span>
                  <span className="mt-0.5 block text-[10px] font-normal leading-snug opacity-90">
                    Agent handles chat; automation pauses
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => set({ mode: 'auto' })}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-all',
                    String(d.mode ?? 'manual') === 'auto'
                      ? 'bg-card text-foreground shadow-md ring-1 ring-teal-500/35'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <span className="block font-semibold">Auto</span>
                  <span className="mt-0.5 block text-[10px] font-normal leading-snug opacity-90">
                    Flow runs on each inbound message
                  </span>
                </button>
              </div>
            </Field>
            <Field label="Auto-revert timer (minutes, 0 = never)">
              <Input
                type="number"
                value={Number(d.autoRevertMinutes ?? 0)}
                onChange={(e) => set({ autoRevertMinutes: parseInt(e.target.value || '0', 10) })}
                min={0}
              />
            </Field>
            <Field label="Trigger words (comma separated)">
              <Input value={String(d.triggerWords ?? '')} onChange={(e) => set({ triggerWords: e.target.value })} placeholder="Extra phrases (close, menu, …). Built-in: close, cancel, stop…" />
            </Field>
          </>
        )}

        {type === 'system_function' && (
          <>
            <Field label="Function name">
              <Input value={String(d.functionName ?? 'track_order')} onChange={(e) => set({ functionName: e.target.value })} />
            </Field>
            <Field label="Parameters">
              <ParametersEditor value={parseParams(d.parameters)} onChange={(parameters) => set({ parameters })} />
            </Field>
            <Field label="Save result as variable">
              <Input value={String(d.saveResultVar ?? '')} onChange={(e) => set({ saveResultVar: e.target.value })} placeholder="e.g. function_result" />
            </Field>
          </>
        )}

        {type === 'loop_goto' && (
          <Field label="Target node ID">
            <select
              value={String(d.targetNodeId ?? '')}
              onChange={(e) => set({ targetNodeId: e.target.value })}
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="">Select a node...</option>
              {allNodeIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </Field>
        )}

        {type === 'rate_service_template' && (
          <>
            <Field label="Template text">
              <Textarea value={String(d.templateText ?? '')} onChange={(e) => set({ templateText: e.target.value })} rows={4} />
            </Field>
            <Field label="Reply window (hours)">
              <Input
                type="number"
                value={Number(d.replyWindowHours ?? 24)}
                onChange={(e) => set({ replyWindowHours: parseInt(e.target.value || '24', 10) })}
                min={1}
              />
            </Field>
            <Field label="Phone variable">
              <Input value={String(d.phoneVariable ?? 'phone')} onChange={(e) => set({ phoneVariable: e.target.value })} />
            </Field>
            <Field label="Order number variable">
              <Input value={String(d.orderNumberVariable ?? 'order_number')} onChange={(e) => set({ orderNumberVariable: e.target.value })} />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}
