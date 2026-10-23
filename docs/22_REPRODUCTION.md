# 22단계 재현 기록 (새 환경 실행)

이 문서는 **같은 최종 커밋을 새 빈 폴더에서 실행한 결과**를 학생이 직접 남기는 재현 기록입니다. 서버 AI 원문 검토와 별개로, 이 기록은 학생 진술이며 서버가 새 환경에서 실행했다는 뜻이 아닙니다. 항목은 `docs/FINAL_PRODUCT_GUIDE.md` 8장과 `docs/CURRICULUM.json` 22단계 checks(clean_environment / cumulative_behavior / data_preservation / release_reproduction)에 대응합니다.

## 0. 식별 정보 (현재 제출 커밋)

| 항목 | 값 | 근거 |
|---|---|---|
| 저장소 URL | (본인 GitHub 저장소 주소. 원문 제출 시 사용) | 과제 화면에 입력. 이 문서에는 URL을 쓰지 않고 제출 시 직접 입력 |
| 브랜치 | `main` | `git branch --show-current` 출력 |
| 수정본 최종 제출 커밋(40자리) | `<수정본을 커밋한 뒤 기록>` | `git rev-parse HEAD` 출력 |
| 수정 시작점 커밋(40자리) | `dcff5eb29f2b209f221968e110c5f13bc76aa42c` | 수정 전 `git rev-parse HEAD` |
| 커밋 메시지 | 최종 제출 시 기록 | `git log -1` 출력 |
| 커밋 작성자 | 최종 제출 시 기록 | `git log -1` 출력 |
| 커밋 시각 | (해당 커밋 시각) | `git log -1` 출력 |
| 시작 틀 버전 | `alekov-client-starter@0.2.11` | `package.json` |
| Node.js 기준 버전 | `24.19.0` | `package.json` `engines.node` |
| 제출 대상 파일 수 | 미확인 | 최종 제출 커밋에서 `git ls-tree -r --name-only <제출 커밋>` 실행 |
| 작업 폴더(원본) | `C:/Users/User/Documents/sktassign/on-client` | 사용자 확인 |
| 작업 폴더 미커밋 변경 | 수정 중(최종 제출 전 커밋 필요) | `git status --short` |
| 이전 커밋(역사 기록) | `e1545e18eedd4415a155abfd061c0acfceb7dc45` (이전 재현 기록) | 아래 7장 |

**주의:** 아래 절차는 최종 수정 커밋을 대상으로 합니다. 수정본을 커밋한 뒤 표의 40자리 해시와 checkout 자리표시자를 그 커밋으로 갱신해야 합니다. 실행하지 않은 재현 관찰은 미확인으로 둡니다. `e1545e18eedd…`는 역사 자료입니다.

## 1. 새 환경 준비

| 확인 항목 | 상태 | 비고 |
|---|---|---|
| 원본 작업 폴더 보존 | 확인됨 | 작업 폴더는 유지하며 최종 상태는 커밋 후 직접 확인 |
| 새 빈 폴더 생성 | 미확인 | 이번 기록에서는 직접 실행하지 않았음 |
| 새 폴더에 제출 커밋 받기(clone·checkout) | 미확인 | 절차는 아래 2장. 실행 결과는 사용자 확인 후 3장에 채움 |
| 런타임(Node.js 24.19.0) 확인 | 미확인 | `node --version` 실제 실행 필요 |
| 외부 npm 의존성 설치 | 불필요 | `package.json`에 dependencies 없음. `npm install` 필요 없음. `package-lock.json`은 구성 기록용 |

## 2. 재현 절차 (사용자가 직접 수행, 제출 커밋 대상)

아래 명령을 **본인 PC의 PowerShell**에서 실행합니다. 이 문서를 작성한 AI는 명령을 실행하지 않았습니다.

1. 새 빈 폴더 준비(예: `C:\Users\<사용자>\Documents\repro22\on-client`)
2. GitHub에 올라가 있으면:

        git clone <본인 저장소 URL> on-client
        cd on-client
        git fetch --all
        git checkout <최종 제출 커밋 40자리>
        git rev-parse HEAD

   기대 결과: `git rev-parse HEAD` = 위 표의 최종 제출 커밋 40자리
3. 로컬 원본 폴더에서 받으려면:

        git clone "C:\Users\User\Documents\sktassign\on-client" C:\Users\User\Documents\repro22\on-client
        cd C:\Users\User\Documents\repro22\on-client
        git checkout <최종 제출 커밋 40자리>
        git rev-parse HEAD

4. 런타임 확인: `node --version` → `v24.19.0` 기대
5. 실행: `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1`
6. 브라우저: `http://127.0.0.1:5189/`
7. 종료: 같은 창에서 `Ctrl+C`
8. 재실행: 5번 명령 다시 실행

주의: 기존 폴더의 인증·설정 파일(`.env`, 개인 설정 JSON, 인증서)은 새 폴더에 **복사하지 않습니다**. 필요하면 담당자가 안내한 경로를 `-NativeHostConfig`/`-SdpHostConfig`로 새로 지정합니다.

## 3. 관찰 결과 (최종 제출 커밋 대상, 사용자가 직접 채움)

아래 표의 값은 사용자가 실제 화면/콘솔에서 확인한 결과로 채웁니다. 지금은 **미확인**입니다.

| 확인 항목 | 결과 | 관찰 시각 | 근거(화면 문구·로그·스크린샷 경로) |
|---|---|---|---|
| `node --version` = v24.19.0 | 미확인 | — | — |
| 실행 도구 2줄 안내 표시 | 미확인 | — | — |
| 브라우저 mode-badge `disconnected` 또는 `demo` | 미확인 | — | — |
| 보호 현황 탭 로드 | 미확인 | — | — |
| 업무 앱 탭 판정 4종 구분 | 미확인 | — | — |
| 보안 기록 탭 목록·필터·상세 | 미확인 | — | — |
| AI 연결 칸 미연결 안내 | 미확인 | — | — |
| AI 연결 점검 결과(test/실패) | 미확인 | — | — |
| AI 사건 설명 요청 | 미확인 | — | — |
| 패키지 취약점 조회 | 미확인 | — | — |
| 종료 후 재실행 시 상태 일관 | 미확인 | — | — |
| 원본 폴더에 새 변경 없음 | 미확인 | — | `git status --short` |

## 4. 모의(demo)·실연결·미확인 구분

- **demo 성공:** 예제 데이터로 화면이 그려진 경우. 실제 연결 성공 아님.
- **실연결 성공:** 실제 SDP 엔진/AI 게이트 응답. 기본 실행에서는 나오지 않음.
- **미확인:** 위 3장 표의 항목을 실제로 확인하지 못한 상태.

이 기록에서는 아직 **실연결 성공으로 기록할 항목이 없습니다.** 19단계 실집행(실제 원천 조치 연결)은 `docs/FINAL_PRODUCT_GUIDE.md` 5·9장 기준 미완료입니다.

## 5. 미확인 사항과 이유

| 미확인 항목 | 이유 | 다음에 확인할 사람 |
|---|---|---|
| 새 폴더 clone·checkout | 이번에 직접 실행하지 않음 | 학생 |
| Node.js 24.19.0 실측 | 이번에 직접 실행하지 않음 | 학생 |
| 실행 도구 성공 신호 | 이번에 직접 실행하지 않음 | 학생 |
| 세 탭 화면 렌더 | 이번에 직접 실행하지 않음 | 학생 |
| AI 연결·AI 점검 | 운영자 계정·앱 권한 준비 전 | 학생(준비 후) + 담당자 |
| 실제 SDP·XDR 연결 | `-SdpHostConfig` 미지정 | 담당자 준비 후 학생 |
| 19단계 실제 원천 집행 | 원천 집행 연결 미완료 | 담당자(제공 범위) |
| 21·22 공식 자동 확인 접수 | 운영 접수·서명 미연결 | 담당자 |

## 6. 결과 요약

- 원본 작업 폴더는 기준 커밋 `dcff5eb29f2b209f221968e110c5f13bc76aa42c`에서 수정 중입니다. 최종 제출 커밋과 작업 트리 상태는 학생이 커밋 후 기록합니다.
- 새 폴더에서의 실제 실행·화면 확인은 이 문서 작성 시점 기준 **미확인**입니다. `docs/22_STAGE_RESULT.md`의 항목도 동일하게 미확인/미구현으로 남겨 두었습니다.
- 16단계 학생 상태·알림 표시(`renderStatus`)는 코드 상 구현되어 `{devices, sessions, notifications, diagnostics, mode}`를 받아 DOM을 반환합니다. `docs/22_STAGE_RESULT.md`와 `docs/VERSION_SUPPORT.md`에 명시했습니다.
- 22단계 통과 판정은 서버 AI의 **원문 검토 기준 수료**이며, 실제 운영 인증이나 v1.0 자동 인증이 아닙니다. 서로 다른 커밋의 결과를 합쳐 최종 성공으로 표시하지 않습니다.

## 7. 이전 단계 기록(역사 자료)

아래는 이전 단계 커밋 `e1545e18eedd4415a155abfd061c0acfceb7dc45`(이전 재현 기록) 시점의 이력입니다. 이번 제출 커밋의 재현 결과가 아니며, 기록으로만 보존합니다.

- 이전 재현 기록은 `renderStatus` 미구현 상태를 전제로 작성되었습니다.
- 현재 수정본에서는 `renderStatus`가 구현되어 전달 구조(`{devices, sessions, notifications, diagnostics, mode}`)를 직접 읽습니다.
- 이전 커밋 시점의 기록은 이 문서의 0장·2장에 남아 있던 이전 내용을 이 7장으로 옮겨 보존합니다.
