// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView({api, onChange = () => {}} = {}) {
  // 학생 구현: 제공 /api/pc/status 한 번의 응답으로 카드 4개·추이·근거 모음을 그린다. 새 수집 코드는 없다.
  // 제공 서버는 항목별 시각을 주지 않으므로 측정 시각은 응답의 measuredAt 하나만 쓴다.
  const pcHistory = [];
  let pcLatest = null;
  let pcReadState = {status: 'idle', message: '아직 조회하지 않았습니다. 「PC 상태 조회」를 눌러 이 PC의 실제 값을 읽습니다.', failed: []};
  let pcReadPending = false;
  const PC_LABELS = {cpu: 'CPU', memory: '메모리', disk: '디스크'};
  const PC_REASONS = {
    permission_denied: '읽기 권한이 없습니다. 관리자 권한으로 바꾸지 말고 이 항목은 확인 불가로 두세요.',
    unsupported: '이 운영체제에서는 조회하지 않는 항목입니다.',
    timeout: '조회 시간이 초과됐습니다. 잠시 뒤 「다시 조회」를 누르세요.',
    query_failed: '이번 조회에 실패했습니다. 「다시 조회」를 눌러 보세요. PC 설정은 바뀌지 않았습니다.',
    invalid_response: 'PC에서 받은 값을 확인할 수 없습니다. 정상으로 보지 않습니다. 「다시 조회」를 눌러 보세요.',
    invalid_sample: '측정값이 유효하지 않아 표시하지 않았습니다. 「다시 조회」를 눌러 보세요.',
    cancelled: '조회가 취소됐습니다. 「다시 조회」를 눌러 보세요.',
  };
  const pcNumber = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const pcGb = bytes => `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  const pcTime = value => {
    const ms = typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
    return Number.isFinite(ms) ? new Date(ms).toLocaleString('ko-KR') : null;
  };
  const pcMissing = metric => ({ok: false, value: '확인 불가', detail: metric?.state === 'ok'
    ? '응답의 값이나 단위를 확인할 수 없습니다. 정상으로 보지 않습니다. 「다시 조회」를 눌러 보세요.'
    : (PC_REASONS[metric?.reason] ?? '이번 조회에서 값을 읽지 못했습니다. 「다시 조회」를 눌러 보세요.')});
  function readPcMetrics(data) {
    const m = data.metrics ?? {};
    const out = {};
    const cpu = m.cpu;
    out.cpu = cpu?.state === 'ok' && pcNumber(cpu.usagePercent) && cpu.usagePercent <= 100
      ? {ok: true, percent: cpu.usagePercent, value: `${cpu.usagePercent.toFixed(1)} % 사용`, detail: '전체 CPU 사용률 · 약 0.2초 구간 실측'} : pcMissing(cpu);
    const mem = m.memory;
    out.memory = mem?.state === 'ok' && pcNumber(mem.usedBytes) && pcNumber(mem.totalBytes) && mem.totalBytes > 0 && mem.usedBytes <= mem.totalBytes
      ? {ok: true, percent: mem.usedBytes / mem.totalBytes * 100, value: `${pcGb(mem.usedBytes)} / ${pcGb(mem.totalBytes)} 사용 (${(mem.usedBytes / mem.totalBytes * 100).toFixed(1)} %)`, detail: '사용 중인 메모리 / 전체 메모리'} : pcMissing(mem);
    const disk = m.disk;
    out.disk = disk?.state === 'ok' && pcNumber(disk.freeBytes) && pcNumber(disk.totalBytes) && disk.totalBytes > 0 && disk.freeBytes <= disk.totalBytes
      ? {ok: true, percent: (disk.totalBytes - disk.freeBytes) / disk.totalBytes * 100, value: `여유 ${pcGb(disk.freeBytes)} / 전체 ${pcGb(disk.totalBytes)} (사용 ${((disk.totalBytes - disk.freeBytes) / disk.totalBytes * 100).toFixed(1)} %)`, detail: '앱이 있는 드라이브 기준'} : pcMissing(disk);
    const net = m.network;
    out.network = net?.state === 'ok' && Number.isSafeInteger(net.interfaceCount) && Number.isSafeInteger(net.ipv4Count)
      ? {ok: true, value: `네트워크 인터페이스 ${net.interfaceCount}개 · IPv4 구성 ${net.ipv4Count}개`} : pcMissing(net);
    const fw = m.firewall, names = ['Domain', 'Private', 'Public'];
    out.firewall = fw?.state === 'ok' && Array.isArray(fw.profiles) && names.every(n => fw.profiles.some(p => p?.name === n && typeof p.enabled === 'boolean'))
      ? {ok: true, value: names.map(n => `${n} ${fw.profiles.find(p => p.name === n).enabled ? '켜짐' : '꺼짐'}`).join(' · ')} : pcMissing(fw);
    const ev = m.events;
    out.events = ev?.state === 'ok' && Number.isSafeInteger(ev.warningCount) && Number.isSafeInteger(ev.errorCount) && typeof ev.truncated === 'boolean'
      ? {ok: true, value: `최근 24시간 경고 ${ev.warningCount}건 · 오류 ${ev.errorCount}건${ev.truncated ? ' (일부만 집계)' : ''}`} : pcMissing(ev);
    return out;
  }
  const focusPc = id => document.getElementById(id)?.focus();
  async function refreshPcStatus() {
    if (pcReadPending) return;
    pcReadPending = true;
    pcLatest = null;
    pcReadState = {status: 'loading', message: '이 PC에서 읽는 중입니다. 끝날 때까지 기다려 주세요.', failed: []};
    onChange();
    focusPc('student-pc-status');
    try {
      const result = await api?.get('/api/pc/status');
      const data = result?.ok === true ? result.data : null;
      if (!data) {
        const why = typeof result?.error?.message === 'string' && result.error.message ? ` (${result.error.message})` : '';
        throw Error(`서버에서 PC 상태를 받지 못했습니다${why}.`);
      }
      const measured = Date.parse(data.measuredAt ?? '');
      if (data.schema !== 'aleph.on.pc-status.v1' || data.source !== 'local-pc' || !pcTime(data.measuredAt) || Math.abs(Date.now() - measured) > 60000) {
        throw Error('받은 응답의 형식이나 측정 시각을 확인할 수 없습니다.');
      }
      const items = readPcMetrics(data);
      pcLatest = {measuredAt: data.measuredAt, items};
      const failed = Object.keys(PC_LABELS).filter(key => !items[key].ok);
      if (!failed.length) {
        if (pcHistory.at(-1)?.measuredAt !== data.measuredAt) {
          pcHistory.push({measuredAt: data.measuredAt, values: {cpu: items.cpu.percent, memory: items.memory.percent, disk: items.disk.percent}});
        }
        while (pcHistory.length > 12) pcHistory.shift();
        pcReadState = {status: 'ok', failed, message: pcHistory.length > 1 ? '조회 성공. 직전 성공 조회와 비교했습니다.' : '조회 성공. 첫 실측값을 저장했습니다. 다시 조회하면 변화를 비교합니다.'};
      } else {
        pcReadState = {status: 'partial', failed, message: `일부 항목을 읽지 못했습니다: ${failed.map(key => PC_LABELS[key]).join(', ')}. 아래 카드의 이유를 확인하고 「다시 조회」를 눌러 보세요. 이번 회차는 추이에 넣지 않았고 예시 값으로 채우지 않았습니다.`};
      }
    } catch (error) {
      pcReadState = {status: 'error', failed: Object.keys(PC_LABELS), message: `조회에 실패했습니다: ${typeof error?.message === 'string' ? error.message : '원인을 알 수 없습니다.'} CPU·메모리·디스크 모두 확인 불가입니다. 앱이 실행 중인지 확인한 뒤 「다시 조회」를 누르세요. 예시 값으로 채우지 않았습니다.`};
    } finally {
      pcReadPending = false;
      onChange();
      focusPc('student-pc-refresh');
    }
  }
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

        const supported = Array.isArray(event.supportedActions) ? event.supportedActions : [];
        if (supported.length > 0) {
          const actions = document.createElement('ul');
          for (const action of supported) {
            if (typeof action !== 'string' || !action) continue;
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.type = 'button';
            button.disabled = true;
            button.textContent = `${action} 미지원`;
            li.append(button, document.createTextNode(' 조치 실행 연결은 준비 중입니다. 요청은 전송되지 않습니다.'));
            actions.append(li);
          }
          if (actions.childElementCount > 0) section('지원되지 않는 조치', actions);
        }

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
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = document.createElement('div');
      root.className = 'student-status';

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

      // 학생 구현: 카드 4개(CPU·메모리·디스크·SDP 연결) + 추이 + 근거 모음. 제공 조회 결과만 쓰며 예시 값은 만들지 않는다.
      const make = (tag, text, className) => {
        const node = document.createElement(tag);
        if (text) node.textContent = text;
        if (className) node.className = className;
        return node;
      };
      const dash = make('section', '', 'student-pc-dashboard');
      dash.setAttribute('aria-labelledby', 'student-pc-title');
      dash.setAttribute('aria-busy', pcReadState.status === 'loading' ? 'true' : 'false');
      const dashTitle = make('h3', '내 PC 관제 대시보드 · 학생 구현'); dashTitle.id = 'student-pc-title';
      dash.append(dashTitle);

      const core = make('ol', '', 'student-pc-core');
      for (const line of [
        '내 PC 점검 — 구현됨: 아래 카드가 이 PC의 실측값을 측정 시각과 함께 보여 줍니다.',
        '변화 추이 비교 — 구현됨: 성공한 조회를 최근 12회까지 직전 대비 pp로 비교합니다.',
        'PC 관찰 근거 모음 — 구현됨: 네트워크·방화벽·Windows 기록을 한계와 함께 모읍니다(판정 아님).',
      ]) core.append(make('li', line));
      dash.append(core, make('p', '서비스 연결·사용량·비용은 구현하지 않았습니다(미구현). 외부 서비스 연동이 없습니다.', 'muted'));
      dash.append(make('p', '표시 구분: 「실측」은 방금 이 PC에서 읽은 값, 「확인 불가」는 읽지 못한 값입니다. 설명용 예시 값은 이 화면에 없습니다. 측정 시각은 PC를 한 번 조회한 시각이며 항목별 시각이 아닙니다.', 'muted'));

      const refreshButton = make('button', pcHistory.length || pcReadState.status !== 'idle' ? '다시 조회' : 'PC 상태 조회', 'btn');
      refreshButton.type = 'button'; refreshButton.id = 'student-pc-refresh';
      refreshButton.disabled = pcReadPending;
      refreshButton.addEventListener('click', () => { void refreshPcStatus(); });
      const readStatus = make('p', pcReadState.message, `student-state student-state-${{ok: 'ok', partial: 'error', error: 'error', loading: 'loading'}[pcReadState.status] ?? 'idle'}`);
      readStatus.id = 'student-pc-status'; readStatus.tabIndex = -1;
      readStatus.setAttribute('role', 'status'); readStatus.setAttribute('aria-live', 'polite');
      dash.append(refreshButton, readStatus);

      const measuredText = pcLatest ? pcTime(pcLatest.measuredAt) : null;
      const stateOf = key => {
        if (pcReadState.status === 'loading') return {label: '조회 중', value: '조회 중…', detail: '끝나면 결과로 바뀝니다. 이전 값을 현재 값으로 보여 주지 않습니다.', kind: 'loading'};
        if (pcLatest) {
          const item = pcLatest.items[key];
          return item.ok ? {label: '실측', value: item.value, detail: item.detail, kind: 'ok'} : {label: '확인 불가', value: item.value, detail: item.detail, kind: 'error'};
        }
        if (pcReadState.status === 'error') return {label: '확인 불가', value: '확인 불가', detail: '조회에 실패해 값을 읽지 못했습니다. 아래 안내를 확인하세요.', kind: 'error'};
        return {label: '조회 전', value: '아직 조회하지 않음', detail: '「PC 상태 조회」를 누르면 이 PC의 실제 값을 읽습니다.', kind: 'idle'};
      };
      const cards = make('div', '', 'student-pc-cards');
      cards.style.display = 'grid';
      cards.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
      cards.style.gap = '12px';
      cards.style.margin = '12px 0';
      const addCard = (title, info, timeText) => {
        const card = make('article', '', 'student-pc-card');
        card.dataset.state = info.kind;
        card.style.border = '1px solid var(--border)';
        card.style.borderRadius = 'var(--radius)';
        card.style.padding = '12px';
        card.append(make('h4', title), make('p', `상태: ${info.label}`, 'muted'), make('p', info.value, `student-state student-state-${info.kind}`), make('p', info.detail, 'muted'));
        if (timeText) card.append(make('p', timeText, 'muted'));
        cards.append(card);
      };
      for (const key of Object.keys(PC_LABELS)) {
        addCard(PC_LABELS[key], stateOf(key), pcLatest && measuredText ? `측정 시각 ${measuredText}` : '측정 시각 없음');
      }
      const connection = (() => {
        if (mode === 'disconnected') return {label: 'SDP 미연결', value: 'SDP 미연결', detail: 'SDP 서버 설정 없이 실행한 기본 상태입니다(정상). 이 PC 조회 성공과 별개입니다.', kind: 'idle'};
        if (mode === 'connected') return {label: '연결됨', value: '연결됨', detail: '서버 연결 응답입니다. PC 조회 결과와 별개로 봅니다.', kind: 'ok'};
        if (mode === 'demo') return {label: '예제 연결', value: '예제 연결', detail: '예제 자료입니다. 실제 SDP 연결 성공이 아닙니다.', kind: 'loading'};
        return {label: '확인 불가', value: '확인 불가', detail: '연결 상태를 확인할 수 없습니다. 성공으로 보지 않습니다.', kind: 'error'};
      })();
      addCard('SDP 연결', connection, null);
      dash.append(cards);

      dash.append(make('h4', 'PC 상태 추이'));
      dash.append(make('p', pcHistory.length
        ? `성공한 조회 ${pcHistory.length}회 · 이 화면을 연 동안 최근 12회 · 변동은 직전 조회 대비 퍼센트포인트(pp)입니다. 일부만 읽은 회차와 실패는 넣지 않습니다.`
        : '아직 비교할 실측 이력이 없습니다. CPU·메모리·디스크를 모두 읽은 조회만 기록하며 화면을 닫으면 사라집니다.', 'muted'));
      if (pcHistory.length) {
        const wrap = make('div', '', 'vulnerabilities-result');
        const table = make('table');
        table.append(make('caption', '이 화면에서 조회한 PC 사용률 추이(최신순)'));
        const head = make('tr');
        for (const label of ['조회 시각', 'CPU 사용률', '메모리 사용률', '디스크 사용률']) { const th = make('th', label); th.scope = 'col'; head.append(th); }
        const thead = make('thead'); thead.append(head); table.append(thead);
        const body = make('tbody');
        for (let i = pcHistory.length - 1; i >= 0; i--) {
          const row = make('tr'), current = pcHistory[i], previous = pcHistory[i - 1];
          row.append(make('td', pcTime(current.measuredAt) ?? '시각 확인 불가'));
          for (const key of Object.keys(PC_LABELS)) {
            const value = `${current.values[key].toFixed(1)} %`;
            if (!previous) { row.append(make('td', `${value} · 첫 조회`)); continue; }
            const delta = current.values[key] - previous.values[key];
            row.append(make('td', `${value} · ${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${Math.abs(delta).toFixed(1)} pp`));
          }
          body.append(row);
        }
        table.append(body); wrap.append(table); dash.append(wrap);
      }

      dash.append(make('h4', 'PC 관찰 근거 모음 (판정이 아닙니다)'));
      const evidenceWrap = make('div', '', 'vulnerabilities-result');
      const evidence = make('table');
      evidence.append(make('caption', '이 PC에서 읽은 관찰과 그것만으로 말할 수 없는 것'));
      const evidenceHead = make('tr');
      for (const label of ['관찰 항목', '관찰 값', '측정 시각', '이것만으로 말할 수 없는 것']) { const th = make('th', label); th.scope = 'col'; evidenceHead.append(th); }
      const evidenceThead = make('thead'); evidenceThead.append(evidenceHead); evidence.append(evidenceThead);
      const evidenceBody = make('tbody');
      for (const [key, title, limit] of [
        ['network', '네트워크 구성 요약', '인터넷 접속이나 ZTNA 허용 여부는 알 수 없습니다.'],
        ['firewall', 'Windows 방화벽', '설정을 읽기만 했고 바꾸지 않았습니다. 보호 전체가 안전하다는 뜻이 아닙니다.'],
        ['events', 'Windows 경고·오류 건수', '최근 24시간 System·Application 건수이며 공격·침해 탐지 결과가 아닙니다. 최대 5,000건까지만 셉니다.'],
      ]) {
        const row = make('tr');
        let observed = pcReadState.status === 'loading' ? '조회 중…' : '아직 조회하지 않음';
        if (pcLatest) observed = pcLatest.items[key].ok ? pcLatest.items[key].value : `확인 불가 · ${pcLatest.items[key].detail}`;
        else if (pcReadState.status === 'error') observed = '확인 불가 · 조회에 실패했습니다.';
        row.append(make('td', title), make('td', observed), make('td', pcLatest && measuredText ? measuredText : '없음'), make('td', limit));
        evidenceBody.append(row);
      }
      evidence.append(evidenceBody); evidenceWrap.append(evidence); dash.append(evidenceWrap);
      dash.append(make('p', '서버에서 조회한 보안 기록은 위쪽 「보안 기록」 탭에서 확인하세요. 빈 결과와 조회 실패는 그 탭에서 구분됩니다.', 'muted'));
      root.append(dash);

      let hasAttention = false;

      // 기기 상태 요약
      if (devices && devices.status === 'ok') {
        const list = Array.isArray(devices.data) ? devices.data : [];
        const badDevices = list.filter((d) => d.status !== 'compliant');
        if (badDevices.length > 0) {
          hasAttention = true;
          root.append(message(`주의: 보안 기준을 충족하지 않거나 확인 불가인 기기가 ${badDevices.length}대 있습니다.`, 'error'));
          const ul = document.createElement('ul');
          ul.className = 'student-status-devices';
          for (const d of badDevices) {
            const li = document.createElement('li');
            const label = d.label || d.id || '확인 불가';
            const status = Object.hasOwn(DEVICE_LABELS, d.status) ? DEVICE_LABELS[d.status] : '확인 불가(unknown)';
            li.textContent = `${label}: ${status}`;
            ul.append(li);
          }
          root.append(ul);
        } else if (list.length > 0) {
          root.append(message('모든 등록된 기기가 보안 기준을 충족합니다.', 'ok'));
        } else {
          root.append(message('등록된 기기가 없습니다.', 'empty'));
        }
      } else if (devices && devices.status === 'error') {
        hasAttention = true;
        root.append(message(`기기 상태를 불러오지 못했습니다${devices.error && devices.error.message ? `: ${devices.error.message}` : ''}. 위쪽 「다시 불러오기」를 직접 눌러 다시 시도하세요. 자동 재시도는 하지 않습니다.`, 'error'));
      } else {
        root.append(message('기기 정보를 불러오는 중입니다.', 'loading'));
      }

      // 세션 상태 요약
      if (sessions && sessions.status === 'ok') {
        const list = Array.isArray(sessions.data) ? sessions.data : [];
        const badSessions = list.filter((s) => s.status !== 'active');
        if (badSessions.length > 0) {
          hasAttention = true;
          root.append(message(`주의: 만료되었거나 철회된 세션이 ${badSessions.length}건 있습니다.`, 'error'));
          const ul = document.createElement('ul');
          ul.className = 'student-status-sessions';
          for (const s of badSessions) {
            const li = document.createElement('li');
            const status = Object.hasOwn(SESSION_LABELS, s.status) ? SESSION_LABELS[s.status] : '확인 불가(unknown)';
            li.textContent = `${s.id || '확인 불가'}: ${status}`;
            ul.append(li);
          }
          root.append(ul);
        } else if (list.length > 0) {
          root.append(message('모든 세션이 정상 활성 상태입니다.', 'ok'));
        } else {
          root.append(message('활성화된 세션이 없습니다.', 'empty'));
        }
      } else if (sessions && sessions.status === 'error') {
        hasAttention = true;
        root.append(message(`세션 상태를 불러오지 못했습니다${sessions.error && sessions.error.message ? `: ${sessions.error.message}` : ''}. 위쪽 「다시 불러오기」를 직접 눌러 다시 시도하세요. 자동 재시도는 하지 않습니다.`, 'error'));
      } else {
        root.append(message('세션 정보를 불러오는 중입니다.', 'loading'));
      }

      // 알림 처리
      if (Array.isArray(notifications) && notifications.length > 0) {
        hasAttention = true;
        const ul = document.createElement('ul');
        ul.className = 'student-status-notifications';
        for (const n of notifications) {
          const li = document.createElement('li');
          const res = n && n.resource ? n.resource : '알 수 없음';
          const code = n && n.code ? n.code : '코드 없음';
          const msg = n && n.message ? n.message : '내용 없음';
          li.textContent = `[${res}] ${code}: ${msg}`;
          ul.append(li);
        }
        root.append(message(`확인이 필요한 알림이 ${notifications.length}건 있습니다.`, 'error'), ul);
      } else {
        root.append(message('현재 확인이 필요한 추가 알림은 없습니다.', 'ok'));
      }

      // 도움정보 상태
      if (diagnostics && diagnostics.status === 'ok') {
        root.append(message('도움정보 확인 완료.', 'ok'));
        const data = diagnostics.data && typeof diagnostics.data === 'object' ? diagnostics.data : {};
        const engine = data.engine && typeof data.engine === 'object' ? data.engine : {};
        const safe = {
          requestId: data.requestId,
          component: data.component,
          version: data.version,
          checkedAt: data.checkedAt,
          engine: { mode: engine.mode, code: engine.code },
        };
        const details = document.createElement('dl');
        details.className = 'student-status-diagnostics';
        for (const [label, value] of Object.entries({
          requestId: safe.requestId, component: safe.component, version: safe.version,
          checkedAt: safe.checkedAt, 'engine.mode': safe.engine.mode, 'engine.code': safe.engine.code,
        })) {
          if (value == null || typeof value === 'object') continue;
          const dt = document.createElement('dt'); dt.textContent = label;
          const dd = document.createElement('dd'); dd.textContent = String(value);
          details.append(dt, dd);
        }
        root.append(details, message('도움정보는 지원 요청에 붙여 넣도록 복사할 수 있습니다. 비밀값은 포함하지 않습니다.', 'idle'));
        const copy = document.createElement('button');
        copy.type = 'button'; copy.textContent = '도움정보 복사';
        copy.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(JSON.stringify(safe, null, 2)); copy.setAttribute('aria-label', '도움정보 복사 완료'); }
          catch { copy.setAttribute('aria-label', '도움정보 복사 실패'); }
        });
        root.append(copy);
      } else if (diagnostics && diagnostics.status === 'error') {
        hasAttention = true;
        root.append(message('도움정보를 불러오지 못했습니다. 연결 상태 확인이 필요합니다.', 'error'));
      } else {
        root.append(message('도움정보가 아직 로드되지 않았습니다. 「도움정보 불러오기」 버튼을 눌러 확인할 수 있습니다.', 'idle'));
      }

      if (!hasAttention) {
        root.append(message('전체 상태 요약: 현재 확인된 범위 내에서 주의가 필요한 항목이 없습니다.', 'ok'));
      } else {
        root.append(message('전체 상태 요약: 주의가 필요한 항목이 있습니다. 위 내용을 확인하세요.', 'error'));
      }

      appendMode(root, mode);
      return root;
    },
    renderVulnerabilities({ status, mode, data, error } = {}) {
      // 계약: status ∈ idle|loading|error|ok.
      // ok 일 때 data 는 app.js 의 normalizeScan 을 통과한 객체:
      //   { status: complete|partial|not_checked|not_configured|unverifiable,
      //     code?, lockfileVersion?, lockfileHash?, excluded?, checkedAt, packages[] }
      //   packages[]: { name, version, status, vulnerabilities[{id,modified}], source, checkedAt }
      const root = document.createElement('div');
      root.className = 'student-vulnerabilities';

      const MODE_LABELS = {
        connected: '연결됨',
        demo: '예제 데이터(demo) · 실제 연결 아님',
        disconnected: '연결 없음',
        unknown: '연결 상태 확인 불가',
      };

      const SCAN_LABELS = {
        complete: '모두 조회(complete)',
        partial: '일부 조회 실패(partial)',
        not_checked: '아직 조회 안 함(not_checked)',
        not_configured: '조회 준비 미완료(not_configured)',
        unverifiable: 'lock 파일 확인 불가(unverifiable)',
      };

      const SCAN_NOTES = {
        complete: '승인된 공개 패키지 모두를 마지막 페이지까지 조회했습니다. 알려진 항목이 없는 패키지는 none_found 로 표시됩니다. 이 결과는 조회 시점의 알려진 취약점 정보이며, 해당 패키지나 앱 전체의 안전을 보장하지 않습니다.',
        partial: '일부 패키지의 조회가 끝까지 확인되지 않았습니다. 받은 취약점 ID 는 유지해 표시합니다. "일부 조회 실패"는 "취약점 없음"이 아닙니다.',
        not_checked: '설치 패키지 원천은 확인했지만 승인된 공개 조회 대상이 없어 아직 조회하지 않았습니다. 이 상태는 "취약점 없음"이 아닙니다.',
        not_configured: '조회 대상 프로젝트 설정이 준비되지 않았습니다. 담당자가 대상 경로와 허용 패키지를 준비하며, 학생이 임의로 설정을 변경하지 않습니다.',
        unverifiable: 'package-lock.json 확인이 불가합니다. 이 상태는 "취약점 없음"이 아닙니다.',
      };

      const PKG_STATUS_LABELS = {
        known_vulnerabilities: '알려진 항목 있음(known_vulnerabilities)',
        none_found: '알려진 항목 없음(none_found)',
        unverifiable: '조회 확인 불가(unverifiable)',
      };

      const SOURCE_LABELS = {
        'https://api.osv.dev/v1/querybatch': 'OSV querybatch(https://api.osv.dev/v1/querybatch)',
      };

      const message = (text, kind) => {
        const p = document.createElement('p');
        p.className = `student-state student-state-${kind}`;
        p.textContent = text;
        return p;
      };

      const row = (label, value) => {
        const dl = document.createElement('dl');
        dl.className = 'student-vulnerabilities-row';
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

      const asText = (value) => (value == null ? '' : String(value));
      const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

      // idle / loading / error 에서는 절대 이전 표를 그리지 않는다.
      if (status === 'idle' || status == null) {
        root.append(message('조회 전 · 「설치 패키지 조회」 버튼을 눌러야 조회합니다.', 'idle'));
        appendMode(root, mode);
        return root;
      }

      if (status === 'loading') {
        root.append(message('조회 중 · 결과가 아직 확인되지 않았습니다. 아래 표는 이전 결과입니다.', 'loading'));
        appendMode(root, mode);
        return root;
      }

      if (status === 'error') {
        const code = error && typeof error.code === 'string' && error.code.length > 0 ? error.code : 'UNKNOWN_ERROR';
        const detail = error && typeof error.message === 'string' && error.message.length > 0
          ? error.message
          : '조회 결과를 확인할 수 없습니다.';
        root.append(
          message(`조회 실패: ${detail}`, 'error'),
          message(`코드: ${code}`, 'error'),
          message('이 화면은 "취약점 없음"이 아닙니다. 이전 결과를 현재 결과로 보지 않습니다. 필요하면 직접 다시 조회하세요.', 'error'),
        );
        appendMode(root, mode);
        return root;
      }

      if (status !== 'ok') {
        root.append(
          message('조회 결과 상태를 확인할 수 없습니다.', 'error'),
          message('이 화면은 "취약점 없음"이 아닙니다.', 'error'),
        );
        appendMode(root, mode);
        return root;
      }

      // ok: data 형식이 계약과 다르면 정상으로 그리지 않는다.
      if (!isPlain(data) || !Object.hasOwn(SCAN_LABELS, data.status)) {
        root.append(
          message('조회 결과 상태를 확인할 수 없습니다.', 'error'),
          message('이 화면은 "취약점 없음"이 아닙니다.', 'error'),
        );
        appendMode(root, mode);
        return root;
      }

      const scanStatus = data.status;
      const packages = Array.isArray(data.packages) ? data.packages : [];

      root.setAttribute('data-student-scan-status', scanStatus);

      // 1) data.status 원래 값 + 한국어 설명
      root.append(
        message(SCAN_LABELS[scanStatus], 'ok'),
        message(SCAN_NOTES[scanStatus], 'ok'),
      );

      // 2) 코드·lock 메타는 "존재할 때만" 표시
      if (typeof data.code === 'string' && data.code.length > 0) {
        root.append(row('코드', data.code));
      }
      if (Number.isInteger(data.lockfileVersion)) {
        root.append(row('lockfileVersion', String(data.lockfileVersion)));
      }
      if (typeof data.lockfileHash === 'string' && data.lockfileHash.length > 0) {
        root.append(row('lockfileHash', data.lockfileHash));
      }
      if (isPlain(data.excluded) && Number.isSafeInteger(data.excluded.count)) {
        root.append(row('조회 제외', `${data.excluded.count}건`));
      }
      if (typeof data.checkedAt === 'string' && data.checkedAt.length > 0) {
        root.append(row('checkedAt', formatTime(data.checkedAt)));
      }

      // 3) 패키지 표
      if (packages.length === 0) {
        root.append(message(
          scanStatus === 'complete'
            ? '표시할 패키지 조회 결과가 없습니다.'
            : '표시할 패키지 항목이 없습니다. 이 상태는 "취약점 없음"과 다릅니다.',
          'empty',
        ));
        appendMode(root, mode);
        return root;
      }

      const table = document.createElement('table');
      table.className = 'student-vulnerabilities-table';

      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      for (const label of ['패키지', '설치 버전', '조회 상태', '취약점 ID', '수정 시각(modified)', '출처', '패키지 조회 시각']) {
        const th = document.createElement('th');
        th.textContent = label;
        headRow.append(th);
      }
      thead.append(headRow);
      table.append(thead);

      const tbody = document.createElement('tbody');
      for (const pkg of packages) {
        if (!isPlain(pkg)) continue;
        const name = typeof pkg.name === 'string' ? pkg.name : '확인 불가';
        const version = typeof pkg.version === 'string' ? pkg.version : '확인 불가';
        const pkgStatus = Object.hasOwn(PKG_STATUS_LABELS, pkg.status) ? pkg.status : 'unverifiable';
        const findings = Array.isArray(pkg.vulnerabilities) ? pkg.vulnerabilities : [];
        const source = typeof pkg.source === 'string' && pkg.source.length > 0
          ? (SOURCE_LABELS[pkg.source] || pkg.source)
          : '출처 정보 없음';
        const pkgCheckedAt = typeof pkg.checkedAt === 'string' && pkg.checkedAt.length > 0
          ? formatTime(pkg.checkedAt)
          : '시각 정보 없음';

        // unverifiable + 취약점이 있으면 "일부 확인·전체 조회 확인 불가" 로 강조하되 ID 는 지우지 않는다.
        let statusText = PKG_STATUS_LABELS[pkgStatus];
        if (pkg.status === 'unverifiable' && findings.length > 0) {
          statusText = '일부 확인·전체 조회 확인 불가(unverifiable)';
        } else if (pkg.status === 'none_found') {
          statusText = '알려진 항목 없음(none_found · 조회 시점·조회 범위 기준)';
        }

        const findingsList = findings.length > 0 ? findings : [null];
        for (const finding of findingsList) {
          const tr = document.createElement('tr');
          // 행마다 data-* 속성 부여 (계약)
          tr.setAttribute('data-student-package-name', name);
          tr.setAttribute('data-student-package-version', version);

          const tdName = document.createElement('td');
          tdName.textContent = name;
          const tdVersion = document.createElement('td');
          tdVersion.textContent = version;
          const tdStatus = document.createElement('td');
          tdStatus.textContent = statusText;
          const tdId = document.createElement('td');
          const tdModified = document.createElement('td');
          if (finding && isPlain(finding)) {
            tdId.textContent = typeof finding.id === 'string' ? finding.id : '확인 불가';
            tdModified.textContent = typeof finding.modified === 'string' && finding.modified.length > 0
              ? formatTime(finding.modified)
              : '시각 정보 없음';
          } else {
            tdId.textContent = '—';
            tdModified.textContent = '—';
          }
          const tdSource = document.createElement('td');
          tdSource.textContent = source;
          const tdChecked = document.createElement('td');
          tdChecked.textContent = pkgCheckedAt;

          tr.append(tdName, tdVersion, tdStatus, tdId, tdModified, tdSource, tdChecked);
          tbody.append(tr);
        }
      }
      table.append(tbody);
      root.append(table);

      // OSV 안내: 조회 결과 없음이 안전을 보장하지 않는다.
      root.append(message(
        'OSV 는 알려진 취약점 데이터베이스입니다. 조회 결과가 없다는 사실만으로 해당 패키지나 앱 전체가 안전하다고 보장할 수 없습니다.',
        'idle',
      ));

      appendMode(root, mode);
      return root;
    },
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
      const STATE_NAMES = { access: '접속', session: '세션', device: '기기' };

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

      const list = (title, entries) => {
        const section = document.createElement('section');
        section.className = 'student-explanation-section';
        const h = document.createElement('p');
        h.textContent = title;
        section.append(h);
        if (!Array.isArray(entries) || entries.length === 0) {
          section.append(message('없음', 'empty'));
        } else {
          const ul = document.createElement('ul');
          ul.className = 'student-explanation-list';
          for (const entry of entries) {
            const li = document.createElement('li');
            li.textContent = entry;
            ul.append(li);
          }
          section.append(ul);
        }
        return section;
      };

      const formatTime = (value) => {
        if (typeof value !== 'string' || value.length === 0) return '시각 정보 없음';
        const ms = Date.parse(value);
        return Number.isFinite(ms) ? `${new Date(ms).toLocaleString('ko-KR')} (${value})` : value;
      };

      const status = explanation && explanation.status;
      const eventId = event && typeof event.id === 'string' && event.id.length > 0
        ? event.id
        : '확인 불가';

      // 1) 실패가 최우선: event 가 null 이어도 오류 코드·메시지와 실패 이유를 먼저 보여 준다.
      if (status === 'error') {
        const code = explanation.error && typeof explanation.error.code === 'string' && explanation.error.code.length > 0
          ? explanation.error.code
          : 'AI_REQUEST_UNVERIFIED';
        const detail = explanation.error && typeof explanation.error.message === 'string' && explanation.error.message.length > 0
          ? explanation.error.message
          : 'AI 설명을 확인할 수 없습니다.';
        // 실행을 주장한 설명, 근거가 맞지 않는 설명은 쓸 수 없다는 사실을 명시한다.
        const looksExecuted = explanation.error && typeof explanation.error.code === 'string'
          && /EXECUTED|EXECUTION/i.test(explanation.error.code);
        root.append(
          message(`AI 설명 실패 · ${code}`, 'error'),
          message(detail, 'error'),
          message(`사건 ID: ${eventId}`, 'error'),
        );
        if (looksExecuted) {
          root.append(message('AI가 조치를 이미 실행했다고 답한 설명은 사용할 수 없습니다. 이 화면은 아무 조치도 실행하지 않았습니다.', 'error'));
        }
        root.append(
          message('기록은 그대로 유지됩니다. AI 연결·응답 문제는 과제 실패가 아닙니다.', 'error'),
          message('설명을 쓰려면 근거가 이 사건과 맞아야 하며, 근거가 부족하거나 형식이 맞지 않으면 실패로 처리됩니다.', 'error'),
        );
        return root;
      }

      // 2) 오류 없이 event 만 null: 기록을 먼저 고르라는 안내.
      if (!event) {
        root.append(message('보안 기록에서 기록을 먼저 고르세요.', 'idle'));
        return root;
      }

      if (status === 'loading') {
        root.append(
          message(`AI 설명 요청 중 · 사건 ${eventId}`, 'loading'),
          message('AI 설명은 참고용입니다. 기록과 원천 상태는 별도로 유지됩니다.', 'loading'),
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

      if (status === 'ok') {
        const payload = explanation.data || {};
        const summary = typeof payload.summary === 'string' && payload.summary.length > 0
          ? payload.summary
          : 'AI 요약 정보 없음';

        // 근거 ID 대조: data.evidenceIds ↔ event.evidence.id. 없는 ID 는 지어내지 않고 불일치로 표시한다.
        const evidenceById = new Map();
        const evidenceSource = Array.isArray(event.evidence) ? event.evidence : [];
        for (const ev of evidenceSource) {
          if (ev && typeof ev.id === 'string') evidenceById.set(ev.id, ev);
        }
        const citedIds = Array.isArray(payload.evidenceIds) ? payload.evidenceIds : [];
        const missingRefs = citedIds.filter((ref) => typeof ref === 'string' && !evidenceById.has(ref));

        // 설명을 쓸 수 없는 경우: 인용한 근거 중 없는 ID 가 있으면 내용을 지어내지 않고 실패로 표시한다.
        if (missingRefs.length > 0) {
          const codeText = explanation.error && typeof explanation.error.code === 'string' && explanation.error.code.length > 0
            ? explanation.error.code
            : 'EVIDENCE_MISMATCH';
          root.append(
            message(`AI 설명 사용 불가 · 근거 불일치(${codeText})`, 'error'),
            message(`사건 ID: ${eventId}`, 'error'),
            message(`인용한 근거 ID 중 이 사건에서 찾을 수 없는 값: ${missingRefs.join(', ')}`, 'error'),
            message('이 설명은 근거가 맞지 않아 사용할 수 없습니다. 내용을 지어내지 않으며, 사실 판단은 기록의 근거와 원천 상태를 기준으로 하세요.', 'error'),
            message('기록은 그대로 유지됩니다.', 'error'),
          );
          // 성공 표식은 붙이지 않는다.
          return root;
        }

        // 성공 표식은 성공한 설명에만 붙인다.
        root.setAttribute('data-student-explanation-event', eventId);
        root.append(
          message(`AI 설명(참고용) · 사건 ${eventId}`, 'ok'),
          row('사건 ID', eventId),
          row('AI 요약(참고용)', summary),
          row('설명 확인 시각', formatTime(checkedAt)),
          message('AI 설명은 해석입니다. 사실 판단은 기록의 근거·규칙과 원천 상태를 기준으로 하세요. 설명·제안만으로 보안 조치가 실행되지는 않습니다.', 'ok'),
        );

        // 인용한 근거 ID 와 근거 문장.
        const citedEntries = citedIds.map((ref) => {
          const ev = evidenceById.get(ref);
          const text = ev && typeof ev.text === 'string' ? ev.text : '';
          return `${ref} — ${text}`;
        });
        root.append(list('인용한 근거 ID 와 근거 문장', citedEntries));

        // 규칙: id — text
        const rulesSource = Array.isArray(event.rules) ? event.rules : [];
        const ruleEntries = rulesSource.map((r) => {
          const idText = r && typeof r.id === 'string' && r.id.length > 0 ? r.id : '확인 불가';
          const textText = r && typeof r.text === 'string' ? r.text : '';
          return `규칙 ${idText} — ${textText}`;
        });
        root.append(list('규칙', ruleEntries));

        // 확인 불가 상태: access/session/device 각각 unknown 이면 "확인 불가(unknown)" 로 표시. 없으면 "없음".
        const eventState = event.state && typeof event.state === 'object' ? event.state : {};
        const unknownEntries = [];
        for (const key of ['access', 'session', 'device']) {
          if (eventState[key] === 'unknown') {
            unknownEntries.push(`${STATE_NAMES[key]}: 확인 불가(unknown)`);
          }
        }
        root.append(list('확인 불가 상태(unknown)', unknownEntries));

        // 조치 제안
        const proposals = Array.isArray(payload.proposals) ? payload.proposals : [];
        const supported = Array.isArray(event.supportedActions) ? event.supportedActions : [];
        const proposalSection = document.createElement('section');
        proposalSection.className = 'student-explanation-section';
        const proposalHead = document.createElement('p');
        proposalHead.textContent = '조치 제안';
        proposalSection.append(proposalHead);

        if (proposals.length === 0) {
          let reasonText;
          if (supported.length === 0) {
            reasonText = '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상).';
          } else {
            reasonText = 'AI가 이 기록에 맞는 조치를 제안하지 않았습니다. 지원되는 조치가 있어도 AI 제안이 없을 수 있습니다.';
          }
          proposalSection.append(message(reasonText, 'empty'));
        } else {
          const ul = document.createElement('ul');
          ul.className = 'student-explanation-list';
          for (const p of proposals) {
            const li = document.createElement('li');
            const actionText = p && typeof p.action === 'string' && p.action.length > 0 ? p.action : '확인 불가';
            const reasonText = p && typeof p.reason === 'string' && p.reason.length > 0 ? p.reason : '사유 정보 없음';
            const refs = p && Array.isArray(p.evidenceIds) ? p.evidenceIds.join(', ') : '';
            li.textContent = `${actionText} — ${reasonText} (근거 ${refs || '없음'})`;
            const note = message('사람 확인이 필요하며 실행되지 않았습니다.', 'loading');
            li.append(note);
            ul.append(li);
          }
          proposalSection.append(ul);
        }

        // 계약상 requiresHumanConfirmation:true, executed:false 여야 한다. 아니면 성공으로 해석하지 않는다.
        const requiresHuman = payload.requiresHumanConfirmation === true;
        const executed = payload.executed === true;
        proposalSection.append(message(
          `사람 확인 필요: ${requiresHuman ? '예' : '확인 불가'} · 실행 여부: ${executed ? '실행됨(성공으로 해석하지 않음)' : '미실행'}`,
          executed ? 'error' : 'ok',
        ));
        if (executed) {
          proposalSection.append(message('AI가 이미 실행했다고 답한 설명은 사용할 수 없습니다. 이 화면은 아무 조치도 실행하지 않았습니다.', 'error'));
        }
        root.append(proposalSection);

        return root;
      }

      // 알 수 없는 상태
      root.append(
        message(`AI 설명 상태 확인 불가 · 사건 ${eventId}`, 'error'),
        message('설명 상태를 확인할 수 없습니다. 기록은 그대로 유지됩니다.', 'error'),
      );
      return root;
    },
    renderAction({ status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error } = {}) {
      // 표시 전용. 조치 버튼·POST 요청·인증 티켓을 만들지 않는다.
      // 새 입력이 오면 이전 표시를 모두 지우고 다시 그린다.
      const root = document.createElement('div');
      root.className = 'student-action';

      const text = (value, kind) => {
        const p = document.createElement('p');
        p.className = `student-state student-state-${kind}`;
        p.textContent = value;
        return p;
      };
      const row = (label, value) => {
        const dl = document.createElement('dl');
        dl.className = 'student-action-row';
        const dt = document.createElement('dt');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.textContent = value;
        dl.append(dt, dd);
        return dl;
      };
      const fmt = (value) => {
        if (typeof value !== 'string' || value.length === 0) return '시각 정보 없음';
        const ms = Date.parse(value);
        return Number.isFinite(ms) ? `${new Date(ms).toLocaleString('ko-KR')} (${value})` : value;
      };
      const asText = (value) => (value == null ? '' : String(value));

      // 공식 안내: 지금 기록에는 supportedActions 빈 배열이라 조치 준비 버튼이 안 나오는 것이 정상.
      const supported = event && Array.isArray(event.supportedActions) ? event.supportedActions : null;
      if (supported && supported.length === 0) {
        root.append(text(
          '연동 시스템이 지원하는 조치가 없어 실제 처리 경로가 열리지 않습니다. 화면에 조치 준비 버튼이 나오지 않는 것이 정상입니다.',
          'empty',
        ));
      }

      if (status === 'idle' || status == null) {
        root.append(text('아직 미실행(idle) · 조치 제안은 아직 실행되지 않았습니다.', 'idle'));
        root.append(text('조치 준비·집행·결과 재조회는 제공 화면의 버튼으로만 진행합니다. 학생 코드는 버튼을 만들지 않습니다.', 'idle'));
        return root;
      }

      if (status === 'loading') {
        root.append(text('조치 준비 또는 결과 조회 중(loading) · 완료 아님. 결과가 아직 확인되지 않았습니다.', 'loading'));
      } else if (status === 'prepared') {
        root.append(
          text('준비됨·미실행(prepared) · 사람 확인 전이며 아직 서버로 전달되지 않았습니다.', 'loading'),
          text('제공 화면의 「대상과 조치를 확인했으며 집행합니다」 버튼을 직접 눌러야 서버로 전달됩니다. 학생 코드는 대신 실행하지 않습니다.', 'loading'),
        );
      } else if (status === 'executing') {
        root.append(text('서버에 전달 중(executing) · 결과가 아직 확인되지 않았습니다.', 'loading'));
      } else if (status === 'pending') {
        root.append(text('서버 접수·처리 중(pending) · 서버가 받았다는 ACK는 효과가 아닙니다. 결과가 아직 확인되지 않았습니다.', 'loading'));
      } else if (status === 'succeeded') {
        const observed = observation && observation.effectApplied === true;
        if (observed) {
          root.append(
            text('효과 확인(succeeded)', 'ok'),
            row('관측 시각(observedAt)', fmt(observation.observedAt)),
            row('effectApplied', 'true'),
          );
        } else {
          root.append(
            text('결과 불명(unknown) · succeeded 응답이지만 관측된 효과(effectApplied===true)가 확인되지 않아 성공으로 판정하지 않습니다.', 'error'),
            text('효과 없음으로도 단정하지 않습니다. 제공 화면의 「연동 시스템 결과만 재조회」로 결과만 다시 확인하세요.', 'error'),
          );
        }
      } else if (status === 'denied') {
        root.append(text('거절(denied) · 연동 시스템이 이 조치를 거절했습니다.', 'error'));
      } else if (status === 'failed') {
        root.append(text('실패(failed) · 연동 시스템이 이 조치를 처리하지 못했습니다.', 'error'));
      } else if (status === 'unknown') {
        root.append(
          text('결과 불명(unknown) · 성공으로도 효과 없음으로도 판단하지 않습니다.', 'error'),
          text('제공 화면의 「연동 시스템 결과만 재조회」로 결과만 다시 확인하세요. 자동 재시도·자동 재전송은 하지 않습니다.', 'error'),
        );
      } else if (status === 'expired') {
        root.append(
          text('확인 기한 지남(expired) · 이번 준비로는 집행할 수 없습니다.', 'error'),
          text('제공 화면의 「조치 준비」로 다시 준비하고 실제 대상과 확인 기한을 다시 확인하세요.', 'error'),
        );
      } else if (status === 'error') {
        const code = error && typeof error.code === 'string' && error.code.length > 0 ? error.code : 'UNKNOWN_ERROR';
        const detail = error && typeof error.message === 'string' && error.message.length > 0
          ? error.message
          : '요청이 처리되지 않았습니다.';
        root.append(text(`요청 처리 안 됨(error) · ${code}: ${detail}`, 'error'));
      } else {
        root.append(text(`조치 상태 확인 불가(unknown) · 서버가 보낸 원래 값: ${asText(status)}`, 'error'));
      }

      // 현재 사건·근거 ID·조치·대상·generation·요청·영수증·버전 (있는 것만 글자로)
      const eventId = event && typeof event.id === 'string' && event.id.length > 0 ? event.id : null;
      const evidenceIds = event && Array.isArray(event.evidence)
        ? event.evidence.map((ev) => ev && typeof ev.id === 'string' ? ev.id : null).filter((v) => v)
        : [];

      if (eventId) root.append(row('사건 ID(event.id)', eventId));
      if (evidenceIds.length > 0) root.append(row('근거 ID(event.evidence.id)', evidenceIds.join(', ')));
      if (typeof actionId === 'string' && actionId.length > 0) root.append(row('조치 ID(actionId)', actionId));
      if (target && typeof target.id === 'string' && target.id.length > 0) {
        root.append(row('실제 대상(target.id)', target.id));
        if (Number.isSafeInteger(target.generation)) root.append(row('대상 세대(target.generation)', String(target.generation)));
      }
      if (typeof confirmationExpiresAt === 'string' && confirmationExpiresAt.length > 0) {
        root.append(row('사람 확인 기한(confirmationExpiresAt)', fmt(confirmationExpiresAt)));
      }

      const requestId = receipt && typeof receipt.requestId === 'string' && receipt.requestId.length > 0 ? receipt.requestId : null;
      const receiptId = receipt && typeof receipt.receiptId === 'string' && receipt.receiptId.length > 0 ? receipt.receiptId : null;
      const version = receipt && Number.isSafeInteger(receipt.version) ? String(receipt.version) : null;
      const replayed = receipt && typeof receipt.replayed === 'boolean' ? receipt.replayed : null;
      const superseded = receipt && receipt.superseded === true;

      if (requestId) root.append(row('요청 ID(requestId)', requestId));
      if (receiptId) root.append(row('영수증 ID(receiptId)', receiptId));
      if (version) root.append(row('영수증 버전(version)', version));
      if (replayed !== null) root.append(row('재전송 여부(replayed)', replayed ? 'true' : 'false'));
      if (superseded) {
        root.append(text('이전 조회 결과는 최신 결과를 대신하지 않습니다(superseded). 결과만 다시 조회하세요.', 'error'));
      }

      // observation 은 succeeded 이면서 effectApplied===true 인 경우에만 위에서 이미 표시했다.
      // 그 외 상태에서 observation 이 와도 성공으로 해석하지 않는다.

      // 성공적으로 그린 바깥 요소에만 data 속성 부여(계약: event.id, receipt.requestId)
      if (eventId) root.setAttribute('data-student-action-event', eventId);
      if (requestId) root.setAttribute('data-student-action-request', requestId);

      // message 는 상태별 기본 문구와 다를 때만 덧붙인다(예: denied/failed 상세 사유).
      if (typeof message === 'string' && message.length > 0) {
        root.append(text(`안내: ${message}`, status === 'denied' || status === 'failed' || status === 'error' ? 'error' : 'idle'));
      }

      root.append(text(
        '이 화면은 상태 표시 전용입니다. 조치 버튼·집행 요청·인증 티켓은 제공 화면에서만 다룹니다. 「조치 화면 취소」는 화면 표시를 정리할 뿐, 이미 서버에 전달된 조치 효과를 되돌리는 기능이 아닙니다.',
        'idle',
      ));

      return root;
    },
  };
}
