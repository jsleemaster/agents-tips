const { Modal, Notice, Plugin, PluginSettingTab, Setting, requestUrl } = require('obsidian');

const DEFAULT_SETTINGS = {
  engineUrl: 'http://127.0.0.1:43121',
  queryFile: 'Design Wiki Answers.md',
};

function buildQueryMarkdown(result) {
  const citations = (result.citations || []).map((citation) => `- ${citation.title} (${citation.path})`).join('\n') || '- none';
  const alternatives = (result.alternatives || []).map((alternative) => `- ${alternative}`).join('\n') || '- none';
  const missingKnowledge = (result.missing_knowledge || []).map((item) => `- ${item}`).join('\n') || '- none';
  const autoUpdates = (result.auto_updates_applied || []).map((item) => `- ${item}`).join('\n') || '- none';
  const draftUpdates = (result.draft_updates_created || []).map((item) => `- ${item.slug} (${item.path})`).join('\n') || '- none';

  return `# Design Wiki Answer

## Recommended Approach

${result.recommendation}

## Why This Is Best

${result.answer}

## Alternatives

${alternatives}

## Citations

${citations}

## Confidence: ${Number(result.confidence || 0).toFixed(2)}

## Missing Knowledge

${missingKnowledge}

## Auto Updates Applied

${autoUpdates}

## Draft Updates Created

${draftUpdates}
`;
}

function buildReviewMarkdown(review) {
  const pending = (review.pending || [])
    .map((draft) => `- ${draft.slug} | ${draft.title} | ${draft.path}`)
    .join('\n') || '- none';

  return `# Pending Draft Updates

${pending}
`;
}

class PromptModal extends Modal {
  constructor(app, title, placeholder, onSubmit) {
    super(app);
    this.modalTitle = title;
    this.placeholder = placeholder;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: this.modalTitle });
    const textarea = contentEl.createEl('textarea');
    textarea.rows = 10;
    textarea.style.width = '100%';
    textarea.placeholder = this.placeholder;
    textarea.focus();

    const actions = contentEl.createDiv({ cls: 'design-wiki-actions' });
    const submitButton = actions.createEl('button', { text: 'Submit' });
    submitButton.addEventListener('click', async () => {
      await this.onSubmit(textarea.value.trim());
      this.close();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

class DesignWikiSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Engine URL')
      .setDesc('Local design wiki engine base URL.')
      .addText((text) => text
        .setPlaceholder('http://127.0.0.1:43121')
        .setValue(this.plugin.settings.engineUrl)
        .onChange(async (value) => {
          this.plugin.settings.engineUrl = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Answer file')
      .setDesc('Vault file that stores the latest design wiki responses.')
      .addText((text) => text
        .setPlaceholder('Design Wiki Answers.md')
        .setValue(this.plugin.settings.queryFile)
        .onChange(async (value) => {
          this.plugin.settings.queryFile = value.trim();
          await this.plugin.saveSettings();
        }));
  }
}

module.exports = class DesignWikiThinWrapperPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new DesignWikiSettingTab(this.app, this));

    this.addCommand({
      id: 'ask-design-wiki',
      name: 'Ask Design Wiki',
      callback: () => {
        new PromptModal(this.app, 'Ask Design Wiki', 'How should I design this project?', async (question) => {
          if (!question) {
            new Notice('Question is required.');
            return;
          }

          const result = await this.postJson('/query', { question });
          await this.writeResult(buildQueryMarkdown(result));
          new Notice('Design wiki answer written.');
        }).open();
      },
    });

    this.addCommand({
      id: 'review-suggested-updates',
      name: 'Review Suggested Updates',
      callback: async () => {
        const review = await this.postJson('/review-updates', {});
        await this.writeResult(buildReviewMarkdown(review));
        new Notice('Pending draft updates written.');
      },
    });

    this.addCommand({
      id: 'promote-draft-insight',
      name: 'Promote Draft Insight',
      callback: () => {
        new PromptModal(this.app, 'Promote Draft Insight', 'draft-slug', async (draftSlug) => {
          if (!draftSlug) {
            new Notice('Draft slug is required.');
            return;
          }

          const result = await this.postJson('/promote', { draftSlug });
          await this.writeResult(`# Promotion Result\n\nPromoted: ${result.promoted.slug} -> ${result.promoted.path}\n`);
          new Notice('Draft promoted.');
        }).open();
      },
    });
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async postJson(pathname, body) {
    const response = await requestUrl({
      url: `${this.settings.engineUrl}${pathname}`,
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify(body),
    });

    if (response.status >= 400) {
      throw new Error(response.text || `Request failed with status ${response.status}`);
    }

    return response.json;
  }

  async writeResult(content) {
    const filePath = this.settings.queryFile;
    const existing = this.app.vault.getAbstractFileByPath(filePath);

    if (existing) {
      await this.app.vault.modify(existing, content);
      await this.app.workspace.getLeaf(true).openFile(existing);
      return;
    }

    const file = await this.app.vault.create(filePath, content);
    await this.app.workspace.getLeaf(true).openFile(file);
  }
};
