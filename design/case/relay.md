# The development model relay (M7)

`tools/model-relay.mjs` (server), `src/make/voice.js` (page side), `tests/.relay.mjs` (test). Built for R57/R58 from
`family-read.md` §5 "The narrowest model calls". The case plays with no model; this is what lets a model voice it during
development. Credential (decision 4, settled by Kabe 2026-10-07 through his monitor: "for four I only want open AI OAuth for the
development process ... easy to wire. It was already established by the construct as well"): the development path is the
ChatGPT subscription sign-in, as construct does it. The metered key and the mock stay behind the same interface.

## Run it

```
node tools/model-relay.mjs                                   # mock provider, 127.0.0.1:8798; no key, no network
node tools/model-relay.mjs --cache-dir ~/.cache/holo-relay   # also cache answers on disk (default: memory only)

# a metered OpenAI key (decision 4a)
export OPENAI_API_KEY=sk-...                  # or a file ~/.config/holo-emitter/openai.key, mode 0600 (refused otherwise)
node tools/model-relay.mjs --provider openai

# the ChatGPT subscription sign-in (decision 4b, the chosen development path): needs `codex login` done once
node tools/model-relay.mjs --provider subscription

node tests/.relay.mjs                         # 121 checks, under a second, needs nothing running (fake upstreams only)
```

The page: `import { makeVoice } from "./voice.js"; const v = makeVoice();` then `await v.available()`, `v.read(...)`,
`v.voice(...)`, `v.beat(...)`. Every call resolves, never throws, and says `fallback: true` when the page must use the
no-model path. `GET /stats` shows the running totals; `GET /health` is the liveness check.

Options (flags or environment): `--provider` / `RELAY_PROVIDER` (`mock` default, `openai`, `subscription`), `--port` /
`RELAY_PORT` (8798), `--cache-dir` / `RELAY_CACHE_DIR`, `--test-hooks` (tests only), `RELAY_BUDGET_USD` (default 5, the
relay stops calling the provider past it), `RELAY_UPSTREAM_TIMEOUT_MS` (20000), `RELAY_MAX_OUTPUT_TOKENS` (400).

## Providers

| provider | state | notes |
|---|---|---|
| `mock` | built, default | deterministic, free; for tests and the no-key case (below) |
| `openai` | built, untried against the real API (no key here); tested against a local fake | Responses API with strict structured outputs by default; `RELAY_OPENAI_API=chat` uses chat completions instead. `OPENAI_BASE_URL` redirects it (tests, proxies). `store:false` is sent. |
| `subscription` | built; the chosen development path. Smoke-tested once for real 2026-10-07 (below); the rest tested against a local fake SSE server | Mirrors construct's `CodexProvider` (`/home/k/Newproject/construct/provider.py`): see "Subscription provider". |

**Model names.** For `openai` they are not verified: I could not check which models that account offers or their prices.
The default is `gpt-4.1-mini` for all three jobs. For `subscription` the default is `gpt-5.5`, because it is the one that
worked on this machine's sign-in (below); construct's cheap-tier default `gpt-5.4-mini` is refused by it. Set `RELAY_MODEL` for all, or `RELAY_MODEL_READ`, `RELAY_MODEL_VOICE`,
`RELAY_MODEL_BEAT` per job. Any model that supports strict `json_schema` structured outputs works; a non-reasoning small
model is the right shape (the calls are short and want about a second).

## Subscription provider (decision 4b)

Mirrors construct's `CodexProvider`, the explicit opt-in personal-use path, so it works the same way and can be read side
by side with it.

- **Credential.** `~/.codex/auth.json` (`RELAY_CODEX_AUTH` to move it), `tokens.access_token` and `tokens.account_id`,
  re-read on every call, so whenever the `codex` CLI refreshes it the relay has the new one. The relay never writes,
  refreshes or copies it. Missing or unreadable file: a clear error naming `codex login`, and no network call.
- **Wire.** `POST https://chatgpt.com/backend-api/codex/responses` (`RELAY_CODEX_BASE_URL`), as construct's `_headers`
  and `_body`: bearer token, `chatgpt-account-id`, `originator: pi` and a `pi (...)` User-Agent (this presents the relay as
  another client, the point `family-read.md` §6 flagged, accepted by Kabe by choosing this path), `OpenAI-Beta:
  responses=experimental`, `accept: text/event-stream`, `session_id`; body `store:false`, `stream:true`, `include:
  ["reasoning.encrypted_content"]`, `text.format` json_schema without `strict` (as the consumer wire ships), the schema
  forced to all-properties-required and `additionalProperties:false`, `reasoning {effort, summary:"auto"}` on gpt-5 models,
  `prompt_cache_key`. Payload capped at 40 KB.
- **Stream.** Server-sent events are read to the `response.completed` (or `response.done`) event's output text, else the
  concatenated `response.output_text.delta` text; the usage in that event is the token count. A failed stream falls back.
- **Errors.** 401 is final: "run `codex login`". A dropped connection is retried twice with a growing backoff
  (`RELAY_TRANSIENT_BACKOFF_MS`, 2000); timeouts are not retried. Timeout `RELAY_UPSTREAM_TIMEOUT_MS`, 60000 here (construct
  allows 180 s for its cheap tier; the page's own limit is `voice.js`'s `timeoutMs`).
- **Models and effort.** `RELAY_MODEL` (or `_READ`, `_VOICE`, `_BEAT`), default `gpt-5.5`; `RELAY_EFFORT`, default `low`
  (construct measured effort as the latency cliff). `HOLODECK_CODEX_CHEAP_MODEL` and `HOLODECK_CODEX_CHEAP_EFFORT` are
  honoured too, so one environment can serve both projects.
- **Cost.** Not metered here: `cost_usd` is 0. Calls draw on the subscription's usage allowance instead; `/stats` still
  counts calls and tokens.
- **Startup.** Prints a notice that it is using the person's ChatGPT subscription credential, for development only.

Real smoke call, 2026-10-07, one tiny `read` job, `gpt-5.5`: parsed, `{"topic":"alibi","stance":"ask"}`, 236 tokens in, 33
out, 1.7 s end to end. Tried and refused by this account ("not supported when using Codex with a ChatGPT account"):
`gpt-5.4-mini`, `gpt-5.4`, `gpt-5.1-codex-mini`, `gpt-5-mini`. `~/.codex/config.toml` names a different model again, so
which models the sign-in allows changes with the account and the week; if a call returns that 400, set `RELAY_MODEL`.
At about 1.7 s a call, `voice.js`'s 4 s default timeout holds, with a two-call question near 3.5 s; raise `timeoutMs` for
slow spells.

**Mock answers.** read: the topic whose label and id share the most words with the utterance (`none` if no word is
shared), stance by keyword (`accuse`, `show`, `press`, `chat`, else `ask`). voice: the facts' text in a plain period
template by act (`tell`, `lie` state them; `deflect`, `refuse`, `dontknow` state none), cut to `max_words`. beat: the first
menu item, its seed as the line.

## The jobs

The page sends `{job, input}`; the relay builds the output schema from the input, so ids are closed enums. A caller's
`schema` field, if sent, is checked in addition (it can narrow, never widen).

**read** (what the player's words are about). In: `suspect` (string), `utterance` (at most 200 chars), `topics` (at most 16
of `{id,label}`). Out:
```
{ topic: enum[ topic ids..., "none" ], stance: enum[ask, press, accuse, show, chat] }   both required, nothing else
```

**voice** (a suspect says it). In: `persona` (about 60 words), `act` (tell, deflect, refuse, lie, dontknow), `facts` (at most
3 of `{id,text}`, empty for dontknow), `last` (at most the last 2 lines), `max_words`. Out:
```
{ line: string (1 to max_words words), used: array of enum[ fact ids ], at least 1 for tell and lie }
```
The relay can check the line's size and that `used` is within the facts. It cannot check that the line invents nothing:
that is the page's truth check against the world lexicon. `voice(input, { check })` takes it: a line it rejects gets one
retry, then the fact text itself in plain words.

**beat** (the narrator's next move). In: `backbone` (string or `{theme, shape, phase}`), `menu` (1 to 5 of `{id, kind,
seed}`, each one code has already proved true now), `quiet_turns`. Out:
```
{ pick: enum[ menu ids ], line: string (1 to 40 words) }
```

**Validation and fallback.** Every output is checked by a small validator (`validate` in the relay: object with
`required` and `additionalProperties:false`, string with `enum`, `minLength`, `maxLength` and `maxWords`, array with
`items`, `minItems`, `maxItems`). On failure the relay retries once, telling the model what was wrong; a second failure
(or a provider error) answers `{ok:false, fallback:true, error}`. Errors that cannot improve (401, 403, 404, no quota) do
not retry. A failed call is never cached. `voice.js` also re-checks the shape (a relay is not trusted either) and on any
problem resolves:

- read: `{fallback:true}`, so the page offers the topic list;
- voice: `{fallback:true, line:<the facts' own text, empty for deflect/refuse/dontknow>, used:<ids>}`, so the page says the
  case's written line;
- beat: `{fallback:true, pick:menu[0].id, line:menu[0].seed}`, so the page prints the first item's seed.

After a network failure or timeout `voice.js` skips the relay for 15 s, so a dead relay costs one timeout, not one per
question. Default timeout 4 s.

## Cost accounting

Each reply carries `tokens {in,out}`, `cost_usd`, `ms`, `model`, `cached`. Cost is `tokens_in x price_in + tokens_out x
price_out` per million, summed over the retry too. Prices are configured, not known: `RELAY_PRICES='{"model":[in,out]}'`
(USD per million tokens), else `RELAY_PRICE_IN` / `RELAY_PRICE_OUT` (placeholders 0.40 and 1.60, **unverified**). Treat
cost as an estimate and check the provider's usage page; mock reports 0. Cache hits cost 0 and add the original cost to
`saved_usd`. `GET /stats` gives, in total and per job: calls, ok, cached, failed, retries, tokens, cost, saved, mean and
max ms. Every call logs one line: `[relay] read openai gpt-4.1-mini ok in=210 out=18 $0.000113`. R59's receipts (calls,
time, cost per play) come from `/stats` after a play. Expected scale: about 2 calls a question, 60 to 70 a play, each a few
hundred tokens in and tens out, so cents per play at small-model prices.

## Safety

- Bound to `127.0.0.1` only. Requests whose `Host` is not localhost are refused (DNS rebinding); `Origin`, when sent, must
  be `localhost`, `127.0.0.1` or `[::1]` on any port, else 403 (this also stops a web page elsewhere spending the key).
  `POST /call` needs `Content-Type: application/json`. Bodies over 32 KB are refused. CORS and the private-network
  preflight header are sent only to those origins.
- The key or token lives in this process only. It is sent to the provider as a bearer header, never logged, never
  returned, never written to the cache, and scrubbed (also anything shaped like `sk-...` or a JWT) from upstream error text
  before it reaches a log, a reply or `/stats`. A key file readable by group or others is refused. The test checks that
  neither a key nor a subscription token, account id or refresh token appears in a log line, stats, reply or cache file.
- `--test-hooks` (answer injection for tests) is off unless asked for.
- A phone cannot reach a relay bound to localhost. For phone play during development, the page's dev server would have to
  forward a path to the relay; that is not built (it means editing the server, outside this item).

## Why dev only

The published site is static files, and a credential in a page is a credential given to every visitor. So the relay lives
on the development machine, and the published case plays on the topic list. A visitor's own key, in their browser against
the provider directly, is a separate later choice (it would need a `voice.js` mode that calls the provider itself; not
built). The model is also never the authority: it picks among ids code supplies and phrases facts code supplies, and each
answer is checked before use, so a bad model day degrades to the topic list rather than to a wrong story.

## Not done

- Not exercised against the real OpenAI API (no key in this environment): the request and response shapes follow the
  documented Responses and chat-completions structured-outputs formats, and are tested against a local fake that
  records them. First real call may need a model name or a field adjusted.
- The world-lexicon truth check is the page's (R57); `voice.js` only hosts it.
- The subscription path depends on an undocumented consumer endpoint that can change without notice, and on the `codex`
  CLI keeping `auth.json` fresh. If it breaks, the relay returns fallback and play continues on the topic list.
