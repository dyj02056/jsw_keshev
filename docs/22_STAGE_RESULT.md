# 13~21단계 결과 표 (현재 제출본 = 이 문서를 포함한 커밋)

이 문서는 `docs/22_REPRODUCTION.md`의 재현 기록과 함께 읽는 **단계별 결과 표**입니다. 22단계 요구사항(누적 원문 일관성·이동 가능한 구성·재현 기록·시연/학생 진술 구분·버전/지원 범위)에 따라, 13~21단계 각 항목을 "모의 데이터(demo) 성공"과 "실제 연결 성공"으로 구분해 적습니다. **"미확인"과 "학생 구현 미완료"를 구분합니다.**

- 현재 코드 검토 기준: 이 문서를 포함할 다음 커밋(branch `main`). 직전 커밋은 `9fdcabee6adc03ae60d005a9e5c3d75800a5c756`("22 commit")이며, 새 커밋의 40자리 해시는 커밋한 뒤 `git rev-parse HEAD`로 확인하고 과제 화면 입력값과 대조합니다. 이전 문서의 부모 커밋 `81b17bad0fc3cc351a8f9e24453a0a3a7d6549a4`는 과거 기준입니다.
- 과거 화면 재현 대상: `005f53932823d9fa11e7415b96e4a7c9324fcc2d` (학생 진술; 기준 커밋에서 다시 실행하지 않음)
- 변경 관계(현재 기준): `81b17ba…` 이후 `c45ae7b`(시작 틀 갱신)와 `9fdcabe…`에서 앱 코드가 바뀌었습니다. 아래 과거 단계 표의 "문서만 변경" 서술은 `005f539…`·`81b17ba…` 시점의 설명이며 현재 기준이 아닙니다. 이번 작업 폴더 변경: `student/extension.mjs` 수정, `student/appearance.json` 추가, 제공 파일 5개(`public/index.html`, `public/style.css`, `public/pc-status-view.mjs`, `src/pc-status.mjs`, `src/server.mjs`)를 시작 틀 버전(`c45ae7b`)으로 되돌림, `public/dashboard-view.mjs` 삭제. 되돌린 5개 파일의 SHA-256은 `.on-starter-manifest.json`과 일치합니다(직접 대조). 상세는 `docs/22_REPRODUCTION.md`.
- 기준 버전(이전 제출 문서 작성 시점): `alekov-client-starter@0.2.11`; 현재 작업 폴더: `alekov-client-starter@0.2.21` (package.json)
- 진술 주체: 학생(이 문서 작성자). AI 원문 검토는 실행 성공 증명이 아닙니다.
- 표시 규칙:
  - `demo` = 예제 데이터(demo) 응답. 실제 연결 성공 아님.
  - `실연결` = 실제 SDP 엔진/AI 게이트 연결. 기본 실행에서는 나오지 않음.
  - `미구현` = 학생 구현이 아직 없음(대기 문구만 반환 등). 제공 UI가 대신 계산하지 않음.
  - `미확인` = 이번 재현에서 직접 확인하지 못한 항목(실행 미실시 등).
  - `해당없음` = 이 단계 범위가 아님.

## 13단계 · 세 메뉴와 로그인·기기 상태

| 항목 | 결과 | 확인 시각 | 근거(파일·문구) | 모의/실제 구분 | 미확인 원인 |
|---|---|---|---|---|---|
| 세 메뉴(보호 현황·업무 앱·보안 기록) 열기 | 과거 커밋에서 사용자 진술로 정상 | 2026-10-23 | 학생이 `005f539…`의 새 폴더에서 세 탭이 정상 작동한다고 보고(캡처 미제공) | 제공 UI | 현재 제출본에서 별도 실행하지 않음 |
| 학생 `renderIdentity` 표시 | 미확인 | — | `student/extension.mjs` `renderIdentity` | 제공 meta.mode 값 따름 | 실행 검증 미실시 |
| 실패/확인 불가 구분 | 미확인 | — | `renderIdentity` 내 `student-state-error` 분기 | — | 실행 검증 미실시 |
| 다시 불러오기 후 상태 유지 | 미확인 | — | `loadAll()` `#refresh` 클릭 | — | 실행 검증 미실시 |
| demo 표시 구분 | 미확인 | — | `MODE_LABELS.demo = '예제 데이터(demo) · 실제 연결 아님'` | demo 구분됨 | npm run demo 미실시 |

## 14단계 · 업무 앱 접속 판정·상태

> 업무 앱 탭 접근은 과거 재현 커밋 `005f539…`에서 학생 진술로 정상 확인했습니다. 현재 기준 커밋에서 다시 실행하지 않았고, 아래 개별 판정 데이터와 오류 분기도 각각 확인했다는 근거가 없어 미확인입니다.

| 항목 | 결과 | 확인 시각 | 근거 | 모의/실제 구분 | 미확인 원인 |
|---|---|---|---|---|---|
| 앱 목록 표시(`/api/apps`) | 미확인 | — | `renderApps()` | — | 실행 미실시 |
| 판정 4종(allow/deny/challenge/unknown) 구분 | 미확인 | — | `DECISIONS` 상수, `renderDecision` | — | 실행 미실시 |
| 판정 이유 표시 | 미확인 | — | `renderDecision` `판정 이유` 행 | — | 실행 미실시 |
| unknown을 allow로 표시 안 함 | 미확인 | — | `renderDecision` `unknown` 분기 | — | 실행 미실시 |
| 요청 실패를 판정 실패로 표시 | 미확인 | — | `state.access.status === 'error'` 분기 | — | 실행 미실시 |
| demo 판정 구분 | 미확인 | — | `MODE_LABELS.demo` | demo 구분됨 | demo 미실시 |

## 15단계 · 접속 기록과 기존 XDR 사건

> 보안 기록 탭 접근은 과거 재현 커밋 `005f539…`에서 학생 진술로 정상 확인했습니다. 현재 기준 커밋에서 다시 실행하지 않았고, 아래 목록·필터·상세 동작은 각각 확인했다는 근거가 없어 미확인입니다.

| 항목 | 결과 | 확인 시각 | 근거 | 모의/실제 구분 | 미확인 원인 |
|---|---|---|---|---|---|
| 기록 목록(최근 40건 상한) 표시 | 미확인 | — | `COVERAGE_RULES.events.limit = 40` | — | 실행 미실시 |
| 종류(access/xdr) 구분 | 미확인 | — | `KIND_LABELS` | — | 실행 미실시 |
| 시각 표시 | 미확인 | — | `formatAt()` | — | 실행 미실시 |
| 필터(종류·앱·접속 상태) | 미확인 | — | `buildSelect` 3개 | — | 실행 미실시 |
| 상세 열기/닫기 | 미확인 | — | `renderDetail` | — | 실행 미실시 |
| 다시 불러오기 시 이전 결과 대체 | 미확인 | — | `renderEvents` `setChildren` | — | 실행 미실시 |
| 빈 목록과 오류 구분 | 미확인 | — | `data.length===0` vs `status==='error'` | — | 실행 미실시 |

## 16단계 · 알림·기기·세션·설정·오류·빈 화면

| 항목 | 결과 | 확인 시각 | 근거 | 모의/실제 구분 | 미확인 원인 |
|---|---|---|---|---|---|
| 기기·세션 상태 요약 | 코드 확인(미실행) | — | `renderStatus`가 전달 자료의 상태·목록 표시 | 학생 구현 | 화면 실행 검증 미실시 |
| 알림 표시 | 코드 확인(미실행) | — | `notifications`의 resource·code·message 표시 | 학생 구현 | 화면 실행 검증 미실시 |
| 로딩·빈·오류 구분 | 코드 확인(미실행) | — | devices/sessions/diagnostics 상태 분기 | 학생 구현 | 화면 실행 검증 미실시 |
| 기기·세션 오류 수동 재시도 안내 | 코드 확인(미실행) | — | 각 오류 분기가 오류 문구와 위쪽 「다시 불러오기」 직접 누르기 안내를 표시하며 자동 재시도는 하지 않음 | 학생 구현 | 오류 화면 실행 미실시 |
| 진단 값·도움정보 복사 | 코드 확인(미실행) | — | 진단 성공 시 안전 필드(requestId·component·version·checkedAt·engine mode/code)를 표시하고 「도움정보 복사」 버튼을 생성 | 학생 구현 | 실제 복사·비밀 제외 검증 미실시 |
| 미지원 조치 안내 | 코드 확인(미실행) | — | `renderEvents` 상세에서 지원 조치별 비활성 `<action> 미지원` 버튼 | 학생 구현 | 화면·네트워크 검증 미실시 |

> 코드 검토 기준은 현재 제출본(이 문서를 포함한 커밋, 앱 코드는 부모 `81b17ba…` 및 `005f539…`와 동일), 화면 진술은 과거 `005f539…`에 대한 것입니다. 현재 제출본에서 다시 실행한 증거는 아닙니다. `renderStatus` 함수에는 오류 재시도 안내와 진단 값·복사 UI가 구현되어 있지만 실제 화면·클립보드 결과는 미확인입니다. 제공 UI 동작은 학생 구현 완료로 계산하지 않습니다.

## 17단계 · AI 연결

| 항목 | 결과 | 확인 시각 | 근거 | 모의/실제 구분 | 미확인 원인 |
|---|---|---|---|---|---|
| 연결 상태 표시(test/verified) | 미확인 | — | `renderAiConnection` `audience === 'test'/'verified'` | 실제 게이트 없으면 `test` | 운영자 계정·앱 권한 준비 전 |
| 모델 점검 결과(modelCount) | 미확인 | — | `validAiCheck` `modelCount` 표시 | — | AI 게이트 미연결 |
| 인증 오류 구분 | 미확인 | — | `AI_MESSAGES` `WB_CLCO_AUTH_REQUIRED` 등 | — | AI 게이트 미연결 |
| 이용 한도·시간 오류 구분 | 미확인 | — | `AI_MESSAGES` `WB_CLCO_*` | — | AI 게이트 미연결 |
| 수동 재시도(버튼) | 미확인 | — | `#ai-check` | — | 실행 미실시 |
| 연결 세대 초기화 | 미확인 | — | `cancelAiCheck({reset:true})` | — | 실행 미실시 |
| 비밀값 미표시 | 미확인 | — | `safeAiFailure`, `helpInfo` | — | 실행 미실시 |
| 시간 초과·취소 | 미확인 | — | `aiRequest` `REQUEST_TIMEOUT_MS=10000` | — | 실행 미실시 |

## 18단계 · 근거가 있는 AI 사건 설명

| 항목 | 결과 | 확인 시각 | 근거 | 모의/실제 구분 | 미확인 원인 |
|---|---|---|---|---|---|
| evidenceId 바인딩 | 미확인 | — | `renderExplanation` `evidenceById` 매핑 | — | 실행 미실시 |
| 근거 없는 인용 거부 | 미확인 | — | `missingRefs.length > 0` → 실패 표시 | — | 실행 미실시 |
| unknown 상태 표시 | 미확인 | — | `unknownEntries` | — | 실행 미실시 |
| 불충분 근거 거부 | 미확인 | — | `validExplanation` `refs(x.evidenceIds)` | — | 실행 미실시 |
| 다른 사건 인용 거부 | 미확인 | — | `validExplanation` `evidenceIds.has(ref)` | — | 실행 미실시 |
| 조치 제안 미실행 표시 | 미확인 | — | `requiresHumanConfirmation===true`, `executed===false` 검증 | — | 실행 미실시 |
| 기존 접속·기록 유지 | 미확인 | — | `cancelExplanation` 비파괴 | — | 실행 미실시 |
| 다시 요청 | 미확인 | — | `#ai-explanation-cancel` | — | 실행 미실시 |

## 19단계 · AI 조치 제안과 서버 처리 결과

| 항목 | 결과 | 확인 시각 | 근거 | 모의/실제 구분 | 미확인 원인 |
|---|---|---|---|---|---|
| 조치 제안과 실행 분리 | 미확인 | — | `renderAction` `prepared · 미실행` | — | 실행 미실시 |
| 사람 확인 버튼 | 미확인 | — | `#action-confirm` | — | 실행 미실시 |
| confirmation 기한 | 미확인 | — | `confirmationExpiresAt` 타이머 | — | 실행 미실시 |
| ACK ≠ 완료 | 미확인 | — | `pending` 라벨 "ACK는 완료가 아님" | — | 실행 미실시 |
| 관측된 효과만 성공 표시 | 미확인 | — | `observation.effectApplied===true` | — | 실행 미실시 |
| 중복 방지 | 미확인 | — | `actionGeneration` 세대 증가 | — | 실행 미실시 |
| unknown을 성공으로 보지 않음 | 미확인 | — | `unknown` 라벨 | — | 실행 미실시 |
| 다시 조회 시 이전 결과 제거 | 미확인 | — | `clearAction` | — | 실행 미실시 |

> `src/actions/store.mjs`의 `createActionStore`는 **옵션 기존 SQLite**가 명시적으로 제공된 경우에만 `alekov_action_intents/state/audit`에 조치·감사 기록을 영속 저장합니다. 기본 실행에는 이 옵션이 없습니다(19단계 실집행 미지원).

## 20단계 · 사용 라이브러리와 취약점 정보

| 항목 | 결과 | 확인 시각 | 근거 | 모의/실제 구분 | 미확인 원인 |
|---|---|---|---|---|---|
| lock 기반 정확한 버전 | 미확인 | — | `normalizeScan` 입력 계약 | — | `.env.example` `ON_APPROVED_PUBLIC_PACKAGES=[]` |
| OSV 대조 결과 | 미확인 | — | `student-vulnerabilities-table` | — | 승인 패키지 비어 있음 |
| 미설정·미조회·조회불가 구분 | 미확인 | — | `SCAN_LABELS` 5종 | — | 실행 미실시 |
| none_found와 unverifiable 구분 | 미확인 | — | `PKG_STATUS_LABELS` | — | 실행 미실시 |
| 부분 결과 유지 | 미확인 | — | `scanStatus='partial'` 분기 | — | 실행 미실시 |
| 다시 조회 시 결과 교체 | 미확인 | — | `loadVulnerabilities` `vulnerabilitiesGeneration` | — | 실행 미실시 |
| 실패 시 이전 결과를 성공으로 표시 안 함 | 미확인 | — | `status==='error'` 분기 | — | 실행 미실시 |

## 21단계 · 설명서와 구성도

| 항목 | 결과 | 확인 시각 | 근거 | 모의/실제 구분 | 미확인 원인 |
|---|---|---|---|---|---|
| 설치·실행·종료·재실행 안내 | 문서 작성됨 | — | `docs/STUDENT_RUNBOOK.md` 4장 | 문서 성격 | 실제 실행으로 재현한 결과는 `docs/22_REPRODUCTION.md`에서 미확인 |
| 구성도(텍스트+Mermaid) | 문서 작성됨 | — | `docs/STUDENT_RUNBOOK.md` 5장 | 문서 성격 | 그림 렌더 검증 미실시 |
| 제공/학생 구현 경계 | 문서 작성됨 | — | `docs/STUDENT_RUNBOOK.md` 6장 | 문서 성격 | 코드 대조 확인은 위 표에서 개별 항목으로 |
| 오류 해결 안내 | 문서 작성됨 | — | `docs/STUDENT_RUNBOOK.md` 7장, `docs/CONNECTION_TROUBLESHOOT.md` | 문서 성격 | 실제 오류 재현 미실시 |

## 이 표를 읽는 방법

- **"미구현"은 학생이 그 기능을 아직 만들지 않은 상태입니다.** 제공 화면의 기능이 동작해도 학생 구현 완료로 계산하지 않습니다. 16단계 `renderStatus`는 코드 상 구현되었습니다.
- **"미확인"은 이번 22단계 재현에서 직접 실행해 확인하지 못한 항목**이며, 실패와 다릅니다. `docs/22_REPRODUCTION.md`의 미확인 사항과 짝을 이룹니다.
- `demo` 결과는 "예제 데이터"이며 실제 연결 성공이 아닙니다.
- 이 표의 결과는 **학생 진술**이며 서버의 실행 검증이 아닙니다.
- 19단계 실집행(실제 원천 조치 연결)은 현재 미준비 상태로, `docs/FINAL_PRODUCT_GUIDE.md` 5·9장과 일치합니다.

## PC 관제 대시보드 보완 (2026-10-27, 수정본)

대시보드(카드 4개, 추이, 근거 모음)를 제공 파일이 아니라 `student/extension.mjs`의 `renderStatus` 안에서 그립니다. 제공 조회 `GET /api/pc/status`(`src/pc-status.mjs`)는 시작 틀 그대로이며, 학생 코드는 새로 수집하지 않습니다. 제공 서버는 항목별 조회 시각을 주지 않으므로 측정 시각은 응답의 `measuredAt` 하나이고, 화면에도 그렇게 적습니다.

| 구분 | 내용 |
|---|---|
| 제공 기능 | `/api/pc/status`의 CPU·메모리·디스크·네트워크·방화벽·Windows 경고·오류 조회, 제공 카드 「내 PC 상태」, `mode`(연결 상태) 전달 |
| 학생 추가(`student/extension.mjs`) | 핵심 3가지 안내, 카드 4개(CPU·메모리·디스크·SDP 연결), 「PC 상태 조회/다시 조회」와 대기 표시, 성공 조회 최대 12회 추이(직전 대비 pp), 네트워크·방화벽·Windows 기록 근거 모음과 한계, 항목별 실패 이유와 다음 할 일 |
| 학생 추가(`student/appearance.json`) | 앱 이름 `jsw_keshev`, 카드 배치 `student-first`(아이콘 없음) |

### 직접 확인한 것 (2026-10-27, 이 PC, Node v24.21.0, `node src/server.mjs`)

| 항목 | 결과 | 근거 |
|---|---|---|
| `npm run check` | 통과 | 문법 검사만 |
| `GET /api/pc/status` | 응답 `ok:true`, 여섯 항목 `state:ok`, 항목별 `checkedAt` 없음 | curl 응답 |
| `/student/appearance.json` | `state:applied`, `appName:jsw_keshev`, 아이콘 없음 | curl 응답, 탭 제목 「jsw_keshev · ZTNA & XDR」 |
| 조회 성공 화면 | CPU·메모리·디스크 「실측」과 측정 시각 표시, SDP 카드 「SDP 미연결」 | 브라우저 확인(값은 이 PC의 실측이며 예시 값 아님) |
| 두 번 조회 시 추이 | 직전 대비 pp 표시(예: CPU +0.2 pp), 첫 행은 「첫 조회」 | 브라우저 확인 |
| 키보드만 사용 | 버튼에 포커스 후 Enter로 조회, 조회가 끝나면 포커스가 버튼으로 돌아옴 | 브라우저 확인 |
| 조회 실패 | 세 카드 「확인 불가」, 이유와 다음 할 일 표시, 추이 행 유지, 예시 값 없음 | 브라우저에서 해당 요청만 실패시켜 확인 |
| 일부 항목 실패 | CPU 「읽기 권한 없음」·Windows 기록 「시간 초과」로 표시, 나머지는 실측, 그 회차는 추이에서 제외 | 응답 값을 바꿔 시험(실제 권한 오류 아님) |
| 관리자 권한·설정 변경 | 사용하지 않음 | 제공 읽기 코드만 사용 |

### 직접 확인하지 못한 것(미확인)

- 설치형 앱(`npm run package-app` 결과, 바탕화면 바로가기)에서의 실행: 이 PC에 승인 실행 host와 runtime이 없어 포장하지 못했습니다.
- `start-alekov.ps1`로 켠 계정 연결·AI 연결·SDP 연결 상태, 운영 서버 조회 결과(이번 확인은 `node src/server.mjs`로 켠 기본 실행).
- 일부 항목 실패와 시간 초과는 응답을 바꿔 시험한 것이며 실제 권한 오류·시간 초과 상황을 재현한 것이 아닙니다.
- 작은 화면·화면 읽기 프로그램에서의 동작, Tab 순서 전체 점검.

### 연결 상태에 대한 해석 (강사 피드백 반영)

「연결 없음」·「SDP 미연결」은 `-SdpHostConfig` 없이 켠 기본 실행의 정상 표시이며 학생이 준비할 항목이 아닙니다. 연결된 것처럼 바꾸지 않습니다. 계정 연결·AI 연결과는 별개입니다. 단계 판정은 제출한 커밋의 코드로 합니다.

이 표의 결과는 학생 환경에서 직접 확인한 것이며 서버의 실행 검증이 아닙니다. 재현 절차는 `docs/STUDENT_RUNBOOK.md` 11장을 따릅니다.
