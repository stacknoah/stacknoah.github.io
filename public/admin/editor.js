(async function () {
  const loading = document.getElementById('editor-loading');
  try {
    if (!window.CMS) throw new Error('editor-unavailable');
    const response = await fetch('/admin/config.yml');
    if (!response.ok) throw new Error('config-unavailable');
    const config = await response.json();
    const { CMS, h, createClass } = window;
    const params = new URLSearchParams(location.search);
    const preview = document.querySelector('meta[name="local-editor-preview"]')?.content === 'enabled' && params.has('demo');
    if (preview) {
      config.backend = { name: 'test-repo', login: false };
      config.local_backend = false;
      document.body.dataset.demo = 'true';
      loading.textContent = '저장 테스트용 편집기를 불러오는 중…';
    }

    const categoryKeys = { CS: 'cs', Security: 'security', Consulting: 'consulting', IT: 'it', OT: 'ot' };
    const topicField = config.collections.find((c) => c.name === 'notes').fields.find((f) => f.name === 'topic');
    const topics = topicField.options.map((option) => ({ ...option, group: option.label.split(' / ')[0] }));

    CMS.registerWidget('topic', createClass({
      getInitialState() { return { group: '' }; },
      render() {
        const current = topics.find((t) => t.value === this.props.value);
        const existingCategory = this.props.entry?.getIn(['data', 'category']);
        const categoryLabel = Object.keys(categoryKeys).find((key) => categoryKeys[key] === existingCategory);
        const group = this.state.group || current?.group || categoryLabel || '';
        return h('div', { className: 'topic-picker' }, [
          h('select', {
            key: 'category', id: this.props.forID, 'aria-label': '대분류', value: group,
            onChange: (event) => {
              const next = event.target.value;
              this.setState({ group: next });
              this.props.onChange(topics.find((t) => t.group === next)?.value || '');
            },
          }, [h('option', { key: 'empty', value: '' }, '분류 선택'), ...Object.keys(categoryKeys).map((key) => h('option', { key, value: key }, key))]),
          h('span', { key: 'slash', 'aria-hidden': true }, '/'),
          h('select', {
            key: 'topic', 'aria-label': '컬럼', value: this.props.value || '', disabled: !group,
            onChange: (event) => this.props.onChange(event.target.value),
          }, [h('option', { key: 'empty', value: '' }, '컬럼 선택'), ...topics.filter((t) => t.group === group).map((t) => h('option', { key: t.value, value: t.value }, t.value))]),
        ]);
      },
    }));

    CMS.registerEventListener({
      name: 'preSave',
      handler: ({ entry }) => {
        let data = entry.get('data');
        if (entry.get('collection') === 'daily') {
          const title = String(data.get('title') || '').trim();
          if (!title || title.length > 300) throw new Error('한 줄 기록은 1~300자로 입력해주세요');
          data = data.set('title', title);
          const href = String(data.get('sourceUrl') || '').trim();
          if (href) {
            let url;
            try { url = new URL(href); } catch { throw new Error('출처 주소를 확인해주세요'); }
            if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
              throw new Error('http 또는 https 웹 주소를 입력해주세요');
            }
          }
          data = data.set('sourceUrl', href);
        }
        if (['notes', 'articles'].includes(entry.get('collection'))) {
          const topic = topics.find((t) => t.value === data.get('topic'));
          if (topic) data = data.set('category', categoryKeys[topic.group]);
        }
        return data;
      },
    });

    // A chapter selected at the desk becomes the editor's default, never an edit to an existing entry.
    const match = location.hash.match(/^#\/collections\/([^/]+)\/new$/);
    const order = Number(params.get('chapter'));
    const collection = config.collections.find((c) => c.name === match?.[1]);
    if (collection && Number.isInteger(order) && order > 0) {
      const field = collection.fields.find((f) => f.name === 'order');
      const option = field?.options.find((o) => Number(o.value) === order);
      if (option) {
        field.default = order;
        collection.fields.find((f) => f.name === 'title').default = option.label.replace(/^\d+\s+/, '');
      }
    }

    const settings = document.getElementById('editor-settings');
    const showSettings = (open) => {
      document.body.classList.toggle('settings-open', open);
      settings.setAttribute('aria-pressed', String(open));
    };
    settings.addEventListener('click', () => showSettings(!document.body.classList.contains('settings-open')));
    const important = new Set(['title', 'body', 'topic', 'order', 'summary', 'domain', 'status']);
    function decorate() {
      const pane = Array.from(document.querySelectorAll('[class*="ControlPaneContainer"]'))
        .find((element) => element.querySelector(':scope > div > label[for]'));
      document.body.classList.toggle('is-writing', !!pane);
      settings.hidden = !pane;
      if (!pane) return;
      const daily = location.hash.startsWith('#/collections/daily/');
      settings.hidden = daily;
      pane.classList.add('writing-pane');
      for (const control of pane.children) {
        const label = control.querySelector(':scope > label[for]');
        if (!label) continue;
        const name = label.htmlFor.split('-field-')[0];
        control.dataset.writingField = name;
        control.classList.toggle('secondary-field', !daily && !important.has(name));
        if (name === 'title') {
          const input = control.querySelector('input');
          if (input) input.placeholder = daily ? '오늘 배운 핵심을 한 문장으로' : '제목';
        }
      }
      if (pane.querySelector('[class*="ControlErrorsList"]')) showSettings(true);
    }
    const observer = new MutationObserver(decorate);
    observer.observe(document.getElementById('nc-root') || document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => { showSettings(false); decorate(); });
    config.load_config_file = false;
    CMS.init({ config });
    loading.hidden = true;
    decorate();
  } catch (error) {
    loading.textContent = '편집기를 불러오지 못했어. 연결을 확인하고 새로고침해줘.';
    document.getElementById('editor-settings').hidden = true;
  }
})();
