# 케셰브 실행 안내서 (학생용, 21단계)

이 문서는 다른 사람이 이 프로젝트를 실제로 설치·실행·종료·재실행하고, 실패 시 무엇을 확인해야 하는지 스스로 따라 할 수 있게 정리한 학생 안내서입니다. 제공 문서는 덮어쓰지 않았습니다. 이 문서의 명령·경로·버전은 package.json, src/server.mjs, tools/start-alekov.ps1, public/index.html, public/app.js, student/extension.mjs, .env.example의 실제 원문과 대조해 작성했습니다. 서버가 명령을 실행해 검증한 결과가 아니며, 직접 실행해 확인하지 않은 항목은 "미확인"으로 표시했습니다.

## 1. 목적과 기능

케셰브(KESHEV)는 회사 직원이 자기 로그인·기기·세션 상태, 업무 앱 접속 판정, 최근 접속·XDR 기록, AI 사건 설명, 설치 패키지 취약점 정보를 한 화면에서 확인하는 로컬 보안 Agent 앱입니다. 제공 공통 UI와 학생 구현 표시(student/extension.mjs)는 화면에서 분리되어 있습니다.

기능 요약:

| 화면 | 기능 | 담당 |
|---|---|---|
| 보호 현황 | 로그인·기기·세션 상태, 알림, 도움정보, AI 연결 절차, AI 연결 점검, 패키지 취약점 조회 | 제공 UI + 학생 표시 |
| 업무 앱 | 앱별 접속 판정 요청, 판정 결과 표시 | 제공 UI + 학생 표시 |
| 보안 기록 | 접속·XDR 기록 목록, 상세, AI 사건 설명, 조치 준비·결과 | 제공 UI + 학생 표시 |

## 2. 지원 환경과 버전

| 항목 | 값 | 근거 |
|---|---|---|
| Node.js | 24.19.0 (engines) | package.json |
| 패키지 버전 | alekov-client-starter@0.2.21 | package.json |
| 외부 npm 의존성 | 없음 (import는 Node 내장 모듈만) | package.json, src/server.mjs |
| 기본 실행 모드 | disconnected (기존 SDP 엔진 미연결) | src/server.mjs (engine.evidenceMode 기본값) |
| 기본 포트 | 5189 (ON_PORT로 변경 가능) | src/server.mjs (process.env.ON_PORT ?? 5189) |
| 바인딩 주소 | 127.0.0.1 (loopback 전용) | src/server.mjs (server.listen(port,'127.0.0.1',...)) |
| 브라우저 | 최신 Chromium 계열 권장. 미확인: Firefox·Safari 실제 실행 | 이 문서 작성 시 미실행 |
| OS | Windows PowerShell 기준. macOS·Linux는 미확인 | tools/start-alekov.ps1 |

지원하지 않는 환경·미확인 동작:

- npm test는 이 package.json에 없습니다. 있는 스크립트는 start·demo·check 세 개입니다.
- 실제 SDP 엔진·XDR·AI 게이트·유료 모델 호출은 기본 실행에서 연결되지 않습니다.
- node_modules를 설치하지 않습니다. npm install이 필요 없습니다.

## 3. 폴더 구조 (실제 파일 기준)

on-client/                     ← Git 최상위가 아니라 프로젝트 폴더 아래에 위치
├─ package.json                (scripts: start/demo/check, engines.node=24.19.0)
├─ README.md
├─ .env.example
├─ .on-starter-manifest.json
├─ docs/                       (제공 문서, 학생 문서 STUDENT_RUNBOOK.md 포함)
├─ public/
│  ├─ index.html               (화면 골격, CSP, data-testid, 버튼 id)
│  ├─ app.js                   (제공 공통 UI, 학생 슬롯 렌더러)
│  ├─ style.css
│  ├─ ai-connect.mjs
│  └─ vulnerabilities-view.mjs
├─ src/
│  ├─ server.mjs               (HTTP 서버, 라우트, 안전 응답 검증)
│  ├─ engine.mjs, engine/      (SDP host 설정·엔진)
│  ├─ actions/                 (조치 준비·집행 서비스)
│  ├─ ai/                      (AI 서비스·자격 보관)
│  ├─ connection/              (native 로그인·연결 관리)
│  ├─ learner-support/
│  └─ vulnerabilities/         (OSV·lock 스캔)
├─ student/
│  ├─ extension.mjs            (학생 구현 — render* 함수)
│  └─ engine-adapter.mjs
├─ tools/
│  ├─ start-alekov.ps1         (Windows 실행 도구)
│  ├─ app-credentials.ps1
│  ├─ native-host-registry.ps1
│  └─ prepare-native-host.ps1
└─ vendor/
   ├─ clco-http.mjs
   └─ NOTICE.md

주의: Git 저장소의 최상위는 on-client가 아니라 그 위의 프로젝트 폴더입니다. on-client 폴더 자체를 저장소 루트로 착각하지 않습니다.

## 4. 실행 절차 (PowerShell)

### 4.1 PowerShell을 여는 위치

- 파일 탐색기에서 on-client 폴더를 엽니다.
- 주소 표시줄에 powershell을 입력하고 Enter를 누르면 그 폴더에서 PowerShell이 열립니다.
- 이미 열린 PowerShell이 있다면 cd로 on-client 폴더로 이동합니다. 예: cd C:\경로\on-client

### 4.2 필요 프로그램 확인

    node --version

- 기대 출력: v24.19.0 (수업·검사 기준).
- Node.js가 없거나 다른 버전이면 https://nodejs.org 에서 24.19.0을 설치한 뒤 새 PowerShell 창을 엽니다.
- tools/start-alekov.ps1은 Node.js 주 버전이 22~24가 아니면 실행을 거절하고, 24.19.0이 아니면 참고 안내만 하고 진행합니다(원문: "참고: 지금 Node.js 는 vXX 입니다. 수업 기준은 v24.19.0 입니다.").

### 4.3 실행 명령

권장(실행 도구 사용):

    powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1

계정 연결 준비를 하지 않는 직접 실행(개발·오프라인 화면 확인용):

    npm start

`npm start`는 `node src/server.mjs`만 실행하므로 계정 연결용 로컬 보관소 준비를 건너뜁니다. 계정 연결이 필요하면 기본 실행 도구를 사용하세요. `-ExecutionPolicy Bypass`는 이번 PowerShell 실행에만 적용되며 PC의 보안 설정은 바뀌지 않습니다.

옵션(tools/start-alekov.ps1 원문):

| 옵션 | 의미 |
|---|---|
| -Port <1024~65535> | 포트 번호(기본 5189). 포트가 사용 중이면 그 프로그램을 끄지 않고 안내 후 종료 |
| -Background | 창 없이 실행. 안내된 프로세스 번호의 node를 작업 관리자에서 종료하면 꺼짐 |
| -Demo | 예제 자료로 실행 (실제 연결 아님) |
| -NoNativeHost | 담당자 안내에 따라 자동 계정 연결 준비 없이 로컬 확인 |
| -NativeHostConfig "<경로>" | 담당자가 안내한 계정·AI 연결 설정. 절대경로, 큰따옴표·제어문자·대체 스트림 없이 |
| -SdpHostConfig "<경로>" | 담당자가 안내한 SDP 연결 설정. -Demo와 함께 쓸 수 없음 |
| -WaitSeconds <1~120> | 켜짐 확인 대기(기본 20) |

실행 도구는 다음 경우 파일을 만들거나 다른 프로그램을 종료하지 않고 안내 후 종료합니다: 앱 폴더가 아님, package.json name !== alekov-client-starter, Node.js 없음/지원 밖 버전, 포트 사용 중, 설정 경로가 정규화된 절대 경로가 아님/일반 파일이 아님/상위 경로에 reparse point 있음, -Demo와 -SdpHostConfig 동시 사용.

### 4.4 브라우저 주소

- 기본: http://127.0.0.1:5189/
- -Port 5190을 썼다면 http://127.0.0.1:5190/
- localhost도 서버가 허용하지만(allowedHosts에 localhost:port 포함), loopback 외 주소는 HOST_REJECTED로 거절됩니다.

### 4.5 정상 시작 신호

- 실행 도구(tools/start-alekov.ps1) 사용 시, 서버가 HTTP 200으로 응답하면 PowerShell 창에 다음이 표시됩니다(원문):
  - "계정 연결 준비가 끝났습니다. 앱에서 확인 번호로 로그인·승인을 진행하세요." (기본 준비가 성공했을 때)
  - "케셰브가 켜졌습니다. 브라우저에서 http://127.0.0.1:5189/ 을 여세요." (포트가 다르면 해당 포트)
  - "서버가 응답한 것만 확인했습니다. AI 연결 상태는 화면에서 따로 확인해 주세요."
  - -Background면 위에 더해 "뒤에서 실행 중입니다(프로세스 번호 N). 끄려면 이 번호의 node 를 작업 관리자에서 종료하세요."
  - 그 외(-Background 아님)면 "끄려면 이 창에서 Ctrl+C 를 누르세요."
- `npm start`로 직접 실행한 경우 서버 원문 로그는 "케셰브 연결 확인: http://127.0.0.1:<port>"입니다. 이 실행만으로는 계정 연결용 로컬 준비가 되지 않아 `NATIVE_HOST_DISABLED` 또는 `ALEKOV_CONNECT_UNAVAILABLE`이 나올 수 있습니다.
- 브라우저에서 상단 mode-badge가 "연결 없음"(또는 "예제 데이터(demo) · 실제 연결 아님")으로 표시되고, 「보호 현황」 탭이 열립니다.
- mode-badge의 data-mode 속성이 disconnected 또는 demo이면 정상 시작이며, connected는 실제 엔진 연결 시에만 나옵니다(기본 실행에서는 나오지 않음).

미확인: 위 신호를 실제 새 PowerShell 창에서 재현한 결과는 이 문서 작성 시 실행하지 않았습니다(확인 1 미실행).

### 4.6 종료

- 실행 도구로 띄운 경우: 같은 PowerShell 창에서 Ctrl+C.
- -Background로 띄운 경우: 화면에 안내된 프로세스 번호의 node를 작업 관리자에서 종료.
- npm start로 직접 띄운 경우: 같은 PowerShell 창에서 Ctrl+C.
- 브라우저 주소가 더 이상 열리지 않으면 종료된 것입니다.

### 4.7 재실행

- 같은 on-client 폴더에서 4.3의 명령을 다시 실행합니다. 실행·종료는 프로젝트 파일을 바꾸지 않습니다.
- 실행 도구가 "포트 N 를 다른 프로그램이 쓰고 있습니다"로 안내하면 다른 프로그램은 그대로 두고 -Port <다른번호>를 붙여 실행하고 브라우저 주소도 그 포트로 엽니다.

## 5. 시스템 구성도

글로 쓴 구성도(그림 파일 없이 텍스트/표로 판정 가능하도록 작성):

[브라우저]
  │  HTTP (loopback 127.0.0.1:5189)
  ▼
[로컬 앱 서버  src/server.mjs]
  ├─ 정적 파일 서빙: public/index.html, public/app.js, public/style.css,
  │                  public/vulnerabilities-view.mjs, public/ai-connect.mjs,
  │                  student/extension.mjs (브라우저가 /student/extension.mjs 로 로드)
  ├─ GET  /api/me, /api/apps, /api/events, /api/devices, /api/sessions
  ├─ POST /api/access
  ├─ POST /api/ai/explain, /api/ai/check
  ├─ POST /api/ai/connect/{start,finish,status,cancel}
  ├─ POST /api/native-login/{start,status,redeem,current,cancel}
  ├─ GET  /api/diagnostics, /api/vulnerabilities
  └─ POST /api/actions/{prepare,execute,result}
        │
        ├─ (선택) SDP host  src/engine/sdp-host.mjs  ─→ 접근 제어·XDR 원천 (mTLS·JWT)
        ├─ (선택) native host  src/connection/native-context.mjs ─→ ALEPH 계정 연결
        └─ (선택) AI 게이트웨이  src/ai/service.mjs / src/ai/vault-service.mjs
                                 ─→ 수업용 AI(CLCO) 모델 응답

| 상자 | 실제 파일/모듈 | 공개 주소·설정 이름 | 비밀값 |
|---|---|---|---|
| 브라우저 | public/index.html, public/app.js | http://127.0.0.1:5189/ | 없음 |
| 로컬 앱 서버 | src/server.mjs | 위 표의 /api/* 경로 | 없음 |
| 학생 구현 표시 | student/extension.mjs (createStudentView) | 브라우저가 /student/extension.mjs로 로드 | 없음 |
| 접근 제어·XDR 원천 | src/engine/sdp-host.mjs, src/engine/sdp-host-config.mjs | --sdp-host-config <절대경로> (경로 값 자체는 문서에 쓰지 않음) | 개인 mTLS 인증서·JWT (프로젝트 밖 보관) |
| 계정 연결(native) | src/connection/native-login.mjs, src/connection/native-context.mjs | --native-host-config <절대경로> | Windows 자격 저장소 |
| AI 게이트웨이 | src/ai/service.mjs, src/ai/vault-service.mjs, vendor/clco-http.mjs | ON_AI_BASE_URL(담당자 안내), ON_AI_MODEL(앱 서버에 설정, .env.example 기본 aleph/auto) | ON_AI_APP_KEY — 문서에 쓰지 않음, .env에만 |
| AI 공급사 | (게이트웨이 내부) | 노출되지 않음 | 원본 키는 게이트웨이에만 |

Mermaid 등가 표현:

flowchart LR
  browser["브라우저\n127.0.0.1:5189"]
  server["로컬 앱 서버\nsrc/server.mjs"]
  student["학생 표시\nstudent/extension.mjs"]
  sdp["SDP 접근 제어·XDR\nsrc/engine/sdp-host.mjs"]
  native["계정 연결 native\nsrc/connection/native-*.mjs"]
  gate["AI 게이트웨이\nsrc/ai/service.mjs"]
  provider["AI 공급사\n(게이트 내부)"]
  browser --> server
  server --> student
  server -.선택.-> sdp
  server -.선택.-> native
  server -.선택.-> gate
  gate -.-> provider

실선은 기본 경로, 점선은 옵션·설정으로 켜야 하는 경로입니다. 비밀 설정값은 그림·표에서 제외했습니다.

## 6. 제공 부분과 학생 작성 부분 경계

| 구분 | 파일·모듈 | 학생이 고치나 |
|---|---|---|
| 제공 공통 UI | public/app.js, public/index.html, public/style.css, public/ai-connect.mjs, public/vulnerabilities-view.mjs | 아니요 (수정 금지) |
| 제공 서버·판정 | src/** 전체 | 아니요 |
| 제공 벤더 | vendor/clco-http.mjs | 아니요 |
| 학생 구현 | student/extension.mjs의 renderIdentity, renderDecision, renderEvents, renderStatus, renderVulnerabilities, renderAiConnection, renderExplanation, renderAction | 예 |
| 학생 어댑터 | student/engine-adapter.mjs | 예 (단계 안내에 따라) |

학생 render* 함수 계약(요약, student/extension.mjs 원문 기준):

| 함수 | 입력(구조 분해) | 반환 |
|---|---|---|
| renderIdentity({ me, devices, sessions }) | 각 {status,mode,data?,error?} | DOM 요소(div) |
| renderDecision({ status, mode, data, error, appId }) | 판정 결과 | DOM 요소(div) |
| renderEvents({ status, mode, data, error }) | 사건 배열 | DOM 요소(div) |
| renderStatus({ devices, sessions, notifications, diagnostics, mode }) | 각 자료의 상태 | DOM 요소(div) |
| renderVulnerabilities({ status, mode, data, error }) | OSV 스캔 결과 | DOM 요소(div) |
| renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted }) | AI 점검 결과 | DOM 요소(div) |
| renderExplanation({ event, explanation, checkedAt }) | 선택 사건 설명 | DOM 요소(div) |
| renderAction({ status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error }) | 조치 상태 | DOM 요소(div) |

public/app.js의 STUDENT_SLOTS에서 위 이름의 함수를 찾습니다. 반환값이 Element면 그대로, string이면 textContent로만 표시되고 null이면 "학생 구현 대기"입니다. 16단계 `renderStatus`는 전달 구조(`{devices, sessions, notifications, diagnostics, mode}`)를 직접 읽어 DOM을 반환하도록 구현되었습니다.

## 7. 오류별 확인 순서

표의 code는 서버가 실제로 내보내는 안전 오류 코드(src/server.mjs의 safeErrors, aiErrorMessages, public/app.js의 AI_MESSAGES)입니다.

| code | 화면에서 보이는 곳 | 확인 순서 |
|---|---|---|
| HOST_REJECTED | 브라우저 네트워크 응답 | 127.0.0.1:<port> 또는 localhost:<port>로 열었는지 확인. 다른 IP·호스트명으로 열지 않았는지 확인 |
| ORIGIN_REJECTED | 브라우저 응답 | 앱 화면의 버튼으로 다시 요청. 외부 도구(curl 등)로 직접 POST하지 않았는지 확인 |
| NETWORK_ERROR | 화면 오류 배너 | PowerShell 창이 살아 있는지, 포트가 맞는지 확인 후 「다시 불러오기」 |
| TIMEOUT / REQUEST_TIMEOUT | 화면 오류 배너 | 서버 응답이 10초(REQUEST_TIMEOUT_MS) 안에 오지 않음. 필요하면 사용자가 직접 다시 요청. 자동 재시도 없음 |
| ENGINE_NOT_CONNECTED | 화면 오류 배너 | 기본 실행은 disconnected이므로 정상. 실제 연결은 담당자가 -SdpHostConfig로 설정한 경우만 |
| ENGINE_RESULT_UNVERIFIED / CONTRACT_MISMATCH | 화면 오류 배너 | 서버·엔진 응답 형식이 계약과 다름. 이전 값을 정상으로 표시하지 않음. 담당자에게 도움정보 전달 |
| SUBJECT_SCOPE_UNVERIFIED | 화면 오류 배너 | 현재 로그인과 사건·프로젝트 연결을 확인할 수 없음. SDP 설정을 넣었는지 확인 |
| ON_AI_PROVISIONING_PENDING | AI 연결 점검 결과 | 담당자가 계정 연결·앱 권한을 준비해야 함. 학생 잘못 아님 |
| WB_CLCO_AUTH_REQUIRED | AI 연결 점검 결과 | 계정 연결·앱 승인 상태 확인. 열쇠를 직접 복사하지 않음 |
| WB_CLCO_ACCESS_BLOCKED | AI 연결 점검 결과 | 이용 권한 담당자 확인 |
| WB_CLCO_COHORT_BUDGET_EXHAUSTED / WB_CLCO_LIMIT_REACHED | AI 연결 점검 결과 | 담당자에게 사용량·한도 확인 |
| WB_CLCO_RATE_LIMITED / WB_CLCO_TIMEOUT / WB_CLCO_NETWORK_ERROR / WB_CLCO_SERVER_UNAVAILABLE | AI 연결 점검 결과 | 잠시 뒤 사용자가 직접 다시 점검 |
| MODEL_NOT_CONFIGURED | AI 연결 점검 결과 | 담당자가 승인한 모델인지 확인 |
| ON_AI_MODEL_LIST_EMPTY | AI 연결 점검 결과 | 담당자에게 모델 허용 설정 확인 |
| ON_AI_AUTHORIZATION_CHANGED | AI 연결 점검 결과 | 담당자에게 현재 권한 확인 후 다시 점검 |
| EVENT_NOT_FOUND | AI 설명 요청 | 기록 목록을 다시 불러온 뒤 현재 사건으로 다시 요청 |
| NOT_ALLOWED | 학생 구현 오류 | 학생 코드가 /api/me·/api/apps·/api/events·/api/devices·/api/sessions·/api/vulnerabilities 외 경로를 요청함 |
| JSON_REQUIRED / INVALID_JSON / REQUEST_INVALID / REQUEST_TOO_LARGE | 브라우저 응답 | 제공 UI 버튼이 아닌 방식으로 요청. 제공 UI를 다시 사용 |
| QUERY_REJECTED | 브라우저 응답 | URL에 ? 조건을 붙이지 않음. 학생 코드가 붙였는지 확인 |
| SERVICE_UNAVAILABLE | 브라우저 응답 | 원인 불명. 도움정보를 담당자에게 전달 |
| NATIVE_HOST_DISABLED | 계정 연결 칸 | -NativeHostConfig 없이 실행됨. 담당자가 안내한 설정으로 다시 실행 |
| ACTION_UNSUPPORTED | 조치 칸 | 현재 원천이 조치를 지원하지 않음. 정상 상태 |

실행 도구 자체의 안내 문구(tools/start-alekov.ps1 원문):

| 안내 문구(요약) | 할 일 |
|---|---|
| "앱 폴더가 아닙니다. 받은 시작 틀의 on-client 폴더 안에서 ..." | on-client 폴더 안에서 실행 |
| "바로가기(링크)로 연결된 폴더나 파일에서는 실행하지 않습니다." | 실제 폴더에서 실행 |
| "시작 틀 폴더가 아닙니다. 받은 시작 틀의 on-client 폴더에서 실행해 주세요." | package.json name 확인 |
| "NativeHostConfig에는 ... Windows 절대 파일 경로를 지정해 주세요." | 큰따옴표·제어문자·대체 스트림 없는 절대경로 |
| "SDP 연결과 예제 모드는 함께 실행할 수 없습니다." | -Demo 또는 -SdpHostConfig 중 하나만 |
| "Node.js 가 없습니다..." / "지금 Node.js 는 ... 입니다." | Node.js 24.19.0 설치 후 새 창 |
| "포트 N 를 다른 프로그램이 쓰고 있습니다..." | -Port <다른번호> |
| "앱 서버가 N 초 안에 뜨지 않았습니다..." | 창 메시지를 강사에게 |

## 8. 확인한 기능과 미확인 기능 (구분)

| 기능 | 근거 | 상태 |
|---|---|---|
| GET /api/me·/api/apps·/api/events·/api/devices·/api/sessions 라우트 존재 | src/server.mjs | 코드 확인 |
| POST /api/access·/api/ai/explain·/api/ai/check·/api/ai/connect/*·/api/native-login/*·/api/actions/* 라우트 존재 | src/server.mjs | 코드 확인 |
| GET /api/diagnostics·/api/vulnerabilities 라우트 존재 | src/server.mjs | 코드 확인 |
| public/app.js가 DOM을 createElement·textContent로만 그림 (innerHTML 금지) | public/app.js 상단 주석과 el() 구현 | 코드 확인 |
| 필수 버튼·data-testid·data-* 계약 유지 | public/index.html, public/app.js | 코드 확인 |
| CSP script-src 'self', connect-src 'self', frame-ancestors 'none' | public/index.html meta, src/server.mjs 헤더 | 코드 확인 |
| npm start가 node src/server.mjs 실행 | package.json scripts.start | 코드 확인 |
| npm run demo가 node src/server.mjs --demo 실행 | package.json scripts.demo | 코드 확인 |
| npm run check가 node --check student/extension.mjs 실행 | package.json scripts.check | 코드 확인 |
| engines.node = 24.19.0 | package.json | 코드 확인 |
| 기본 포트 5189 | src/server.mjs | 코드 확인 |
| loopback 바인딩 127.0.0.1 | src/server.mjs | 코드 확인 |
| 실행 도구 옵션(-Port·-Background·-Demo·-NativeHostConfig·-SdpHostConfig·-WaitSeconds) | tools/start-alekov.ps1 | 코드 확인 |
| 실행 도구 시작/종료 신호 원문 | tools/start-alekov.ps1 | 코드 확인 |
| 학생 render* 함수 8개 시그니처 및 renderStatus가 {devices, sessions, notifications, diagnostics, mode}를 받아 DOM 반환 | student/extension.mjs | 코드 확인 |
| .env.example에 비밀값 없음 | .env.example | 코드 확인 |
| npm start를 새 PowerShell 창에서 실제 실행 | 미실행 | 미확인 |
| npm run demo를 새 PowerShell 창에서 실제 실행 | 미실행 | 미확인 |
| 실행 도구(powershell -File .\tools\start-alekov.ps1)를 실제 실행 | 미실행 | 미확인 |
| 브라우저에서 세 탭·새로고침·도움정보·AI 연결·기록·조치 화면 실제 렌더 | 미실행 | 미확인 |
| 실제 SDP·XDR·AI 게이트·유료 모델 호출 | 미실행 | 미확인 |
| Firefox·Safari 실기기 실행 | 미실행 | 미확인 |
| 21·22단계 공식 자동 확인 접수 | 운영 미연결 | 미확인 |

## 9. 스스로 확인할 순서 (한 번에 하나씩)

아래는 사용자가 직접 실행할 순서입니다. 이 문서를 작성한 AI는 명령을 실행하지 않았으므로 각 항목의 결과는 사용자가 확인한 뒤에만 "확인됨"으로 바꿉니다.

- 확인 1 (실행 재현): 기존 작업을 커밋해 보존한 채, 새 PowerShell 창을 on-client 폴더에서 엽니다. 4.2의 node --version이 v24.19.0인지 확인 → 4.3의 powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 실행 → 4.5의 정상 시작 신호 확인(실행 도구 메시지 2줄 + 브라우저 mode-badge) → 브라우저에서 http://127.0.0.1:5189/ 열기 → Ctrl+C로 종료 → 다시 같은 명령으로 재실행. 결과를 이 문서 8장 표의 미확인 행에 반영합니다.
- 확인 2 (경로·명령·버튼 이름 대조): package.json의 scripts, tools/start-alekov.ps1의 옵션·신호 원문, src/server.mjs의 포트/loopback, public/index.html의 버튼 id(refresh, diag-load, diag-copy, vulnerabilities-load, vulnerabilities-cancel, ai-check, ai-check-cancel, ai-explanation-cancel, action-confirm, action-result-load, action-cancel, ai-connect-start, ai-connect-finish, ai-connect-status, ai-connect-cancel, ai-connect-check, ai-connect-help, ai-connect-help-copy, native-login-start, native-login-redeem, native-login-check, native-login-cancel)를 이 문서 3·4장과 대조합니다. 대조하지 못한 항목은 미확인으로 남깁니다.
- 확인 3 (선택): npm run demo로 예제 모드 표시가 data-mode="demo"인지 확인. 실제 연결 성공으로 기록하지 않습니다.

## 10. 보안·보존 원칙

- AI 열쇠·토큰·비밀번호·인증서는 .env처럼 제출에서 빠지는 파일에만 두고 이 문서·화면·Git·제출물에 넣지 않습니다. 이 문서와 .env.example에는 비밀값을 쓰지 않았습니다(.env.example의 ON_AI_MODEL=aleph/auto는 공개 모델 이름이며 열쇠가 아님).
- 기존 학생 코드·앞 단계 기능·Git 기록을 지우거나 덮어쓰지 않습니다.
- 제공 서버(src/server.mjs)·public/app.js·판정 코드·인증 설정을 수정하지 않습니다.
- 자동 재시도는 없습니다. 실패는 화면에 그대로 보이고, 다시 시도는 사용자가 직접 누릅니다.
- 확인 불가는 정상·안전으로 표시하지 않습니다.

## 11. PC 관제 대시보드와 기본 포장

대시보드는 `student/extension.mjs`의 `renderStatus`가 보호 현황의 「학생 상태·알림 표시」 칸에 그립니다. 제공 파일은 시작 틀 그대로입니다. 설치형 앱에서의 반영 여부는 이 PC에서 확인하지 못했습니다(미확인).

### 핵심 기능 3가지

| 순서 | 기능 | 상태 |
|---|---|---|
| 1 | 내 PC 점검: CPU·메모리·디스크 실측값과 측정 시각 | 구현·화면 확인 |
| 2 | 변화 추이 비교: 성공한 조회 최근 12회를 직전 대비 pp로 비교 | 구현·화면 확인 |
| 3 | PC 관찰 근거 모음: 네트워크·방화벽·Windows 경고·오류 건수와 "말할 수 없는 것" | 구현·화면 확인(판정 아님) |

서비스 연결·사용량·비용(`PC_SAAS_REFERENCE.md`의 두 번째 기능)은 구현하지 않았습니다(미구현).

### 같은 결과를 다시 만드는 순서

1. `on-client` 폴더에서 PowerShell을 열고 Node.js 버전을 봅니다(`node --version`, 기준 24.19.0, 이번 확인은 v24.21.0).
2. 문법 검사: `npm run check` (통과하면 오류 없이 끝납니다).
3. 서버를 켭니다. 이번 확인은 아래 명령으로 했습니다. 계정 연결까지 쓰려면 4.3장의 `start-alekov.ps1`을 씁니다(이번에 확인하지 않음).

   ```powershell
   node src/server.mjs
   ```

4. 브라우저에서 `http://127.0.0.1:5189/`를 엽니다. 탭 제목이 「jsw_keshev · ZTNA & XDR」이면 꾸밈 파일이 적용된 것입니다.
5. 보호 현황의 「학생 상태·알림 표시」에서 「PC 상태 조회」를 누릅니다(키보드는 Tab으로 이동 후 Enter). CPU·메모리·디스크 카드에 「실측」과 측정 시각이 나옵니다. 「SDP 연결」 카드는 기본 실행에서 「SDP 미연결」이며 정상입니다.
6. 「다시 조회」를 한 번 더 눌러 추이 표에 직전 대비 pp가 생기는지 봅니다.
7. 아래 「PC 관찰 근거 모음」에서 네트워크·방화벽·Windows 기록이 읽은 값과 한계와 함께 나오는지 봅니다.
8. 종료: 서버 창에서 `Ctrl+C`.

### 표시 구분

- 「실측」은 방금 이 PC에서 읽은 값, 「확인 불가」는 읽지 못한 값(이유 표시), 「조회 전」은 아직 읽지 않은 상태입니다. 설명용 예시 값은 화면에 없습니다.
- 측정 시각은 PC 조회 한 번의 시각입니다(제공 서버가 항목별 시각을 주지 않습니다).
- Windows 경고·오류 건수는 최근 24시간 System·Application 기록이며 공격·침해 탐지 결과가 아닙니다. 방화벽과 보안 설정은 읽기만 하고 바꾸지 않습니다. 관리자 권한이 필요해 읽지 못하면 `확인 불가`와 이유가 나옵니다.
- PC 조회 성공과 SDP 연결은 별개입니다. 「SDP 미연결」은 `-SdpHostConfig` 없이 켠 기본 실행의 정상 표시이며 학생이 준비할 항목이 아닙니다.

### 시연 순서

1. 핵심 3가지 안내와 표시 구분 문구를 보여 줍니다.
2. 「PC 상태 조회」로 CPU·메모리·디스크 실측과 측정 시각을 보여 줍니다(제공 조회, 학생 표시).
3. 「다시 조회」로 추이와 pp 변화를 보여 줍니다(학생 구현).
4. 근거 모음에서 네트워크·방화벽·Windows 기록과 한계를 보여 주고, 건수가 공격 판정이 아님을 말합니다(조회는 제공, 정리는 학생 구현).
5. 「SDP 미연결」이 PC 조회와 별개임을 보여 줍니다.

정리 문서: `docs/FINAL_DEMO_AND_LIMITS.md`.

### 기본 앱 포장

포장 전에 현재 프로젝트의 Git 커밋 상태를 확인하고, 앱 폴더 밖의 아직 없는 새 출력 폴더와 PNG 아이콘(256×256, 8비트 RGB/RGBA) 경로를 정합니다. 기본 명령은 이 PC에 승인된 실행 환경이 설치돼 있어야 합니다. 준비되지 않았다면 `PROVIDED_RUNTIME_NOT_INSTALLED` 안내를 담당자 준비 항목으로 남기고 `--app-only-v1`로 우회하지 않습니다.

```powershell
npm run package-app -- --source . --out "<on-client 밖의 새 출력 폴더>" --iconPath "<실제 PNG 아이콘 경로>"
```

성공하면 출력 경로, `APP_PACKAGE_MANIFEST.json`, `app.zip`, `runtime.zip`, `install-app.ps1`, `INSTALL.md`를 확인합니다. 설치와 바탕화면 바로가기는 `INSTALL.md`의 manifest 해시가 포함된 PowerShell 명령으로 진행하며, 기존 설치 폴더나 바로가기를 덮어쓰지 않고 새 대상 경로를 씁니다.

**이 PC의 사전 점검 결과(2026-10-27, 읽기 전용 확인)**

| 항목 | 결과 |
|---|---|
| 승인 실행 host·runtime(`%USERPROFILE%\.aleph-alekov-host`, `runtime`) | 없음 → `package-app`을 실행하면 `PROVIDED_RUNTIME_NOT_INSTALLED`로 멈출 것으로 예상됩니다. 담당자 준비 항목으로 기록하며 우회하지 않습니다 |
| 작업 커밋 | 이번 변경은 아직 커밋 전입니다. 포장 전에 커밋이 필요합니다(커밋하지 않은 변경이 있으면 도구가 멈춥니다) |
| 출력 폴더 | 정하지 않음(실제 경로 필요, 아직 없는 새 폴더여야 함) |
| 아이콘 | `student/appearance.json`에 `icon`이 없고 프로젝트에 PNG 아이콘이 없음. 승인받은 256×256 PNG의 실제 경로가 필요합니다 |
| 앱 이름 | `appearance.json`의 `appName` `jsw_keshev`가 포장 이름이 됩니다(`--app-name`은 생략하거나 같은 값) |
| `npm run package-app` 실행 | 하지 않음(미실행) |

포장·설치·바로가기 생성이 실제로 끝났다는 기록은 없습니다.
