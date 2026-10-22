// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('div');
      root.className = 'student-identity';

      const DEVICE_LABELS = {
        compliant: '보안 기준 충족(compliant)',
        noncompliant: '보안 기준 미충족(noncompliant)',
        unknown: '확인 불가(unknown)',
      };
      const SESSION_LABELS = {
        active: '활성(active)',
        expired: '만료(expired)',
        revoked: '철회됨(revoked)',
        unknown: '확인 불가(unknown)',
      };
      const MODE_LABELS = {
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      };

      const appendMode = (target, mode) => {
        if (!mode || !Object.hasOwn(MODE_LABELS, mode)) return;
        const note = document.createElement('p');
        note.className = `student-mode student-mode-${mode}`;
        note.textContent = MODE_LABELS[mode];
        target.append(note);
      };

      const message = (text, kind) => {
        const p = document.createElement('p');
        p.className = `student-state student-state-${kind}`;
        p.textContent = text;
        return p;
      };

      const row = (label, value) => {
        const dl = document.createElement('dl');
        dl.className = 'student-identity-row';
        const dt = document.createElement('dt');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.textContent = value;
        dl.append(dt, dd);
        return dl;
      };

      const meState = me && me.status;
      const meMode = me && me.mode;
      // devices/sessions 도 같은 세대의 응답이므로, me 가 loading/error 여도 mode 안내를 위해 참고한다.
      const anyMode = [me, devices, sessions]
        .map((r) => r && r.mode)
        .find((m) => m && Object.hasOwn(MODE_LABELS, m)) || meMode;

      // devices/sessions 를 각자의 상태(loading/ok/error)에 따라 별도 블록으로 그린다.
      // me 의 상태와 무관하게 항상 표시하여, me 가 ok 여도 목록 오류가 드러나게 한다.
      const renderListSection = (title, resource, describe, emptyText) => {
        const section = document.createElement('section');
        section.className = 'student-identity-section';
        const h = document.createElement('p');
        h.textContent = title;
        section.append(h);

        const state = resource && resource.status;
        const mode = resource && resource.mode;
        if (!resource || state === 'loading') {
          section.append(message(`${title}: 불러오는 중`, 'loading'));
          appendMode(section, mode);
          return section;
        }
        if (state === 'error') {
          const detail = resource.error && resource.error.message ? resource.error.message : '서버에 연결하지 못했습니다.';
          section.append(
            message(`${title}: 연결 실패: ${detail}`, 'error'),
            message(`${title}: 확인 불가`, 'error'),
          );
          appendMode(section, mode);
          return section;
        }
        if (state === 'ok') {
          const list = Array.isArray(resource.data) ? resource.data : [];
          if (list.length === 0) {
            section.append(message(`${title}: ${emptyText}`, 'empty'));
          } else {
            const ul = document.createElement('ul');
            ul.className = 'student-identity-list';
            for (const item of list) {
              const li = document.createElement('li');
              li.textContent = describe(item);
              ul.append(li);
            }
            section.append(ul);
          }
          appendMode(section, mode);
          return section;
        }
        section.append(message(`${title}: 확인 불가`, 'error'));
        appendMode(section, mode);
        return section;
      };

      if (!me || meState === 'loading') {
        root.append(message('불러오는 중', 'loading'));
        appendMode(root, anyMode);
        root.append(
          renderListSection(
            '기기',
            devices,
            (item) => {
              const label = item.label || item.id || '확인 불가';
              const status = Object.hasOwn(DEVICE_LABELS, item.status) ? DEVICE_LABELS[item.status] : '확인 불가(unknown)';
              return `${label} · ${status}`;
            },
            '표시할 기기가 없습니다.',
          ),
          renderListSection(
            '세션',
            sessions,
            (item) => {
              const status = Object.hasOwn(SESSION_LABELS, item.status) ? SESSION_LABELS[item.status] : '확인 불가(unknown)';
              return `${item.id || '확인 불가'} · ${status}`;
            },
            '표시할 세션이 없습니다.',
          ),
        );
        return root;
      }

      if (meState === 'error') {
        const detail = me.error && me.error.message ? me.error.message : '서버에 연결하지 못했습니다.';
        root.append(
          message(`연결 실패: ${detail}`, 'error'),
          message('확인 불가: 현재 로그인 정보를 불러올 수 없습니다.', 'error'),
        );
        appendMode(root, anyMode);
        root.append(
          renderListSection(
            '기기',
            devices,
            (item) => {
              const label = item.label || item.id || '확인 불가';
              const status = Object.hasOwn(DEVICE_LABELS, item.status) ? DEVICE_LABELS[item.status] : '확인 불가(unknown)';
              return `${label} · ${status}`;
            },
            '표시할 기기가 없습니다.',
          ),
          renderListSection(
            '세션',
            sessions,
            (item) => {
              const status = Object.hasOwn(SESSION_LABELS, item.status) ? SESSION_LABELS[item.status] : '확인 불가(unknown)';
              return `${item.id || '확인 불가'} · ${status}`;
            },
            '표시할 세션이 없습니다.',
          ),
        );
        return root;
      }

      if (meState === 'ok') {
        const data = me.data || {};
        const user = data.user || {};
        const device = data.device || {};
        const session = data.session || {};
        const userLabel = user.label || user.id || '확인 불가';
        const deviceLabel = device.label || device.id || '확인 불가';
        const deviceStatus = Object.hasOwn(DEVICE_LABELS, device.status) ? DEVICE_LABELS[device.status] : '확인 불가(unknown)';
        const sessionStatus = Object.hasOwn(SESSION_LABELS, session.status) ? SESSION_LABELS[session.status] : '확인 불가(unknown)';

        root.append(
          row('사용자', userLabel),
          row('기기', `${deviceLabel} · ${deviceStatus}`),
          row('세션', `${session.id || '확인 불가'} · ${sessionStatus}`),
        );

        root.append(
          renderListSection(
            '기기 목록',
            devices,
            (item) => {
              const label = item.label || item.id || '확인 불가';
              const status = Object.hasOwn(DEVICE_LABELS, item.status) ? DEVICE_LABELS[item.status] : '확인 불가(unknown)';
              return `${label} · ${status}`;
            },
            '표시할 기기가 없습니다.',
          ),
          renderListSection(
            '세션 목록',
            sessions,
            (item) => {
              const status = Object.hasOwn(SESSION_LABELS, item.status) ? SESSION_LABELS[item.status] : '확인 불가(unknown)';
              return `${item.id || '확인 불가'} · ${status}`;
            },
            '표시할 세션이 없습니다.',
          ),
        );

        appendMode(root, anyMode);
        return root;
      }

      // status 가 loading/ok/error 가 아닌 경우(예: idle)도 확인 불가로 남긴다.
      root.append(message('확인 불가', 'error'));
      appendMode(root, anyMode);
      root.append(
        renderListSection(
          '기기',
          devices,
          (item) => {
            const label = item.label || item.id || '확인 불가';
            const status = Object.hasOwn(DEVICE_LABELS, item.status) ? DEVICE_LABELS[item.status] : '확인 불가(unknown)';
            return `${label} · ${status}`;
          },
          '표시할 기기가 없습니다.',
        ),
        renderListSection(
          '세션',
          sessions,
          (item) => {
            const status = Object.hasOwn(SESSION_LABELS, item.status) ? SESSION_LABELS[item.status] : '확인 불가(unknown)';
            return `${item.id || '확인 불가'} · ${status}`;
          },
          '표시할 세션이 없습니다.',
        ),
      );
      return root;
    },
    renderDecision({ status, mode, data, error, appId } = {}) {
      const root = document.createElement('div');
      root.className = 'student-decision';

      const DECISION_LABELS = {
        allow: '접근 허용(allow)',
        deny: '접근 거부(deny)',
        challenge: '추가 확인 필요(challenge)',
        unknown: '확인 불가(unknown)',
      };
      const MODE_LABELS = {
        connected: '연결됨',
        demo: '예제 데이터(demo) · 실제 연결 아님',
        disconnected: '연결 없음',
        unknown: '연결 상태 확인 불가',
      };

      const message = (text, kind) => {
        const p = document.createElement('p');
        p.className = `student-state student-state-${kind}`;
        p.textContent = text;
        return p;
      };

      const row = (label, value) => {
        const dl = document.createElement('dl');
        dl.className = 'student-decision-row';
        const dt = document.createElement('dt');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.textContent = value;
        dl.append(dt, dd);
        return dl;
      };

      const appendMode = (target, m) => {
        if (!m || !Object.hasOwn(MODE_LABELS, m)) return;
        const note = document.createElement('p');
        note.className = `student-mode student-mode-${m}`;
        note.textContent = MODE_LABELS[m];
        target.append(note);
      };

      if (status === 'idle' || status == null) {
        root.append(message('앱을 골라 접속을 요청하세요.', 'idle'));
        appendMode(root, mode);
        return root;
      }

      if (status === 'loading') {
        root.append(message('판정 확인 중', 'loading'));
        appendMode(root, mode);
        return root;
      }

      if (status === 'error') {
        const detail = error && typeof error.message === 'string' && error.message
          ? error.message
          : '서버에 연결하지 못했습니다.';
        root.append(
          message(`요청 실패: ${detail}`, 'error'),
          message('요청 실패는 접근 거부 판정이 아닙니다. 판정을 확인할 수 없습니다(unknown).', 'error'),
        );
        appendMode(root, mode);
        return root;
      }

      if (status === 'ok') {
        const payload = data || {};
        const raw = payload.decision;
        const isKnown = typeof raw === 'string' && Object.hasOwn(DECISION_LABELS, raw);
        const shownCode = isKnown ? raw : 'unknown';
        const rawText = typeof raw === 'string' && raw.length > 0 ? raw : 'unknown';
        const label = DECISION_LABELS[shownCode];
        const shownAppId = payload.appId || appId || '확인 불가';
        const reason = typeof payload.reason === 'string' && payload.reason.length > 0
          ? payload.reason
          : '사유 정보 없음';
        const checkedAt = typeof payload.checkedAt === 'string' && payload.checkedAt.length > 0
          ? payload.checkedAt
          : '시각 정보 없음';

        if (shownCode === 'allow') {
          root.append(message(`판정: ${label}`, 'ok'));
          root.append(message('정책상 접근 허용이며, 실제 앱 접속 성공을 보장하지 않습니다.', 'ok'));
        } else if (shownCode === 'deny') {
          root.append(message(`판정: ${label}`, 'error'));
        } else if (shownCode === 'challenge') {
          root.append(
            message(`판정: ${label}`, 'loading'),
            message('추가 인증 또는 확인이 필요합니다. 이 앱이 인증 절차를 대신 수행하지는 않습니다.', 'loading'),
          );
        } else {
          const rawNote = isKnown
            ? `확인 불가(unknown)`
            : `확인 불가(unknown) · 서버가 보낸 원래 값: ${rawText}`;
          root.append(
            message(rawNote, 'error'),
            message('허용되지 않음. 판정을 확인할 수 없습니다.', 'error'),
          );
        }

        root.append(
          row('앱 ID', shownAppId),
          row('판정 이유', reason),
          row('판정 시각', checkedAt),
        );
        appendMode(root, mode);
        return root;
      }

      // status 가 idle/loading/ok/error 가 아닌 경우
      root.append(
        message('확인 불가(unknown) · 판정을 확인할 수 없습니다.', 'error'),
        message('허용되지 않음.', 'error'),
      );
      appendMode(root, mode);
      return root;
    },
    renderEvents({ status, mode, data, error } = {}) {
      const root = document.createElement('div');
      root.className = 'student-events';

      const KIND_LABELS = {
        access: '접속(access)',
        xdr: 'XDR 경보(xdr)',
      };
      const ACCESS_LABELS = {
        allowed: '허용됨(allowed)',
        denied: '거부됨(denied)',
        unknown: '확인 불가(unknown)',
      };
      const SESSION_LABELS = {
        active: '활성(active)',
        expired: '만료(expired)',
        revoked: '철회됨(revoked)',
        unknown: '확인 불가(unknown)',
      };
      const DEVICE_LABELS = {
        compliant: '보안 기준 충족(compliant)',
        noncompliant: '보안 기준 미충족(noncompliant)',
        unknown: '확인 불가(unknown)',
      };
      const MODE_LABELS = {
        connected: '연결됨',
        demo: '예제 데이터(demo) · 실제 연결 아님',
        disconnected: '연결 없음',
        unknown: '연결 상태 확인 불가',
      };

      const message = (text, kind) => {
        const p = document.createElement('p');
        p.className = `student-state student-state-${kind}`;
        p.textContent = text;
        return p;
      };

      const appendMode = (target, m) => {
        if (!m || !Object.hasOwn(MODE_LABELS, m)) return;
        const note = document.createElement('p');
        note.className = `student-mode student-mode-${m}`;
        note.textContent = MODE_LABELS[m];
        target.append(note);
      };

      const formatAt = (value) => {
        if (typeof value !== 'string' || value.length === 0) return '시각 정보 없음';
        const ms = Date.parse(value);
        return Number.isFinite(ms) ? `${new Date(ms).toLocaleString('ko-KR')} (${value})` : value;
      };

      const kindLabel = (kind) => Object.hasOwn(KIND_LABELS, kind) ? KIND_LABELS[kind] : '종류 확인 불가';
      const appLabel = (appId) => (typeof appId === 'string' && appId.length > 0) ? appId : '앱을 확인할 수 없음';
      const accessLabel = (v) => Object.hasOwn(ACCESS_LABELS, v) ? ACCESS_LABELS[v] : '확인 불가(unknown)';
      const sessionLabel = (v) => Object.hasOwn(SESSION_LABELS, v) ? SESSION_LABELS[v] : '확인 불가(unknown)';
      const deviceLabel = (v) => Object.hasOwn(DEVICE_LABELS, v) ? DEVICE_LABELS[v] : '확인 불가(unknown)';

      if (status === 'loading') {
        root.append(message('기록을 불러오는 중', 'loading'));
        appendMode(root, mode);
        return root;
      }

      if (status === 'error') {
        const detail = error && typeof error.message === 'string' && error.message
          ? error.message
          : '서버에 연결하지 못했습니다.';
        root.append(
          message(`기록을 불러오지 못했습니다: ${detail}`, 'error'),
          message('이 화면은 빈 목록이 아닙니다. 기록을 불러오지 못해 확인할 수 없습니다.', 'error'),
        );
        appendMode(root, mode);
        return root;
      }

      if (status !== 'ok') {
        root.append(
          message('기록을 불러오지 못했습니다: 응답 상태를 확인할 수 없습니다.', 'error'),
          message('이 화면은 빈 목록이 아닙니다. 기록을 확인할 수 없습니다.', 'error'),
        );
        appendMode(root, mode);
        return root;
      }

      const list = Array.isArray(data) ? data.slice() : [];

      if (list.length === 0) {
        root.append(message('표시할 기록이 없습니다.', 'empty'));
        appendMode(root, mode);
        return root;
      }

      const sorted = list.slice().sort((a, b) => {
        const ta = Date.parse(a && a.at);
        const tb = Date.parse(b && b.at);
        const va = Number.isFinite(ta) ? ta : -Infinity;
        const vb = Number.isFinite(tb) ? tb : -Infinity;
        return vb - va;
      });

      const kindValues = ['all', ...new Set(sorted.map((e) => e.kind).filter((v) => typeof v === 'string' && v.length > 0))];
      const appValues = ['all', ...new Set(sorted.map((e) => e.appId).filter((v) => typeof v === 'string' && v.length > 0))];
      const accessValues = ['all', ...new Set(sorted.map((e) => e && e.state && e.state.access).filter((v) => typeof v === 'string' && v.length > 0))];

      const filterState = { kind: 'all', app: 'all', access: 'all' };

      const buildSelect = ({ id, labelText, values, onChange, describe }) => {
        const wrap = document.createElement('div');
        wrap.className = 'student-events-filter';
        const label = document.createElement('label');
        label.setAttribute('for', id);
        label.textContent = labelText;
        const select = document.createElement('select');
        select.id = id;
        select.name = id;
        for (const value of values) {
          const opt = document.createElement('option');
          opt.value = value;
          opt.textContent = describe(value);
          select.append(opt);
        }
        select.addEventListener('change', () => {
          onChange(select.value);
        });
        wrap.append(label, select);
        return wrap;
      };

      const describeKind = (v) => v === 'all' ? '전체' : (Object.hasOwn(KIND_LABELS, v) ? KIND_LABELS[v] : v);
      const describeApp = (v) => v === 'all' ? '전체' : v;
      const describeAccess = (v) => v === 'all' ? '전체' : (Object.hasOwn(ACCESS_LABELS, v) ? ACCESS_LABELS[v] : v);

      const listEl = document.createElement('ul');
      listEl.className = 'student-events-list';

      const countEl = document.createElement('p');
      countEl.className = 'student-events-count';

      const detailHost = document.createElement('div');
      detailHost.className = 'student-events-detail-host';

      let selectedId = null;

      const renderDetail = (event) => {
        detailHost.replaceChildren();
        const state = event && event.state ? event.state : {};
        const box = document.createElement('section');
        box.className = 'student-events-detail';
        box.setAttribute('data-student-event-detail', String(event.id));

        const h = document.createElement('p');
        h.textContent = `${event.id} 상세`;
        box.append(h);

        const dl = document.createElement('dl');
        dl.className = 'student-events-detail-kv';
        const add = (labelText, valueText) => {
          const dt = document.createElement('dt');
          dt.textContent = labelText;
          const dd = document.createElement('dd');
          dd.textContent = valueText;
          dl.append(dt, dd);
        };
        add('사건 ID', String(event.id));
        add('앱(appId)', appLabel(event.appId));
        add('시각', formatAt(event.at));
        add('종류', kindLabel(event.kind));
        box.append(dl);

        const section = (title, node) => {
          const s = document.createElement('section');
          s.className = 'student-events-detail-section';
          const t = document.createElement('p');
          t.textContent = title;
          s.append(t, node);
          box.append(s);
        };

        const evidence = Array.isArray(event.evidence) ? event.evidence : [];
        const evidenceBox = document.createElement('ul');
        if (evidence.length === 0) {
          const li = document.createElement('li');
          li.textContent = '근거 없음';
          evidenceBox.append(li);
        } else {
          for (const ev of evidence) {
            const li = document.createElement('li');
            const idText = ev && typeof ev.id === 'string' ? ev.id : '확인 불가';
            const textText = ev && typeof ev.text === 'string' ? ev.text : '';
            li.textContent = `${idText}: ${textText}`;
            evidenceBox.append(li);
          }
        }
        section('근거(evidence)', evidenceBox);

        const rules = Array.isArray(event.rules) ? event.rules : [];
        const rulesBox = document.createElement('ul');
        if (rules.length === 0) {
          const li = document.createElement('li');
          li.textContent = '규칙 없음';
          rulesBox.append(li);
        } else {
          for (const r of rules) {
            const li = document.createElement('li');
            const idText = r && typeof r.id === 'string' ? r.id : '확인 불가';
            const textText = r && typeof r.text === 'string' ? r.text : '';
            li.textContent = `${idText}: ${textText}`;
            rulesBox.append(li);
          }
        }
        section('규칙(rules)', rulesBox);

        const stateDl = document.createElement('dl');
        stateDl.className = 'student-events-detail-kv';
        const addState = (labelText, valueText) => {
          const dt = document.createElement('dt');
          dt.textContent = labelText;
          const dd = document.createElement('dd');
          dd.textContent = valueText;
          stateDl.append(dt, dd);
        };
        addState('접속 상태(state.access)', accessLabel(state.access));
        addState('세션 상태(state.session)', sessionLabel(state.session));
        addState('기기 상태(state.device)', deviceLabel(state.device));
        section('상태(state)', stateDl);

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'student-events-detail-close';
        close.textContent = '상세 닫기';
        close.addEventListener('click', () => {
          selectedId = null;
          detailHost.replaceChildren();
        });
        box.append(close);
        detailHost.append(box);
      };

      const matches = (event) => {
        if (filterState.kind !== 'all' && event.kind !== filterState.kind) return false;
        if (filterState.app !== 'all' && event.appId !== filterState.app) return false;
        const access = event && event.state ? event.state.access : undefined;
        if (filterState.access !== 'all' && access !== filterState.access) return false;
        return true;
      };

      const paint = () => {
        listEl.replaceChildren();
        detailHost.replaceChildren();
        selectedId = null;
        const visible = sorted.filter(matches);
        countEl.textContent = `표시 ${visible.length}건 / 전체 ${sorted.length}건`;
        if (visible.length === 0) {
          const li = document.createElement('li');
          li.appendChild(message('필터 조건에 맞는 기록이 없습니다.', 'empty'));
          listEl.append(li);
          return;
        }
        for (const event of visible) {
          const li = document.createElement('li');
          li.className = 'student-events-item';
          li.setAttribute('data-student-event-id', String(event.id));

          const head = document.createElement('p');
          head.className = 'student-events-item-head';
          const idEl = document.createElement('span');
          idEl.className = 'student-events-item-id';
          idEl.textContent = `사건 ID ${event.id}`;
          const kindEl = document.createElement('span');
          kindEl.className = 'student-events-item-kind';
          kindEl.textContent = kindLabel(event.kind);
          const timeEl = document.createElement('span');
          timeEl.className = 'student-events-item-time';
          timeEl.textContent = formatAt(event.at);
          head.append(idEl, document.createTextNode(' · '), kindEl, document.createTextNode(' · '), timeEl);

          const appEl = document.createElement('p');
          appEl.className = 'student-events-item-app';
          appEl.textContent = `앱: ${appLabel(event.appId)}`;

          const summaryEl = document.createElement('p');
          summaryEl.className = 'student-events-item-summary';
          summaryEl.textContent = typeof event.summary === 'string' && event.summary.length > 0 ? event.summary : '요약 정보 없음';

          const open = document.createElement('button');
          open.type = 'button';
          open.className = 'student-events-item-open';
          open.textContent = `${event.id} 상세`;
          open.addEventListener('click', () => {
            if (selectedId === event.id) {
              selectedId = null;
              detailHost.replaceChildren();
              return;
            }
            selectedId = event.id;
            renderDetail(event);
          });

          li.append(head, appEl, summaryEl, open);
          listEl.append(li);
        }
      };

      const filters = document.createElement('div');
      filters.className = 'student-events-filters';
      filters.append(
        buildSelect({
          id: 'student-events-filter-kind',
          labelText: '기록 종류',
          values: kindValues,
          describe: describeKind,
          onChange: (v) => { filterState.kind = v; paint(); },
        }),
        buildSelect({
          id: 'student-events-filter-app',
          labelText: '업무 앱',
          values: appValues,
          describe: describeApp,
          onChange: (v) => { filterState.app = v; paint(); },
        }),
        buildSelect({
          id: 'student-events-filter-access',
          labelText: '접속 상태',
          values: accessValues,
          describe: describeAccess,
          onChange: (v) => { filterState.access = v; paint(); },
        }),
      );

      root.append(filters, countEl, listEl, detailHost);
      appendMode(root, mode);
      paint();
      return root;
    },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted } = {}) {
      const root = document.createElement('div');
      root.className = 'student-ai-connection';

      const MODE_LABELS = {
        connected: '연결됨',
        demo: '예제 데이터(demo) · 실제 연결 아님',
        disconnected: '연결 없음',
        unknown: '연결 상태 확인 불가',
      };

      const message = (text, kind) => {
        const p = document.createElement('p');
        p.className = `student-state student-state-${kind}`;
        p.textContent = text;
        return p;
      };

      const row = (label, value) => {
        const dl = document.createElement('dl');
        dl.className = 'student-ai-connection-row';
        const dt = document.createElement('dt');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.textContent = value;
        dl.append(dt, dd);
        return dl;
      };

      const appendMode = (target, m) => {
        if (!m || !Object.hasOwn(MODE_LABELS, m)) return;
        const note = document.createElement('p');
        note.className = `student-mode student-mode-${m}`;
        note.textContent = MODE_LABELS[m];
        target.append(note);
      };

      const formatTime = (value) => {
        if (typeof value !== 'string' || value.length === 0) return '시각 정보 없음';
        const ms = Date.parse(value);
        return Number.isFinite(ms) ? `${new Date(ms).toLocaleString('ko-KR')} (${value})` : value;
      };

      // 서버·제공 화면이 이미 안전한 코드/문장만 넘긴다. 여기서는 추가 매핑이나 원문 노출 없이 그대로 글자로 쓴다.
      // 표시용 분류 라벨은 error.code 로만 붙이며, 원문 오류·열쇠는 화면에 쓰지 않는다.
      const ERROR_CATEGORIES = {
        ON_AI_PROVISIONING_PENDING: '권한 준비 중·확인 불가',
        WB_CLCO_AUTH_REQUIRED: '인증 실패',
        WB_CLCO_ACCESS_BLOCKED: '접근 제한',
        WB_CLCO_COHORT_BUDGET_EXHAUSTED: '반 사용량·이용 한도',
        WB_CLCO_LIMIT_REACHED: '이용 한도',
        WB_CLCO_SESSION_CLOSED: '이용 시간 아님',
        WB_CLCO_RATE_LIMITED: '요청 제한',
        WB_CLCO_TIMEOUT: '시간 초과',
        REQUEST_TIMEOUT: '시간 초과',
        ENGINE_TIMEOUT: '시간 초과',
        TIMEOUT: '시간 초과',
        WB_CLCO_CANCELLED: '취소',
        CANCELLED: '취소',
        REQUEST_CANCELLED: '취소',
        MODEL_NOT_CONFIGURED: '쓸 수 있는 모델 없음',
        ON_AI_MODEL_LIST_EMPTY: '쓸 수 있는 모델 없음',
        ON_AI_AUTHORIZATION_CHANGED: '권한 준비 중·확인 불가',
        WB_CLCO_NETWORK_ERROR: '네트워크',
        NETWORK_ERROR: '네트워크',
      };
      const categoryOf = (code) => Object.hasOwn(ERROR_CATEGORIES, code) ? ERROR_CATEGORIES[code] : '확인 불가';

      if (status === 'idle' || status == null) {
        root.append(message('AI 연결 점검 전입니다. 아직 「현재 API 연결 점검」을 실행하지 않았습니다.', 'idle'));
        appendMode(root, mode);
        return root;
      }

      if (status === 'loading') {
        root.append(message('AI 연결 점검 중입니다. 현재 로그인으로 모델 목록 응답을 확인하고 있습니다.', 'loading'));
        appendMode(root, mode);
        return root;
      }

      if (status === 'error') {
        const code = error && typeof error.code === 'string' && error.code.length > 0 ? error.code : 'AI_REQUEST_UNVERIFIED';
        const detail = error && typeof error.message === 'string' && error.message.length > 0
          ? error.message
          : 'AI 연결 점검 결과를 확인할 수 없습니다.';
        const category = categoryOf(code);
        // 취소는 이전 결과가 현재 결과가 아님을 명확히 남긴다. 성공(모델 수) 흔적을 남기지 않는다.
        root.append(
          message(`AI 연결 점검 실패(${category}) · ${code}`, 'error'),
          message(detail, 'error'),
        );
        if (category === '취소') {
          root.append(message('취소된 점검 결과입니다. 이전 결과는 현재 결과가 아닙니다.', 'error'));
        } else if (category === '시간 초과' || category === '요청 제한' || category === '네트워크') {
          root.append(message('잠시 뒤 「현재 API 연결 점검」 버튼을 직접 눌러 다시 점검하세요. 자동으로 다시 점검하지 않습니다.', 'error'));
        } else if (category === '권한 준비 중·확인 불가') {
          root.append(message('담당자에게 계정 연결과 앱 권한 확인을 요청하세요. 이 실패는 학생 코드 문제가 아닙니다.', 'error'));
        } else if (category === '인증 실패' || category === '접근 제한') {
          root.append(message('계정 연결 상태와 앱 승인을 다시 확인하고, 계속되면 담당자에게 확인을 요청하세요.', 'error'));
        } else if (category === '이용 한도' || category === '반 사용량·이용 한도') {
          root.append(message('담당자에게 반 사용량·이용 한도를 확인하세요.', 'error'));
        } else if (category === '이용 시간 아님') {
          root.append(message('현재 AI 이용 시간이 아닙니다. 이용 시간을 확인하세요.', 'error'));
        } else if (category === '쓸 수 있는 모델 없음') {
          root.append(message('담당자에게 모델 허용 설정 확인을 요청하세요.', 'error'));
        } else {
          root.append(message('담당자에게 도움정보를 전달해 원인을 확인하세요.', 'error'));
        }
        appendMode(root, mode);
        return root;
      }

      if (status === 'ok') {
        const payload = data || {};
        const audience = payload.audienceAuthorization;
        const modelCount = Number.isInteger(payload.modelCount) ? String(payload.modelCount) : '확인 불가';
        const when = formatTime(checkedAt);
        const summary = audience === 'test'
          ? '시험 연결 점검(test)'
          : audience === 'verified'
            ? '앱 권한 확인 후 점검(verified)'
            : '연결 점검 결과 확인 불가';
        // ok 화면은 연결·모델 목록 점검만 성공임을 명시한다. 사건 설명 성공과 분리한다.
        root.append(
          message(summary, 'ok'),
          row('응답 모델 수', modelCount),
          row('점검 시각', when),
          message('이 점검은 연결만 점검했으며 사건 설명은 아직 실행하지 않았습니다.', 'ok'),
        );
        if (audience === 'test') {
          root.append(message('시험 연결입니다. 실제 사건 설명의 근거·결과는 보안 기록에서 별도로 요청해 확인해야 합니다.', 'ok'));
        } else if (audience === 'verified') {
          root.append(message('점검 시각 기준으로 앱 권한과 모델 목록 응답이 확인된 상태입니다. 사건 설명 성공과는 별개입니다.', 'ok'));
        }
        if (explanationAccepted === true) {
          // 현재 계약상 항상 false 로 온다. 만약 true 가 오면 계약 위반이므로 성공으로 해석하지 않는다.
          root.append(message('연결 점검은 사건 설명 실행 결과가 아닙니다. 실제 설명 결과는 보안 기록에서 확인하세요.', 'ok'));
        }
        root.append(message('다시 점검하려면 「현재 API 연결 점검」 버튼을 직접 누르세요. 자동으로 다시 점검하지 않습니다.', 'ok'));
        appendMode(root, mode);
        return root;
      }

      // idle/loading/ok/error 가 아닌 상태: 확인 불가로 남기고 성공으로 보이지 않게 한다.
      root.append(message('AI 연결 점검 상태를 확인할 수 없습니다.', 'error'));
      appendMode(root, mode);
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const root = document.createElement('div');
      root.className = 'student-explanation';

      const message = (text, kind) => {
        const p = document.createElement('p');
        p.className = `student-state student-state-${kind}`;
        p.textContent = text;
        return p;
      };

      const row = (label, value) => {
        const dl = document.createElement('dl');
        dl.className = 'student-explanation-row';
        const dt = document.createElement('dt');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.textContent = value;
        dl.append(dt, dd);
        return dl;
      };

      const formatTime = (value) => {
        if (typeof value !== 'string' || value.length === 0) return '시각 정보 없음';
        const ms = Date.parse(value);
        return Number.isFinite(ms) ? `${new Date(ms).toLocaleString('ko-KR')} (${value})` : value;
      };

      if (!event) {
        root.append(message('보안 기록에서 기록을 먼저 고르세요.', 'idle'));
        return root;
      }

      const eventId = typeof event.id === 'string' && event.id.length > 0 ? event.id : '확인 불가';
      const status = explanation && explanation.status;

      if (status === 'loading') {
        root.append(
          message(`AI 설명 요청 중 · 사건 ${eventId}`, 'loading'),
          message('AI 설명은 참고용입니다. 기록과 원천 상태는 별도로 유지됩니다.', 'loading'),
        );
        return root;
      }

      if (status === 'ok') {
        const payload = explanation.data || {};
        const summary = typeof payload.summary === 'string' && payload.summary.length > 0
          ? payload.summary
          : 'AI 요약 정보 없음';
        // 성공 표식은 성공한 설명에만 붙인다.
        root.setAttribute('data-student-explanation-event', eventId);
        root.append(
          message('AI 설명(참고용) · 성공', 'ok'),
          row('사건 ID', eventId),
          row('AI 요약', summary),
          row('설명 확인 시각', formatTime(checkedAt)),
          message('AI 설명은 해석입니다. 사실 판단은 기록의 근거·규칙과 원천 상태를 기준으로 하세요. 조치 제안은 자동 실행되지 않습니다.', 'ok'),
        );
        return root;
      }

      if (status === 'error') {
        const code = explanation.error && typeof explanation.error.code === 'string' && explanation.error.code.length > 0
          ? explanation.error.code
          : 'AI_REQUEST_UNVERIFIED';
        const detail = explanation.error && typeof explanation.error.message === 'string' && explanation.error.message.length > 0
          ? explanation.error.message
          : 'AI 설명을 확인할 수 없습니다.';
        // 실패 화면에는 data-student-explanation-event 를 붙이지 않는다.
        root.append(
          message(`AI 설명 실패 · ${code}`, 'error'),
          message(detail, 'error'),
          row('사건 ID', eventId),
          message('기록은 그대로 유지됩니다. AI 연결·응답 문제는 과제 실패가 아닙니다.', 'error'),
        );
        return root;
      }

      if (status === 'idle' || status == null) {
        root.append(
          message(`AI 설명 대기 · 사건 ${eventId}`, 'idle'),
          message('기록 목록의 「AI 설명 요청」 버튼을 눌러야 설명을 요청합니다. 자동으로 요청하지 않습니다.', 'idle'),
        );
        return root;
      }

      root.append(
        message(`AI 설명 상태 확인 불가 · 사건 ${eventId}`, 'error'),
        message('설명 상태를 확인할 수 없습니다. 기록은 그대로 유지됩니다.', 'error'),
      );
      return root;
    },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}