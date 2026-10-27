// 제공 PC 조회와 연결 화면의 상태만 읽어 요약한다. 새 조회나 서버 쓰기 동작은 추가하지 않는다.
const $ = id => document.getElementById(id);
const HISTORY_LIMIT = 12;
const history = [];

const text = node => node?.textContent?.trim() || '확인 불가';
const safeTime = value => {
  if (typeof value !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return '조회 시각 확인 불가';
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toLocaleString('ko-KR') : '조회 시각 확인 불가';
};

function renderMetric(key, id) {
  const source = document.querySelector(`#pc-status [data-metric="${key}"]`);
  const value = $(`dashboard-${id}`);
  const card = value?.closest('.dashboard-status-card');
  if (!source || !value || !card) return;
  value.textContent = text(source.querySelector('.pc-value'));
  card.querySelector('.dashboard-note').textContent = text(source.querySelectorAll('p')[1]);
  const time = $(`dashboard-${id}-time`);
  if (time) time.textContent = text(source.querySelector('.pc-time'));
  card.dataset.state = source.dataset.state || 'pending';
}

function renderConnection() {
  const badge = $('mode-badge'), value = $('dashboard-connection'), note = $('dashboard-connection-note');
  const card = value?.closest('.dashboard-status-card');
  if (!badge || !value || !note || !card) return;
  const mode = badge.dataset.mode || 'unknown';
  if (mode === 'disconnected') {
    value.textContent = 'SDP 미연결';
    note.textContent = '이 PC의 로컬 조회는 가능할 수 있습니다. SDP 연결 상태와 섞지 않습니다.';
    card.dataset.state = 'unavailable';
  } else if (mode === 'connected') {
    value.textContent = '연결됨';
    note.textContent = '현재 실행의 서버 연결 응답입니다. 각 조회 결과는 해당 항목에서 확인하세요.';
    card.dataset.state = 'measured';
  } else if (mode === 'demo') {
    value.textContent = '예제 연결';
    note.textContent = '예제 모드입니다. 실제 SDP 연결 성공이 아닙니다.';
    card.dataset.state = 'demo';
  } else {
    value.textContent = '확인 불가';
    note.textContent = '연결 상태를 확인할 수 없습니다. 성공으로 간주하지 마세요.';
    card.dataset.state = 'unknown';
  }
}

function sampleFromPcView() {
  const status = document.querySelector('#pc-status [data-measured-at]');
  const measuredAt = status?.dataset.measuredAt;
  const ms = Date.parse(measuredAt || '');
  if (!Number.isFinite(ms) || history.some(sample => sample.measuredAt === measuredAt)) return;
  const values = {};
  for (const key of ['cpu', 'memory', 'disk']) {
    const article = document.querySelector(`#pc-status [data-metric="${key}"]`);
    const value = Number(article?.dataset.trendValue);
    if (article?.dataset.state !== 'measured' || !Number.isFinite(value) || value < 0 || value > 100) return;
    values[key] = value;
  }
  history.push({measuredAt, ms, values});
  while (history.length > HISTORY_LIMIT) history.shift();
  renderHistory();
}

function renderHistory() {
  const body = $('dashboard-trend-rows'), state = $('dashboard-trend-state');
  if (!body || !state) return;
  body.replaceChildren();
  if (!history.length) {
    state.textContent = '아직 비교할 실측 이력이 없습니다. 「내 PC 확인」을 눌러 조회하세요.';
    return;
  }
  state.textContent = `성공한 PC 조회 ${history.length}회 · 현재 화면을 연 동안의 최근 ${HISTORY_LIMIT}회 · 변동은 직전 조회 대비 퍼센트포인트(pp)`;
  for (let i = history.length - 1; i >= 0; i--) {
    const current = history[i], previous = history[i - 1];
    const row = document.createElement('tr');
    const time = document.createElement('td');
    time.textContent = new Date(current.ms).toLocaleString('ko-KR'); row.append(time);
    for (const key of ['cpu', 'memory', 'disk']) {
      const cell = document.createElement('td');
      const value = `${current.values[key].toFixed(1)}%`;
      if (!previous) cell.textContent = `${value} · 첫 조회`;
      else {
        const delta = current.values[key] - previous.values[key];
        const sign = delta > 0 ? '+' : delta < 0 ? '−' : '±';
        cell.textContent = `${value} · ${sign}${Math.abs(delta).toFixed(1)} pp`;
      }
      row.append(cell);
    }
    body.append(row);
  }
}

function renderLocalChecks() {
  const list = $('dashboard-local-checks');
  if (!list) return;
  list.replaceChildren();
  for (const [key, label] of [['network', '네트워크 구성 요약'], ['firewall', 'Windows 방화벽'], ['events', 'Windows 기록']]) {
    const article = document.querySelector(`#pc-status [data-metric="${key}"]`);
    const item = document.createElement('li');
    if (!article) { item.textContent = `${label}: 확인 불가 · PC 조회 화면을 확인하세요.`; list.append(item); continue; }
    const value = text(article.querySelector('.pc-value'));
    const note = text(article.querySelectorAll('p')[1]);
    const time = text(article.querySelector('.pc-time'));
    item.textContent = `${label}: ${value} · ${note} · ${time}`;
    list.append(item);
  }
}

function renderRecords() {
  const root = $('records'), list = $('dashboard-records-list'), state = $('dashboard-records-state');
  if (!root || !list || !state) return;
  const events = [...root.querySelectorAll('.event')].filter(node => !node.closest('[hidden]')).slice(0, 3);
  if (!events.length) {
    list.replaceChildren(); list.hidden = true;
    const status = root.querySelector('.state-error, .state-loading, .state-empty');
    state.textContent = status && !status.closest('[hidden]')
      ? text(status)
      : '표시할 서버 보안 기록이 없습니다. 빈 결과와 조회 실패는 보안 기록 탭에서 구분하세요.';
    return;
  }
  list.replaceChildren();
  for (const event of events) {
    const item = document.createElement('li');
    const title = text(event.querySelector('.event-head h3, h3'));
    const summary = event.textContent.replace(/\s+/g, ' ').trim();
    const heading = document.createElement('strong'); heading.textContent = title; item.append(heading);
    const detail = document.createElement('p'); detail.textContent = summary === title ? '상세 내용은 보안 기록 탭에서 확인하세요.' : summary.replace(title, '').trim().slice(0, 280); item.append(detail);
    list.append(item);
  }
  list.hidden = false;
  state.textContent = '서버에서 조회한 최근 기록입니다. 상세 근거는 보안 기록 탭에서 확인하세요.';
}

function renderAll() {
  renderMetric('cpu', 'cpu'); renderMetric('memory', 'memory'); renderMetric('disk', 'disk');
  renderConnection(); sampleFromPcView(); renderLocalChecks(); renderRecords();
}

function init() {
  if (!$('dashboard')) return;
  const recordsLink = document.querySelector('[data-dashboard-records-link]');
  recordsLink?.addEventListener('click', event => {
    event.preventDefault(); $('tab-records')?.click(); $('tab-records')?.focus();
  });
  renderAll();
  const observer = new MutationObserver(renderAll);
  for (const node of [$('pc-status'), $('mode-badge'), $('records')]) {
    if (node) observer.observe(node, {subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['data-mode', 'data-ui-mode', 'data-state', 'data-measured-at', 'data-trend-value']});
  }
  window.addEventListener('pagehide', () => observer.disconnect(), {once: true});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
else init();
