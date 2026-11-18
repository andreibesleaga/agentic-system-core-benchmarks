'use strict';
/** The shared tool loop of C0, C1 and C2: same limits, same parsing, whatever the tools are. */
const cfg = require('./config');
const { chat } = require('./llm');
const { FORMAT } = require('./prompts');

const cap = (s) => (s.length > cfg.LIMITS.toolResultChars
  ? `${s.slice(0, cfg.LIMITS.toolResultChars)}\n[truncated to ${cfg.LIMITS.toolResultChars} characters]` : s);

/** Some local models write the call as JSON in the message text; read that form too, for every condition. */
function callsFrom(message, toolNames) {
  if (message.tool_calls && message.tool_calls.length) {
    return message.tool_calls.map((c) => ({ name: c.function.name, args: c.function.arguments || {} }));
  }
  const text = (message.content || '').trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  if (!text.startsWith('{') && !text.startsWith('[')) return [];
  try {
    const j = JSON.parse(text);
    return (Array.isArray(j) ? j : [j])
      .filter((c) => c && toolNames.includes(c.name))
      .map((c) => ({ name: c.name, args: c.arguments || c.parameters || {} }));
  } catch { return []; }
}

/**
 * @param {{model:string, seed:number, system:string, question:string, tools:object[],
 *          exec:(name:string,args:object)=>Promise<string>}} o
 */
async function runToolAgent(o) {
  const messages = [{ role: 'system', content: o.system }, { role: 'user', content: o.question }, ...(o.prelude || [])];
  const names = o.tools.map((t) => t.function.name);
  const calls = [];
  let promptTokens = 0; let completionTokens = 0; let draft = ''; let contextStop = false;
  for (let step = 0; step < cfg.LIMITS.toolCalls + 3; step += 1) {
    const left = contextStop ? 0 : cfg.LIMITS.toolCalls - calls.length;
    const r = await chat({ model: o.model, seed: o.seed, messages, tools: left > 0 ? o.tools : [] });
    promptTokens += r.promptTokens; completionTokens += r.completionTokens;
    const wanted = left > 0 ? callsFrom(r.message, names) : [];
    if (!wanted.length) { draft = (r.message.content || '').trim(); break; }
    messages.push(r.message.tool_calls ? r.message : { role: 'assistant', content: r.message.content });
    for (const c of wanted.slice(0, left)) {
      let out; let ok = true;
      try { out = cap(await o.exec(c.name, c.args)); } catch (e) { out = `error: ${e.message}`; ok = false; }
      calls.push({ name: c.name, args: c.args, ok, chars: out.length });
      messages.push({ role: 'tool', tool_name: c.name, content: out });
    }
    // Never let the prompt outgrow the context (Ollama would silently drop its start): stop calling tools instead.
    const added = messages.slice(-wanted.length).reduce((a, m) => a + m.content.length / 3, 0);
    if (r.promptTokens + r.completionTokens + added > cfg.LIMITS.numCtx - 900) contextStop = true;
    if (contextStop || calls.length >= cfg.LIMITS.toolCalls) {
      messages.push({ role: 'user', content: 'No more tool calls are possible. Answer now from what you have read.' });
    }
  }
  if (draft) messages.push({ role: 'assistant', content: draft });
  const fin = await chat({ model: o.model, seed: o.seed, messages: [...messages, { role: 'user', content: FORMAT }] });
  promptTokens += fin.promptTokens; completionTokens += fin.completionTokens;
  return { answer: (fin.message.content || '').trim(), toolCalls: calls, promptTokens, completionTokens, steps: calls.length + 1, contextStop, messages: [...messages, { role: 'user', content: FORMAT }, fin.message] };
}

module.exports = { runToolAgent, callsFrom, cap };
