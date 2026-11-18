'use strict';
/**
 * One chat call. Default: the local Ollama server. If LLM_BASE_URL is set: any OpenAI-compatible
 * /chat/completions endpoint, with the key in LLM_API_KEY (environment only; no file is read).
 * LLM_TOKEN_BUDGET is a hard cap on prompt + completion tokens for the whole process: the call that would
 * pass it is refused with an error starting "TOKEN_BUDGET", and the runner stops.
 */
const cfg = require('./config');

let spent = 0;
const budget = () => (process.env.LLM_TOKEN_BUDGET ? Number(process.env.LLM_TOKEN_BUDGET) : Infinity);
const spentTokens = () => spent;

function checkBudget(messages) {
  const estimate = Math.ceil(JSON.stringify(messages).length / 3) + cfg.LIMITS.maxAnswerTokens;
  if (spent + estimate > budget()) throw new Error(`TOKEN_BUDGET reached: ${spent} spent of ${budget()}`);
}

async function ollamaChat(o) {
  const body = {
    model: o.model, messages: o.messages, stream: false, keep_alive: '30m',
    options: { temperature: 0, seed: o.seed, num_ctx: cfg.LIMITS.numCtx, num_predict: o.maxTokens || cfg.LIMITS.maxAnswerTokens },
  };
  if (o.tools && o.tools.length) body.tools = o.tools;
  const res = await fetch(`${cfg.OLLAMA}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  return { message: j.message, promptTokens: j.prompt_eval_count || 0, completionTokens: j.eval_count || 0 };
}

/** The study's internal (Ollama-style) messages to OpenAI-style messages. */
function toOpenAI(messages) {
  const out = []; const pending = []; let n = 0;
  for (const m of messages) {
    if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length) {
      const calls = m.tool_calls.map((c) => { n += 1; pending.push(`call_${n}`); return { id: `call_${n}`, type: 'function', function: { name: c.function.name, arguments: JSON.stringify(c.function.arguments || {}) } }; });
      out.push({ role: 'assistant', content: m.content || null, tool_calls: calls });
    } else if (m.role === 'tool') {
      if (pending.length) out.push({ role: 'tool', tool_call_id: pending.shift(), content: m.content });
      else out.push({ role: 'user', content: `Result of ${m.tool_name || 'the tool'}:\n${m.content}` });
    } else out.push({ role: m.role, content: m.content });
  }
  return out;
}

async function openAIChat(o) {
  const body = { model: o.model, messages: toOpenAI(o.messages), temperature: 0, seed: o.seed, max_tokens: o.maxTokens || cfg.LIMITS.maxAnswerTokens };
  if (o.tools && o.tools.length) body.tools = o.tools;
  const res = await fetch(`${process.env.LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.LLM_API_KEY || ''}` }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`endpoint ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json(); const m = j.choices[0].message;
  const tool_calls = (m.tool_calls || []).map((c) => ({ function: { name: c.function.name, arguments: JSON.parse(c.function.arguments || '{}') } }));
  return { message: { role: 'assistant', content: m.content || '', tool_calls: tool_calls.length ? tool_calls : undefined },
    promptTokens: j.usage ? j.usage.prompt_tokens : 0, completionTokens: j.usage ? j.usage.completion_tokens : 0 };
}

/**
 * @param {{model:string, messages:object[], tools?:object[], seed:number, maxTokens?:number}} o
 * @returns {Promise<{message:object, promptTokens:number, completionTokens:number}>}
 */
async function chat(o) {
  checkBudget(o.messages);
  const r = await (process.env.LLM_BASE_URL ? openAIChat(o) : ollamaChat(o));
  spent += r.promptTokens + r.completionTokens;
  return r;
}

module.exports = { chat, toOpenAI, spentTokens };
