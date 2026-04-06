function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderWebApp({ authRequired = false } = {}) {
  const authBanner = authRequired
    ? '<p class="hint">This server requires a shared access token for query actions.</p>'
    : '<p class="hint">This server is in local-only mode. Ask the wiki directly from your browser.</p>';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design Wiki</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe6;
        --panel: rgba(255, 252, 247, 0.92);
        --line: #d7c8b2;
        --ink: #221c18;
        --muted: #62584f;
        --accent: #1d5c4f;
        --accent-strong: #14453b;
        --danger: #8b3a2b;
        --shadow: 0 20px 50px rgba(55, 37, 17, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(29, 92, 79, 0.17), transparent 34%),
          radial-gradient(circle at top right, rgba(167, 109, 59, 0.18), transparent 28%),
          linear-gradient(180deg, #f8f4ec 0%, var(--bg) 100%);
      }

      main {
        width: min(920px, calc(100vw - 28px));
        margin: 28px auto;
        padding: 28px;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--panel);
        box-shadow: var(--shadow);
        backdrop-filter: blur(14px);
      }

      h1 {
        margin: 0 0 10px;
        font-size: clamp(2rem, 4vw, 3.3rem);
        line-height: 0.98;
        letter-spacing: -0.04em;
      }

      p,
      li,
      label,
      input,
      textarea,
      button {
        font: inherit;
      }

      .lede {
        margin: 0;
        color: var(--muted);
        max-width: 60ch;
      }

      .grid {
        display: grid;
        grid-template-columns: 1.6fr 1fr;
        gap: 18px;
        margin-top: 24px;
      }

      .card {
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.6);
      }

      .card h2 {
        margin: 0 0 12px;
        font-size: 1.2rem;
      }

      .label {
        display: block;
        margin-bottom: 8px;
        font-size: 0.96rem;
        color: var(--muted);
      }

      textarea,
      input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid #c9baa6;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.82);
        color: var(--ink);
      }

      textarea {
        min-height: 180px;
        resize: vertical;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 12px;
      }

      button {
        border: 0;
        border-radius: 999px;
        padding: 11px 16px;
        background: var(--accent);
        color: white;
        cursor: pointer;
      }

      button.secondary {
        background: #785f45;
      }

      button.ghost {
        background: transparent;
        color: var(--accent-strong);
        border: 1px solid var(--line);
      }

      button:disabled {
        opacity: 0.55;
        cursor: wait;
      }

      .hint {
        margin: 0 0 10px;
        color: var(--muted);
      }

      .status {
        min-height: 1.4em;
        color: var(--muted);
      }

      .status.error {
        color: var(--danger);
      }

      .status.ok {
        color: var(--accent-strong);
      }

      .response {
        display: grid;
        gap: 14px;
      }

      .metric {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        color: var(--muted);
        background: rgba(255, 255, 255, 0.65);
      }

      pre,
      code {
        font-family: "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace;
      }

      pre {
        white-space: pre-wrap;
        margin: 0;
      }

      ul {
        margin: 0;
        padding-left: 18px;
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }

      .mono {
        color: var(--muted);
        font-family: "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace;
        font-size: 0.9rem;
      }

      @media (max-width: 840px) {
        main {
          width: min(100vw - 16px, 100%);
          margin: 8px auto;
          padding: 16px;
          border-radius: 18px;
        }

        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <p class="mono">Private Design Wiki</p>
      <h1>Ask The Wiki</h1>
      <p class="lede">Question your compiled local wiki, inspect citations, and review draft knowledge gaps without leaving the browser.</p>
      <div class="grid">
        <section class="card">
          <h2>Question</h2>
          ${authBanner}
          <label class="label" for="token">Access token</label>
          <input id="token" type="password" autocomplete="current-password" placeholder="${escapeHtml(authRequired ? 'Required for remote access' : 'Optional')}">
          <label class="label" for="question" style="margin-top: 14px;">What do you want to design?</label>
          <textarea id="question" placeholder="How should I structure a project-design wiki for recurring product decisions?"></textarea>
          <div class="actions">
            <button id="askButton" type="button">Ask</button>
            <button id="reviewButton" type="button" class="secondary">Review Drafts</button>
            <button id="promoteButton" type="button" class="ghost">Promote Draft</button>
          </div>
          <p id="status" class="status"></p>
        </section>
        <section class="card response">
          <div class="toolbar">
            <h2 style="margin: 0;">Latest Answer</h2>
            <span id="confidence" class="metric">Confidence: --</span>
          </div>
          <div>
            <strong>Recommendation</strong>
            <pre id="recommendation">No answer yet.</pre>
          </div>
          <div>
            <strong>Why this is best</strong>
            <pre id="answer">Ask a question to see a grounded answer.</pre>
          </div>
          <div>
            <strong>Alternatives</strong>
            <ul id="alternatives"><li>None</li></ul>
          </div>
          <div>
            <strong>Citations</strong>
            <ul id="citations"><li>None</li></ul>
          </div>
          <div>
            <strong>Missing knowledge</strong>
            <ul id="missingKnowledge"><li>None</li></ul>
          </div>
          <div>
            <strong>Draft updates</strong>
            <ul id="draftUpdates"><li>None</li></ul>
          </div>
        </section>
      </div>
    </main>
    <script>
      const tokenInput = document.getElementById('token');
      const questionInput = document.getElementById('question');
      const askButton = document.getElementById('askButton');
      const reviewButton = document.getElementById('reviewButton');
      const promoteButton = document.getElementById('promoteButton');
      const statusEl = document.getElementById('status');
      const recommendationEl = document.getElementById('recommendation');
      const answerEl = document.getElementById('answer');
      const alternativesEl = document.getElementById('alternatives');
      const citationsEl = document.getElementById('citations');
      const confidenceEl = document.getElementById('confidence');
      const missingKnowledgeEl = document.getElementById('missingKnowledge');
      const draftUpdatesEl = document.getElementById('draftUpdates');

      const TOKEN_STORAGE_KEY = 'design-wiki-token';
      tokenInput.value = localStorage.getItem(TOKEN_STORAGE_KEY) || '';

      function setStatus(message, kind) {
        statusEl.textContent = message || '';
        statusEl.className = 'status' + (kind ? ' ' + kind : '');
      }

      function setBusy(isBusy) {
        askButton.disabled = isBusy;
        reviewButton.disabled = isBusy;
        promoteButton.disabled = isBusy;
      }

      function renderList(target, items, mapper) {
        target.innerHTML = '';
        const values = Array.isArray(items) && items.length > 0 ? items : [null];
        for (const item of values) {
          const li = document.createElement('li');
          li.textContent = item == null ? 'None' : mapper(item);
          target.appendChild(li);
        }
      }

      async function postJson(path, payload) {
        const token = tokenInput.value.trim();
        if (token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }

        const response = await fetch(path, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(token ? { 'x-design-wiki-token': token } : {}),
          },
          body: JSON.stringify(payload || {}),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = data && data.error ? data.error : 'request_failed';
          throw new Error(error);
        }
        return data;
      }

      function renderQueryResult(result) {
        recommendationEl.textContent = result.recommendation || 'None';
        answerEl.textContent = result.answer || 'None';
        confidenceEl.textContent = 'Confidence: ' + Number(result.confidence || 0).toFixed(2);
        renderList(alternativesEl, result.alternatives, (value) => value);
        renderList(citationsEl, result.citations, (value) => value.title + ' (' + value.path + ')');
        renderList(missingKnowledgeEl, result.missing_knowledge, (value) => value);
        renderList(draftUpdatesEl, result.draft_updates_created, (value) => value.slug + ' (' + value.path + ')');
      }

      askButton.addEventListener('click', async () => {
        const question = questionInput.value.trim();
        if (!question) {
          setStatus('A question is required.', 'error');
          return;
        }

        try {
          setBusy(true);
          setStatus('Querying the wiki...', '');
          const result = await postJson('/query', { question });
          renderQueryResult(result);
          setStatus('Answer updated.', 'ok');
        } catch (error) {
          setStatus(error.message === 'unauthorized' ? 'Access token required or invalid.' : error.message, 'error');
        } finally {
          setBusy(false);
        }
      });

      reviewButton.addEventListener('click', async () => {
        try {
          setBusy(true);
          setStatus('Loading pending drafts...', '');
          const result = await postJson('/review-updates', {});
          renderList(draftUpdatesEl, result.pending, (value) => value.slug + ' (' + value.path + ')');
          setStatus('Draft list updated.', 'ok');
        } catch (error) {
          setStatus(error.message === 'unauthorized' ? 'Access token required or invalid.' : error.message, 'error');
        } finally {
          setBusy(false);
        }
      });

      promoteButton.addEventListener('click', async () => {
        const draftSlug = window.prompt('Draft slug to promote?');
        if (!draftSlug) {
          return;
        }

        try {
          setBusy(true);
          setStatus('Promoting draft...', '');
          const result = await postJson('/promote', { draftSlug: draftSlug.trim() });
          renderList(draftUpdatesEl, [result.promoted], (value) => value.slug + ' (' + value.path + ')');
          setStatus('Draft promoted.', 'ok');
        } catch (error) {
          setStatus(error.message === 'unauthorized' ? 'Access token required or invalid.' : error.message, 'error');
        } finally {
          setBusy(false);
        }
      });
    </script>
  </body>
</html>`;
}
