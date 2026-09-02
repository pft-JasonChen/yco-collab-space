# Collab Space 執行計畫 — Production Foundation × RD Handoff

> **文件狀態：** Phase A 已實作完成；Phase B 之後待 Product Owner 排期，Designer／RD review。
> **取代：** `2026-09-02-production-surface-foundation-plan.md` 與 `2026-09-03-rd-shippable-prototype-plan.md`（已合併進本文，原檔已刪除，內容保留在 git history）。
> **展開來源：** [`production-surface-foundation-todo.md`](./production-surface-foundation-todo.md) 的 Goal 與 6 條 follow-up work。
> **研究依據：** RD snapshot `yce-frontend-gm-260909`（`youcam-enhance-frontend` 1.34.1）中 `character-motion-swap` 的完整解剖、`collab-space.map.yaml`、`platform/surfaces`、`design-library/components`、`tools/**`、`features/video-expansion` 實例。
> **相關：** [RD 元件整合 SOP](./rd-component-intake-sop.md)、[給 RD 的整合討論稿](./2026-09-03-rd-integration-discussion.md)

---

## 1. 兩個方向，一份計畫

這個 repo 有兩個彼此依賴的目標，過去分成兩份文件在講，實際上共用同一組基礎（可稽核的 RD snapshot、parity gate、元件契約），所以合併成一份排程。

| 方向 | 問題 | 目標 |
|---|---|---|
| **Inbound** | production 有什麼？我們憑什麼說「沒有現成的可用」？ | 讓 production 規則與既有 RD 共用元件成為每個 prototype 的預設起點 |
| **Outbound** | RD 拿到 prototype 之後要做什麼？ | RD 不需要重新設計 UI、不需要從 JSX 反推行為規格、不需要猜後端契約、不需要自己找出要註冊哪些檔案 |

### Outbound 目標的正確敘述

「拿 code 整進去、串後端就能上線」在有 Redux、i18n、task orchestration、CMS、IndexedDB polling 的 production app 裡**不可能達成，也不該追求**。追求它會逼 prototype 背上 production 的複雜度，違背這個 repo 存在的理由。

正確的分工是 **prototype 給規格，RD 給編排**。

---

## 2. 研究結果：RD 一個新 feature 的真實解剖

以 `character-motion-swap` 為樣本。

| 層 | 檔案 | 行數 | 內容 | 可攜性 |
|---|---|---|---|---|
| **L1 產品組合** | `components/settings/custom-tab/index.js` | 321 | 幾乎全是 compose 既有 common 元件：`DropDownSelect`、`PromptWithTag`、`Ratio`、`RefImageUploadBlock`、`WarningBanner`、`SampleImagePicker` | **高** |
| **L2 產品資料／政策** | `data/*.js` × 4 | 222 | 純資料與純函式，零框架依賴 | **高** |
| **L3 模組編排** | `index.js` | 876 | 35+ production infra import：redux actions、toast、i18n、moduleTypes、ACMS/CMS、MSR registry、user status、countly、feature-layout | **低 — RD 一定自己寫** |
| **L4 後端契約** | `utils/task/strategies/ai-video.js` 的 `acts`／`payload`／`body` | — | 決定送什麼參數給 engine | **我們沒有** |

關鍵細節：`components/settings/index.js` 只有 **24 行** —— 它只是把兩個 tab 塞進共用的 `V2vSettingsShell`。**RD 開新 feature 在 UI 上幾乎不寫新東西，全部是組合。**

### 註冊面

新模組要碰 feature 資料夾以外的 8 個共用檔案：`moduleTypes.js`（1620 行）、`cmsTypes.js`、`task/strategies/ai-video.js`、`indexedDBController.js`、`videoUtils.js`、`result-page/index.js`（785 行）、`pages/<route>/` ×2、`i18n/json/*.json`。

### 對照我們的產出

**改造前：**`features/video-expansion/generated/feature.jsx` 一支 432 行，L1／L2／L3 混在一起沒有邊界。

**改造後（2026-09-03 pilot）：**`index.jsx`（L3）／`settings/`（L1）／`data/`（L2）／`contract/`（L4）＋ `feature.jsx` 相容層。
51 條 rendered check 全數通過，行為不變。

---

## 3. 現況落差

| # | 落差 | 證據 | 狀態 |
|---|---|---|---|
| **A** | 沒有可稽核的 production 事實來源 | RD snapshot 以絕對路徑被 12 份 `component.yaml`、5 份 provenance、manifest 與多份文件引用，卻不在 repo 裡 | **部分解決**（verbatim 子集已 vendor） |
| **B** | Surface 層沒有 production 證據 | `tool-video/2026-08/provenance.json`：`evidenceStatus: requires-current-production-capture`、`capturedAt: null` | 未解決（WS-2／3／4） |
| **C** | 流程不強制「先查有沒有現成的」 | `prototype-update` 12 步中無任何查表步驟 | **已解決**（WS-5） |
| **D** | 沒有反向 drift 偵測 | `Button.module.css` 宣告 verbatim 卻差 3 行，`validate` 全綠 | **已解決**（WS-0） |
| **E** | 需要新共用元件時沒有正式 workflow | `prototype-update` 要求「propose a Platform Owner change」，但 map 裡沒有這個 workflow | 未解決（WS-1.4） |
| **F** | 輸出形狀不對齊 RD anatomy | 一支扁平大檔，RD 要先讀懂再自己拆 | **pilot 已解**（WS-9，單一樣本） |
| **G** | L4 缺席 | `AGENTS.md` 禁止編造 API（正確），副作用是從不表達「需要什麼輸入輸出邊界」 | **已解決**（WS-8.2） |
| **H** | 註冊面沒有清單 | RD 每次靠記憶或翻舊 commit | **已解決**（WS-8.3） |

### 已經到位的基礎

| | 證據 |
|---|---|
| 執行環境完全相容 | React 兩邊都是 **18.2.0**（精確一致）；styling 都是 SCSS／CSS Modules + `sass` |
| Token 層 production 相容 | `tokens.lock.json` 鎖住 RD 1.34.1 的 252 個 token |
| 共用元件雙向 hash 追溯 | 12 份契約帶 `rd.sourcePaths` + `sourceHashes` |
| verbatim 雙向可行且受保護 | 3 個檔案逐字相同，`validate:rd-parity` 守著 |

---

## 4. 決策紀錄

### 已決（2026-09-03 訪談）

| ID | 決策 | 裁示 |
|---|---|---|
| **D1** | RD snapshot 如何可稽核 | **Vendor 允許清單子集進 repo**。本輪先 vendor `verbatim` 檔案；擴及全部 ported source 與 assets 屬 WS-0 剩餘部分 |
| **D2** | Button 2.59:1 對比 | **接受例外，正式記錄**。保持與 production 逐字一致，`DESIGN-005` 轉 accepted，parity gate 防止再漂移 |
| **S1** | task-contract 細節程度 | **不含 API**。只描述輸入輸出語意與邊界。另**選用**附一份已知的 engine payload sample，RD 拿了就能串 API |
| **S4** | verbatim 投資範圍 | **CSS/token 層 + 無框架依賴的純 JS**（constants、純函式、資料表）。React 元件實作一律 `ported` |
| **S5** | 兩條線的排程 | **合併成一份計畫**（本文） |
| — | i18n key 命名 | **全部沿用 RD 全域扁平 dot-notation** |
| — | `platform/ui` 文案 | **全部改成 props**，預設值保留英文；共用元件不呼叫 `t()` |
| — | payload sample 位置 | **`features/<f>/product/payload-samples/`**，PM 擁有、屬 source of truth |
| — | payload sample 安全 | 強制去識別化掃描，掃到即 FAIL；永遠排除在 public build 之外 |
| — | `.claude/launch.json` | **納入版控**，讓任何人能重現瀏覽器驗證 |
| — | video-expansion 階段 | 先不推，等 Phase A 落定後一次推 |
| **S3** | `integration.yaml` 由誰維護 | **Agent 每次從 snapshot 重新生成**，不由人工維護清單；準確度隨 snapshot 完整度提升 |
| — | 分層 pilot | **先拆 video-expansion 當 pilot 並標明是單一樣本**，讓 RD 有實物可評估 |
| — | RD 討論文件 | 中文提案討論稿，明確標出「我們的假設」與「需 RD 確認」|

### 待決

| ID | 決策 | 卡住 |
|---|---|---|
| **D3** | production 截圖能否進 private repo（可以／只存幾何數值／存 repo 外） | WS-6 |
| **D4** | `platform-component-change` 核准者（Platform Owner 單簽／+ RD 雙簽） | WS-1.4 |
| **D5** | CI 平台與觸發條件 | WS-7.4 |
| **S2** | L3 `index.jsx` 是否模仿 RD hooks 結構 | WS-9 |

---

## 5. 工作分解

### WS-0 — RD 證據基礎與 parity gate ✅ 部分完成

| # | 項目 | 狀態 |
|---|---|---|
| 0.1 | 決定 snapshot 存放方式 | ✅ D1：vendor 允許清單子集 |
| 0.2 | `migration/rd-snapshot-manifest.json` 完整帳本 | 🔸 已加 `vendoredBaseline`；擴及全部 ported source 與 ~40 assets 待辦 |
| 0.3 | `tools/migration/verify-snapshot.mjs` | ⬜ |
| 0.4 | schema 加 `rd.portability` 與 `rd.verbatimFiles` | ✅ |
| 0.5 | `tools/design-library/validate-rd-parity.mjs` | ✅ |
| 0.6 | 串進 `npm run validate` | ✅ |
| 0.7 | 12 個元件標注 portability | ✅ 3 verbatim／7 drop-in／2 reference |

> **驗收已通過：** 把 `Button.module.css` 的 brand 前景色改回舊值 → `[rd-parity] FAIL`；還原 → PASS。

### WS-1 — RD 元件整合 SOP 與工具

| # | 項目 | 狀態 |
|---|---|---|
| 1.1 | 六步 SOP + 三堆分類 + 停止條件 + 反面教材 | ✅ [`rd-component-intake-sop.md`](./rd-component-intake-sop.md) |
| 1.2 | `npm run rd:inspect -- <rd-path>` | ⬜ |
| 1.3 | `npm run component:scaffold -- <id>` | ⬜ |
| 1.4 | `platform-component-change` workflow（補落差 E） | ⬜ 需 D4 |

### WS-2 — Product Owner 訪談與 YCO site map ⬜

`src/pages/**` 有 206 個 `index.js`、`result-page/` 有 48 個 family。先盤 Result Page families 與 global shell；marketing／account／legal 標為 out of scope。

2.1 抽路由清單當底稿 · 2.2 訪談 PO（navigation／naming／responsive／route ownership／surface boundaries／known exceptions）· 2.3 `docs/surfaces/yco-site-map.md` · 2.4 `platform/surfaces/site-map.yaml` · 2.5 標注 global shell、tool-family navigation、shared modal／history flow 邊界

### WS-3 — RD 組合鏈盤點 ⬜

3.1 定義 `surface-composition.schema.json` · 3.2 盤點 page entry → surface → layout → shared components → assets → feature adapter，寫入各 pack 的 `composition.yaml` · 3.3 以已完成的 result-action chain（`result-video` / `next-action` → `icon-action-buttons`）當範本

### WS-4 — Surface contract 補證據 ⬜

4.1 建／補 6 個 surface contract（Tool Page、Video Results、History、Detail Modal、uploaded media、action-footer）· 4.2 `evidenceStatus` 推進到有實際 capture · 4.3 發新版 pack，舊 feature 仍 pin 舊版 · 4.4 回歸驗證

> **成效指標：** `video-expansion` 的 `deviations` 目前 **11 條**，目標降到個位數。

### WS-5 — Intake 強制元件查表 ✅ 完成

| # | 項目 | 狀態 |
|---|---|---|
| 5.1 | `npm run library:components` | ✅ 列出 12 個元件的用途、import、storyId、states、portability |
| 5.2 | `surface-intent.schema.json` 加 `componentReuse[]` | ✅ `existing-component`／`new-shared`／`feature-only` + evidence |
| 5.3 | `prototype-intake` workflow 新增查表與 reuse evidence 步驟 | ✅ |
| 5.4 | `validate:inputs` 檢查每個 role 都有 resolution 且元件存在 | ✅ |
| 5.5 | `prototype-update` workflow 新增「生成前先讀 componentReuse」 | ✅ |
| 5.6 | 兩個 feature 回填 componentReuse | ✅ video-expansion 15 個 role、readiness 3 個 |

### WS-6 — 視覺與幾何 parity fixtures ⬜ 需 D3

6.1 決定 capture 方式 · 6.2 先做**幾何**斷言（間距、尺寸、斷點、容器寬度）· 6.3 建 fixture · 6.4 串進 `test:rendered`

> 幾何先於像素：像素比對要求 production 環境、字型與時間點一致，成本高且易碎。

### WS-7 — 流程收尾 ✅ 部分完成

| # | 項目 | 狀態 |
|---|---|---|
| 7.1 | `generation.json` 記錄實際 model id | ✅ `--model` 參數，現為 `claude-opus-5` |
| 7.2 | COLLABORATION.md 寫明可重現性保證範圍 | ✅ 新增「交給 RD 的東西保證到什麼程度」 |
| 7.3 | 寫明 `validation.yaml` 的雙重身分 | ✅ |
| 7.4 | 建立 CI | ⬜ 需 D5 |
| 7.5 | video-expansion stage transition | ⬜ 依裁示延後 |
| 7.6 | `.claude/launch.json` 納入版控 | ✅ |

### WS-8 — 交付契約 ✅ 部分完成

| # | 項目 | 狀態 |
|---|---|---|
| 8.1 | i18n：`product/i18n.json` + `platform/runtime/i18n.js` shim | ✅ |
| 8.1a | video-expansion 硬字串抽 key | ✅ 30 個 key，其中 **16 個 `rd-existing`**（RD 已有同名同值）、14 個 `new` |
| 8.1b | `platform/ui` 硬字串改 props | ✅ 7 個元件、含 4 個獨立 export 的 sub-component |
| 8.1c | i18n 驗證：flat key 格式、origin、未宣告 key、死 key、重複 placeholder | ✅ 串進 `validate:inputs` |
| 8.2 | `contract/task-contract.yaml` schema 與產出 | ✅ 4 inputs／1 output／4 open questions；port 必須對應 contract 的 state 或 action |
| 8.3 | `contract/integration.yaml` schema 與產出 | ✅ 8 條註冊面（附推導依據）＋ 5 層 portedLayers；完整路徑驗證待 snapshot vendor |
| 8.4 | payload sample：位置、README、去識別化掃描、public-build 排除 | ✅ |
| 8.5 | intake workflow 新增「輸入／輸出／邊界」與 payload 訪談題組 | ✅ |

### WS-9 — 輸出結構對齊 RD anatomy ✅ pilot 完成

**2026-09-03 決策：先拆 video-expansion 當 pilot**，讓 RD 有實物可評估。仍維持原判斷 ——
只憑 `character-motion-swap` 一個樣本不足以定死通則，所以 WS-9.1（再盤 2 個模組）仍在 Phase C，
盤完後可能調整結構。

實際結構：

```text
generated/
  index.jsx              # L3 模組編排（RD 會整支換掉）
  settings/index.jsx     # L1 產品組合 —— 只 compose platform/ui 與 data/
  data/*.js              # L2 純資料與純函式，零 import
  contract/*.yaml        # L4 task contract + integration 清單
  feature.jsx            # 相容層，app registry 不需改
```

| # | 項目 | 狀態 |
|---|---|---|
| 9.1 | 確認 anatomy 通則（再盤 2 個模組） | ⬜ Phase C |
| 9.2 | 定義結構與各層 import 規則 | ✅ settings 只能 import platform/ui + data；data 零外部 import |
| 9.3 | `feature.jsx` 相容層 | ✅ app registry 不需改 |
| 9.4 | 重整 video-expansion 並通過全部 gate | ✅ 51 rendered checks 全過 |
| 9.5 | `validate:handoff` gate（把 import 規則自動化） | ⬜ Phase C |
| 9.6 | `rd-handoff` 階段新增 `handoff-ready` 條件 | ⬜ Phase C |

---

## 6. 分期

```text
Phase A  止血 ─────────────────────────────────── ✅ 已完成
  WS-0.4 → 0.7   parity gate（含 3 個 verbatim 檔案與 vendored baseline）
  WS-1.1         整合 SOP
  WS-5           intake 元件查表（全部 6 項）
  WS-7.1 .2 .3 .6
  WS-8.1 8.4 8.5 i18n + payload sample
  ↓
Phase B  建立證據基礎 ──────────────── 需要 PO 與 RD 的時間
  WS-0.2 0.3     完整 manifest + verify-snapshot
  WS-2           PO 訪談 + site map
  WS-3           組合鏈盤點
  WS-8.2 8.3     task-contract + integration（需 S3）
  ↓
Phase C  兌現 exit condition ──────────────────────────────
  WS-4           surface contract 補證據
  WS-1.2 1.3 1.4 整合工具 + platform-component-change（需 D4）
  WS-6           幾何 parity fixtures（需 D3）
  WS-9.1 9.5 9.6 anatomy 通則 + validate:handoff（需 S2）
  ↓
Phase D  治理 ─────────────────────────────────────────────
  WS-7.4         CI（需 D5）· CODEOWNERS 評估
```

| Phase | 完成判準 |
|---|---|
| **A** ✅ | 改動任一 verbatim 檔案會被 `validate` 擋下；新 feature intake 必須為每個 component role 記錄 reuse evidence；generated code 無硬字串 |
| **B** | 任何人 clone repo 後可執行 snapshot 稽核；site map 可回答「這個新功能屬於哪個 Result Page family」 |
| **C** | **原 TODO 的 exit condition：** 下一個 feature 能在產生任何 feature-specific UI 之前，從 site map 與 surface catalog 解析出頁面與 surface 組成；且 RD 能依交付包實作而不需反推 |
| **D** | 所有 gate 在 PR 上自動執行 |

---

## 7. 交付後 RD 實際要做什麼

Phase C 完成後：

| 層 | RD 要做的事 | 性質 |
|---|---|---|
| L1 settings UI | 改 import alias、`t()` 接回、redux state 接回 | 逐檔可搬 |
| L2 data／policy | 幾乎直接複製 | 逐檔可搬 |
| L3 模組編排 | 依 `index.jsx` 當行為規格，用 RD hooks 重寫 | 重寫，但不需重新設計 |
| L4 task strategy | 依 `task-contract.yaml`（＋選用的 payload sample）實作 acts／payload／body | 實作，但不需要猜 |
| 註冊面 | 依 `integration.yaml` 逐項執行 | 有清單 |
| i18n | 匯入 `i18n.json` 中 `origin: new` 的子集，交 localization | 有 key |

**誠實的期待值：** UI 程式碼估計 60–70% 可搬。L3 與 L4 是 RD 的工作但有完整規格。

---

## 8. Phase A 實際交付清單

| 產出 | 路徑 |
|---|---|
| Parity gate | `tools/design-library/rd-parity.mjs`、`validate-rd-parity.mjs`、`npm run validate:rd-parity` |
| Vendored RD baseline | `platform/rd-baseline/yce-frontend-gm-260909/**`（3 檔，manifest 已登錄） |
| Verbatim 還原 | `platform/ui/video-trim-modal/constants.js`、`platform/ui/ratio/ratioTypes.js`（新拆出） |
| Contract schema | `rd.portability`、`rd.verbatimFiles`；12 份契約已標注 |
| 元件查表 | `tools/design-library/list-components.mjs`、`npm run library:components` |
| Reuse 契約 | `surface-intent.schema.json` 的 `componentReuse[]`；兩個 feature 已回填 |
| i18n | `platform/runtime/i18n.js`、`features/video-expansion/product/i18n.json`（30 key） |
| 元件文案 props | 7 個 `platform/ui` 元件 + 4 個 sub-component |
| Payload sample | `features/<f>/product/payload-samples/` + README + 去識別化掃描 + public-build 排除 |
| 交付驗證 | `tools/prototype-cli/handoff-policy.mjs`，串進 `validate:inputs` |
| Workflow | `prototype-intake` 13 步、`prototype-update` 16 步 |
| 分層 pilot | `generated/` 拆成 `index.jsx`（L3）／`settings/`（L1）／`data/`（L2）／`contract/`（L4）＋ `feature.jsx` 相容層 |
| 交付契約 | `task-contract.schema.json`、`integration.schema.json`；video-expansion 兩份已產出並串進 `validate:inputs` |
| 文件 | 本文、`2026-09-03-rd-integration-discussion.md`、`rd-component-intake-sop.md`、`COLLABORATION.md`、`AGENTS.md` |

全部 gate 通過：`validate`（11 項）、`build`、`test:rendered`（video-expansion 51 checks × 3 viewports、readiness 12 checks × 3）、`test:storybook`（25 stories + axe）。

---

## 9. 決策判斷依據

- **不追求「複製貼上就上線」。** RD 的 L3 編排（876 行、35+ production infra 依賴）是 RD 的核心資產，prototype 複製它只會背上 production 複雜度且永遠追不上版本。
- **L4 是最大的資訊遺失點，補它不違反 mock-only。** 描述「輸入的語意與邊界」是產品需求，不是後端實作。選用的 payload sample 是 PM 從外部取得的既有事實，與 mock 資料同性質 —— 所以放 `product/`，並強制去識別化掃描。
- **WS-0 必須先於 WS-2／3／4／6。** 那四項都要讀 snapshot；snapshot 不可稽核時，"repository audit confirms that no existing production component covers the need" 這句話無法被任何人執行或驗證。
- **WS-5 插到最前面，因為它不依賴證據基礎。** 「先查有沒有現成的」是流程問題不是資料問題。反例就在手上：`VideoHistory` 與 `VideoInfoDialog` 曾各自刻了一排一模一樣的 like／dislike／download。
- **parity gate 先於 parity fixtures。** 逐字比對 CSS 的成本接近零、訊號極強；視覺比對成本高、易碎。
- **verbatim 必須 vendor baseline。** 只靠外部 snapshot 路徑，別人 clone 之後 gate 形同虛設。
- **共用元件不呼叫 `t()`。** 文案走 props 讓元件保持純粹，Storybook 不需要 i18n context，RD 端接自己的 `t()` 反而更直接。
- **i18n 沿用 RD 扁平命名。** 實測 30 個 key 裡有 16 個 RD 已經有同名同值 —— 自創 feature-scoped 命名等於放棄這一半的既有資產。
- **WS-9 不搶跑。** 一個樣本不足以定死 `generated/` 結構。
- **執行環境相容是既有資產，要守住。** React 18.2.0 精確一致、SCSS Modules 一致，讓逐檔搬運在技術上可行。任何升級 prototype 依賴的提案都要先確認 RD 端版本。
