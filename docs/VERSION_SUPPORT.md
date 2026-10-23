# 버전·지원 범위 기록 (케셰브 on-client, 현재 제출 커밋 ff7b76c7f196…)

이 문서는 22단계 "버전과 지원 범위" 요구사항에 따라 현재 제출 커밋 `ff7b76c7f19664b6aa4403e0b0be2af3822f92a7`의 버전·지원 범위·누락·미해결 사항을 기록합니다. 재현 관찰은 과거 커밋 `005f53932823d9fa11e7415b96e4a7c9324fcc2d`의 것이며, 현재 제출 커밋에서 다시 실행하지 않았습니다. "확인 불가"는 정상·안전이 아닙니다.

## 1. 버전 (현재 제출본 `ff7b76c…`)

| 항목 | 값 | 근거 |
|---|---|---|
| 패키지 이름 | `alekov-client-starter` | `package.json` |
| 패키지 버전 | `0.2.11` | `package.json` |
| Node.js(engines) | `24.19.0` | `package.json` `engines.node` |
| 외부 npm 의존성 | 없음 | `package.json` (dependencies 없음) |
| 의존성 잠금 파일 | 포함(`package-lock.json`, lockfileVersion 3, 외부 의존성 0) | `package-lock.json` |
| 기본 실행 스크립트 | `npm start` / `npm run demo` / `npm run check` | `package.json` `scripts` |
| 시작 틀 매니페스트 | version 1, `updatedAt 2026-10-18T15:55:37.783Z` | `.on-starter-manifest.json` |
| 제출 커밋(40자리) | `ff7b76c7f19664b6aa4403e0b0be2af3822f92a7` | `git rev-parse HEAD` |
| 커밋 메시지·브랜치 | `step-22: record reproduction results` / `main` | `git log`, `git branch` |
| 커밋 작성자 | `dyj02056` | `git log -1` |
| 커밋 시각 | `2026-10-23 16:36:44 +09:00` | `git log -1` |
| 커밋 파일 수 | 63 | `git ls-tree -r --name-only ff7b76c7f19664b6aa4403e0b0be2af3822f92a7` |

## 2. 지원 범위(기본 실행)

| 범위 | 내용 |
|---|---|
| 실행 모드 | 기본 `disconnected`(기존 SDP 엔진 미연결). `demo`는 예제 데이터 |
| 바인딩 | `127.0.0.1` loopback 전용 |
| 기본 포트 | `5189` (`ON_PORT`로 변경 가능) |
| API | `/api/me`, `/api/apps`, `/api/access`, `/api/events`, `/api/devices`, `/api/sessions`, `/api/ai/explain`, `/api/ai/check`, `/api/ai/connect/*`, `/api/native-login/*`, `/api/diagnostics`, `/api/vulnerabilities`, `/api/actions/*` |
| 화면 | 보호 현황·업무 앱·보안 기록 3개 탭. 제공 UI + 학생 표시 분리 |
| 보안 기록 상한 | 최근 40건(사용자 본인 범위) |
| 기기 상한 | 100건 |
| 세션 | 현재 검증된 연결 1건 |
| 조치(기본) | **미지원**. `src/actions/store.mjs`·`src/actions/service.mjs`는 명시 설정이 없으면 파일을 열지 않고 `ACTION_UNSUPPORTED` |
| 조치(옵션) | 담당자가 기존 애플리케이션 SQLite 경로와 정책을 CLI로 명시한 경우에만 prepare/execute/readResult 동작 |

## 3. 지원 범위(옵션·담당자 설정 시)

| 범위 | 활성화 조건 | 비고 |
|---|---|---|
| SDP 접근 제어·XDR | `-SdpHostConfig "<절대경로>"` | 프로젝트·Git·제출물 밖 설정 |
| ALEPH 계정 연결(native) | `-NativeHostConfig "<절대경로>"` | Windows 자격 저장소 |
| AI 게이트(CLCO) | 담당자 게이트 반영·앱 권한 발급 | 기본 실행에서는 미연결 |
| 옵션 조치 저장소 | `--alekov-actions` **및** `--alekov-actions-config "<절대경로 JSON>"` 를 **둘 다** 지정 | `alekov_action_intents/state/audit` 영속. 학생이 임의 설정하지 않음 |

**옵션 조치 활성화 조건 (src/server.mjs CLI 원문 기준):**
- `--alekov-actions` 와 `--alekov-actions-config <절대경로>` 를 **함께** 지정해야 한다. 둘 중 하나만 있으면 `ACTION_STARTUP_INCOMPLETE`로 시작을 거절한다.
- 옵션 조치를 켤 때 `-Demo`(예제)와 함께 쓰면 `ACTION_STARTUP_CONFLICT`로 거절한다.
- 옵션 조치를 켤 때 `--native-host-config` 와 `--sdp-host-config` 가 **둘 다** 지정되어 있지 않으면 `ACTION_STARTUP_CONFLICT`로 거절한다.
- 위 조건을 모두 만족하지 않으면 서버는 시작하지 않는다. 기본 실행(플래그 없음)은 `ACTION_UNSUPPORTED`이며 DB 파일을 열지 않는다.

## 4. 누락·미해결 사항 (현재 코드 기준)

| 항목 | 상태 | 근거 |
|---|---|---|
| 19단계 실제 원천 조치 집행 | 미완료(기본 미지원) | `docs/FINAL_PRODUCT_GUIDE.md` 5·9장, `src/actions/README.md`, `src/actions/store.mjs` 기본 `ACTION_UNSUPPORTED` |
| 21·22 공식 자동 확인 접수·서명 | 미연결 | `docs/FINAL_PRODUCT_GUIDE.md` 9장 |
| 학생 계정·AI 앱 권한 발급, 게이트 반영 | 운영자 준비 필요 | `docs/FINAL_PRODUCT_GUIDE.md` 9장 |
| 18단계 SDP 사건·AI 계정 대응 등록 | 운영자 서명 방식으로 로컬 확인, 운영 원천 미확보 | `docs/FINAL_PRODUCT_GUIDE.md` 9장 |
| 최종 집계 시각·집계 후 인정 기간·MCP 가산 | 정해지지 않음 | `docs/IMPLEMENTATION_CONTRACT.md`, `docs/FINAL_PRODUCT_GUIDE.md` |
| 실제 SDP·XDR·AI 게이트 실행 검증 | 미확인 | `docs/STUDENT_RUNBOOK.md` 8장 "미확인" 행 |
| Firefox·Safari 실기기 실행 | 미확인 | `docs/STUDENT_RUNBOOK.md` 2장 |

## 5. 22단계 통과의 의미

- 22단계 통과는 **원문 검토 기준의 수료**입니다. 실제 운영 인증이나 v1.0 자동 인증이 아닙니다.
- 재현 기록은 **학생 진술**이며, 서버가 새 환경에서 실행했다는 뜻이 아닙니다.
- 서로 다른 커밋의 통과 결과를 합쳐 최종 버전 전체 성공으로 표시하지 않습니다.
- v1.0 표시 조건(참고): 19단계 실제 실행 연결 + 22단계 같은 최종 소스 누적 재현 + 공식 접수 연결. 이 조건이 모두 충족되기 전에는 v1.0으로 표시하지 않습니다.

## 6. 재현 대상과 현재 제출본의 관계

| 항목 | 기록 |
|---|---|
| 과거 재현 커밋 | `005f53932823d9fa11e7415b96e4a7c9324fcc2d` |
| 현재 제출 커밋 | `ff7b76c7f19664b6aa4403e0b0be2af3822f92a7` |
| 두 커밋 사이 변경 | 재현·단계 결과·데이터 보존·버전 문서 4개. 앱 코드와 패키지 파일 변경 없음(`git diff --name-status 005f53932823d9fa11e7415b96e4a7c9324fcc2d..ff7b76c7f19664b6aa4403e0b0be2af3822f92a7`) |
| 현재 제출 커밋 재실행 | 미실시. 과거 사용자 진술·백업 복원 관찰을 현재 커밋의 새 실행 결과로 간주하지 않음 |

## 7. 이 문서의 상태

| 항목 | 상태 |
|---|---|
| 버전·범위 표기 | 현재 제출 커밋 `ff7b76c7f19664b6aa4403e0b0be2af3822f92a7` 기준 |
| 과거 새 폴더 앱·화면 실행 | 학생이 `005f539…`에서 정상 작동했다고 진술; 로그·캡처 미제공 |
| 현재 제출 커밋 실행 | 미확인(`005f539…` 이후 현재까지 앱 코드 변경은 없음) |
| 13~21단계 표 | 코드 검토 기준 커밋과 과거 재현 관찰을 분리해 `docs/22_STAGE_RESULT.md`에 기록 |
