import type { NodeTheme } from './NodeFrame';

export const nodeThemes: Record<string, NodeTheme> = {
  start: { headerBg: 'bg-emerald-600', ring: 'ring-emerald-400', iconBg: 'bg-emerald-500/40' },
  send_message: { headerBg: 'bg-blue-600', ring: 'ring-blue-400', iconBg: 'bg-blue-500/40' },
  interactive_menu: { headerBg: 'bg-violet-600', ring: 'ring-violet-400', iconBg: 'bg-violet-500/40' },
  end_flow: { headerBg: 'bg-slate-700', ring: 'ring-slate-400', iconBg: 'bg-slate-500/40' },
  condition: { headerBg: 'bg-amber-600', ring: 'ring-amber-400', iconBg: 'bg-amber-500/40' },
  ask_input: { headerBg: 'bg-cyan-600', ring: 'ring-cyan-400', iconBg: 'bg-cyan-500/40' },
  api_call: { headerBg: 'bg-indigo-600', ring: 'ring-indigo-400', iconBg: 'bg-indigo-500/40' },
  ai_reply: { headerBg: 'bg-fuchsia-600', ring: 'ring-fuchsia-400', iconBg: 'bg-fuchsia-500/40' },
  switch_language: { headerBg: 'bg-teal-600', ring: 'ring-teal-400', iconBg: 'bg-teal-500/40' },
  switch_mode: { headerBg: 'bg-rose-600', ring: 'ring-rose-400', iconBg: 'bg-rose-500/40' },
  system_function: { headerBg: 'bg-lime-700', ring: 'ring-lime-400', iconBg: 'bg-lime-500/40' },
  loop_goto: { headerBg: 'bg-pink-600', ring: 'ring-pink-400', iconBg: 'bg-pink-500/40' },
  rate_service_template: { headerBg: 'bg-green-700', ring: 'ring-green-400', iconBg: 'bg-green-500/40' },
};

