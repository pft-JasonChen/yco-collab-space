# 給 RD 的討論稿 — Prototype 怎麼整回 yce-frontend

> **這是提案，不是規範。** 文中每個「我們的假設」都需要 RD 確認或推翻；每個「待討論」都還沒有答案。
> **對象：** yce-frontend RD。
> **範例功能：** `features/video-expansion`（已通過全部自動 gate）。
> **對照的 RD 模組：** `src/components/result-page/character-motion-swap` @ `yce-frontend-gm-260909`（1.34.1）。
> **相關：** [執行計畫](./2026-09-03-collab-space-execution-plan.md)、[RD 元件整合 SOP](./rd-component-intake-sop.md)

---

## 1. 這份文件要解決什麼

Collab Space 產出的是 **PM 需求 + 已組好的 UI + 可執行的行為規格**。目前 RD 拿到之後仍然要自己判斷「哪些能搬、哪些要重寫、後端要收什麼」。

這份文件提出一個分工，並附上已經做好的實物讓 RD 評估可行性。

**不解決的事（先說清楚）：**

- Prototype 永遠不接後端、不含 production 程式碼。
- 我們**不會**猜 API endpoint 或 payload 格式。
- L3 模組編排（redux／task／credits／countly）是 RD 的資產，我們不複製。

---

## 2. 我們對 RD 現況的理解 — 請先確認

我們解剖了 `character-motion-swap`，得到這個分層。**如果這個理解有錯，後面全部要重來，所以請先看這一段。**

| 層 | RD 的檔案 | 行數 | 我們的判斷 |
|---|---|---|---|
| **L1 產品組合** | `components/settings/custom-tab/index.js` | 321 | 幾乎全是 compose 既有 common 元件 |
| **L2 產品資料／政策** | `data/default-settings.js`、`model-inputs.js`、`prompt-policy.js`、`requirements.js` | 222 | 純資料與純函式，零框架依賴 |
| **L3 模組編排** | `index.js` | 876 | 35+ production infra import，RD 專屬 |
| **L4 後端契約** | `utils/task/strategies/ai-video.js` 的 `acts`／`payload`／`body` | — | 決定送什麼給 engine |

另外注意到 `components/settings/index.js` 只有 **24 行** —— 只是把兩個 tab 塞進 `V2vSettingsShell`。

> **我們的假設 A：** RD 開新 feature 時，UI 幾乎不寫新元件，主要是組合 `result-page/common/**` 既有的東西。
> **我們的假設 B：** L1 與 L2 之所以可攜，是因為它們不碰 redux／routing／countly。
> **需 RD 確認：** 這個分層在 image／photo-editing／batch family 也成立嗎？還是 video family 特有？

---

## 3. 現在交付的東西長什麼樣

`features/video-expansion/generated/` 已經照上面的分層重整過（**這是 pilot，只驗證過一個功能**）：

```text
generated/
  index.jsx                    L3  模組編排 —— RD 會整支換掉
  index.module.scss
  settings/
    index.jsx                  L1  產品組合 —— 只 compose platform/ui + data/
    index.module.scss
  data/
    defaults.js                L2  純資料（常數、enum、test id 對照）
    canvas-geometry.js         L2  純函式（frame sizing、movement axis、clamp）
    requirements.js            L2  純述詞（canGenerate、initialTrimRange…）
  contract/
    task-contract.yaml         L4  輸入輸出語意與邊界 + 待 RD 回答的問題
    integration.yaml               新模組要碰哪些 RD 共用檔案
  icons.jsx                        placeholder SVG，RD 換成自己的 icon
  extract-video-frames.js          瀏覽器端抽格，prototype-only
  feature.jsx                      相容層（app registry 用）
  generation.json                  provenance：input hash、元件 hash、素材 hash、model
```

**分層規則（由 lint 以外的人工約定維持，尚未自動化）：**

- `settings/**` 只能 import `platform/ui/**`、`../data/**`、以及當作 prop 傳進來的 `t()`。不碰 canvas、不碰 state。
- `data/**` 除了彼此之外零 import。
- `index.jsx` 承接全部 state、effect、DOM 量測。

---

## 4. 逐層怎麼搬

### L2 `data/` — 直接複製

零外部依賴。`canvas-geometry.js` 裡面是 Video Expansion 的核心運算：

```js
export function movementAxis(sourceRatio, targetRatio)      // 可拖曳的軸向
export function targetFrameSize(viewportSize, targetRatio)  // 目標框尺寸
export function positionBounds(w, h, sourceRatio, targetRatio)
export function clampPosition(position, bounds, movement)
export function mediaSizing(sourceRatio, targetRatio)
```

改 `@/` alias 都不用，複製即可。

> **需 RD 確認：** RD 習慣把這類純函式放 `data/` 還是 `utils/`？我們沿用了 `character-motion-swap` 的 `data/`。

### L1 `settings/` — 改 import alias + 接回 `t()` 與 state

現在的 import 只有三種：

```js
import Ratio, { ratioTitleTypes, ratioTypes } from '../../../../platform/ui/ratio/index.js';
import UploadMediaBlock from '../../../../platform/ui/upload-media-block/index.js';
import { buildRatioOptions, parseRatio } from '../data/canvas-geometry.js';
```

搬到 RD 要做的：

1. `platform/ui/ratio` → `@/components/common/ratio`；`platform/ui/upload-media-block` → RD 對應的 upload block。
2. `t` 現在是 prop。RD 端改成在元件內 `const { t } = getTranslationFunction()`，或維持 prop 傳入，兩種都可以。
3. callbacks（`onPick`、`onRemove`、`onTrim`、`onRatioChange`…）接到 RD 的 state 或 redux。
4. `data-testid` / `data-surface-zone` / `data-component-role` 屬性 —— 見第 8 節，需要討論要不要保留。

> **我們的假設 C：** 共用元件的 props 介面可以對得起來（例如我們的 `UploadMediaBlock` 有 `actionSlot`，RD 的 upload block 也接受注入的 action）。
> **需 RD 確認：** 這個假設對嗎？如果 props 對不上，是我們改 prototype 的 port，還是 RD 端包一層 adapter？

### L3 `index.jsx` — 當規格，重寫

這一層是「行為規格的可執行版本」。RD 應該讀它、對照 `product/prototype.contract.yaml`（7 states / 13 actions / 14 acceptance criteria），然後用 `useProcess`、`useV2vApply`、`useUpdateResultRedux` 重寫。

裡面有幾段是 **prototype-only、production 沒有對應**，已在程式碼註解標出：

- `beginProcessing()` 的 `setTimeout` 假生成流程
- `usesMockTimeline()` —— bundled sample 比選取區段短，播放時把 sample 自身時長映射到選取區段
- `extract-video-frames.js` —— 瀏覽器端抽 10 張縮圖

### L4 `contract/task-contract.yaml` — 需要 RD 回答

裡面有 4 個輸入、1 個輸出，每個都標了語意與邊界，並且**沒有任何 endpoint 或傳輸格式**。

最需要討論的是 `source-offset`：

```yaml
- id: source-offset
  kind: point2d
  unit: css-pixels
  constraints:
    originPoint: target-frame-centre
    axis: single-axis-only
```

四個 open question 在檔案裡（`TC-001` ~ `TC-004`），摘要：

| id | 問題 | owner |
|---|---|---|
| TC-001 | `source-offset` 要正規化成 -1..1 比例，還是換算成輸出像素座標？ | RD |
| TC-002 | trim 要 client 端先切好再上傳，還是傳完整檔 + trim 參數？ | RD |
| TC-003 | 輸出解析度從來源推、從目標比例推、還是使用者選？ | RD |
| TC-004 | 30 秒是產品決定還是 engine 限制？若是後者應該進 MSR model config | PM |

> **提案：** 如果 RD 那邊已經知道 engine 的實際 payload 形狀，可以放一份**去識別化**的 sample 到 `features/<f>/product/payload-samples/`，我們的 gate 會擋掉 token／credential／真實 URL／email。RD 之後拿那份 sample 直接串 API 即可，不必從 prototype 反推。

---

## 5. 註冊面 — `contract/integration.yaml`

我們從 `character-motion-swap` 反推出新模組要碰的檔案，每條都附了推導依據：

| 檔案 | 需要什麼 |
|---|---|
| `src/utils/moduleTypes.js` | moduleType、pageKey、crossPromote 對應 |
| `src/utils/task/strategies/ai-video.js` | acts／payload／body 三個 strategy |
| `src/utils/indexedDBController.js` | task polling list、redDot、task2History store |
| `src/utils/videoUtils.js` | history item 判定 |
| `src/components/result-page/index.js` | 模組掛載 |
| `src/pages/<route>/index.js` + `[locale]/` | page entry |
| `src/utils/cmsTypes.js` | 只有需要 CMS 內容時 |
| `src/i18n/json/*.json` | `origin: new` 的 key |

> **我們的假設 D：** 這份清單完整。
> **需 RD 確認：** 有沒有漏掉的？例如 GA／countly 註冊、feature flag、權限設定、`my-gallery-page` 的 red dot 顯示邏輯？
> **維護方式提案：** 由 Agent 每次從 snapshot 重新推導，而不是人工維護一份清單 —— 這樣 RD 改結構時它會自動跟上。準確度取決於 snapshot 的完整度。

---

## 6. i18n — 已經用 RD 的 key

`features/video-expansion/product/i18n.json` 用 **RD 的全域扁平 dot-notation**，每個 key 標 `origin`：

```json
"general.cancel":                { "value": "Cancel",     "origin": "rd-existing" },
"video.expansion.trim.title":    { "value": "Trim video", "origin": "new" }
```

目前 30 個 key，其中 **16 個是 `rd-existing`** —— 我們比對過 `src/i18n/json/en.json`，同名同值。RD 只需要處理 `origin: new` 的 14 個。

`platform/ui` 的共用元件**不呼叫 `t()`**，所有文案走 props（預設值是英文）。這樣元件保持純粹，RD 端接自己的 `getTranslationFunction()` 更直接。

> **需 RD 確認：** `rd-existing` 的比對是我們單方面做的，值有可能之後在 RD 端被改。要不要建立一個定期比對機制？

---

## 7. 共用元件 — 三個可攜等級

`design-library/components/<id>/component.yaml` 現在每個都標了 `rd.portability`：

| 等級 | 意思 | 目前有哪些 |
|---|---|---|
| `verbatim` | 兩邊逐字相同，`npm run validate:rd-parity` 逐 byte 比對，差一個字元就 FAIL | `button`、`ratio`、`video-trim-modal` 各一個檔案 |
| `drop-in` | 改 import alias、接回 i18n／redux 即可用 | `credit-controls`、`icon-action-buttons`、`upload-media-block`、`video-history`、`video-info-dialog`、`video-results-surface`、`video-timeline` |
| `reference` | 只是行為與視覺參考 | `result-page-shell`、`tool-page-layout` |

每份契約都有 `rd.sourcePaths` + `sourceHashes`（指向 snapshot 的實際檔案與 sha256），以及 `removedDependencies` —— **明列我們拿掉了什麼**，例如：

```yaml
removedDependencies: [redux, i18n, countly-analytics, routing, download-service, task-fetching]
```

### verbatim 是雙向的提案

目前逐字同步的三個檔案：

| Collab Space | RD |
|---|---|
| `platform/ui/button/Button.module.css` | `src/components/common/button-wrapper/button.module.css` |
| `platform/ui/ratio/ratioTypes.js` | `src/components/common/ratio/utils/ratioTypes.js` |
| `platform/ui/video-trim-modal/constants.js` | `src/components/ai-agent-page/components/video-trim-modal/constants.js` |

**為什麼提這個：** `button.module.css` 檔頭本來就寫著「The two repos hold a VERBATIM copy of this file」，但我們 2026-09-02 發現實際差 3 行 —— brand primary 的前景色被改成 `--text-strong`（深色），production 是 `--text-inverse-strong`（白色）。已經改回與 production 一致，並加了 gate 防止再漂移。

> **待討論：** 要不要把這個承諾正式化？也就是 RD 端改這三個檔案時，也同步 Collab Space。如果 RD 不想承擔這個負擔，我們就把等級降成 `drop-in`，只保留單向追蹤。
> **附帶事實：** 白字在 `--fill-brand-strong`（#03ade2）上的對比是 **2.59:1**，未達 WCAG AA 的 4.5:1。PM 已決定接受例外以維持與 production 一致（記錄在 `DESIGN-005`）。如果 production 之後改配色，prototype 會自動跟著改。

---

## 8. `data-testid` 要不要保留 — 需要 RD 決定

Prototype 的 `product/validation.yaml` 用 `data-testid` 寫了 selector 級的驗收條件（video-expansion 有 51 條，跨 3 個 viewport 自動跑）。這些屬性目前散在 L1 與 L3 的 markup 裡。

三個選項：

| 選項 | 好處 | 代價 |
|---|---|---|
| **RD 保留** | PM 的驗收條件可以直接在 production 上跑 | production markup 多一批屬性 |
| **RD 移除** | production 乾淨 | 驗收條件只在 prototype 有效 |
| **只在 L1 保留** | 折衷 | 覆蓋率下降 |

> **需 RD 確認：** RD 現在有沒有自己的 e2e selector 慣例？如果有，我們可以改成產出 RD 的慣例而不是 `data-testid`。

---

## 9. 環境相容性 — 已經對過

| 項目 | Collab Space | RD | 狀態 |
|---|---|---|---|
| React | 18.2.0 | 18.2.0 | **精確一致** |
| Styling | SCSS / CSS Modules + `sass` | SCSS Modules + `sass ^1.56.2` | 一致 |
| Design token | `platform/tokens/rd/yce-frontend-1.34.1/variables.css` | `src/styles/variables.css` | **`diff` 為空**，252 個 token |
| Bundler | Vite | Next.js 13 | 不同，但不影響逐檔搬運 |
| 語言 | JavaScript（無 TypeScript） | JavaScript | 一致 |

> **我們的承諾：** 任何升級 prototype 依賴的提案，都會先確認 RD 端的版本。相容性是刻意維持的資產，不是巧合。

---

## 10. 誠實的期待值

| 層 | RD 要做的事 | 性質 |
|---|---|---|
| L1 settings UI | 改 alias、接 `t()`、接 state | 逐檔可搬 |
| L2 data／policy | 幾乎直接複製 | 逐檔可搬 |
| L3 模組編排 | 依 `index.jsx` 當規格重寫 | **重寫**，但不需重新設計 |
| L4 task strategy | 依 `task-contract.yaml`（＋選用 payload sample）實作 | **實作**，但不需要猜 |
| 註冊面 | 依 `integration.yaml` 逐項執行 | 有清單 |
| i18n | 匯入 `origin: new` 的 14 個 key | 有 key |

**UI 程式碼估計 60–70% 可搬。這不是「複製貼上就上線」。**

我們認為追求後者是錯的目標：L3 編排是 RD 的核心資產，prototype 複製它只會背上 production 的複雜度且永遠追不上版本。

---

## 11. RD 第一天可以怎麼評估

```bash
git clone <collab-space repo>
npm install

# 看行為規格與驗收條件
cat features/video-expansion/product/prototype.contract.yaml
cat features/video-expansion/product/validation.yaml

# 看要收什麼、要改哪些檔案
cat features/video-expansion/generated/contract/task-contract.yaml
cat features/video-expansion/generated/contract/integration.yaml

# 看有哪些共用元件、每個的可攜等級與 RD 來源
npm run library:components

# 看逐字同步的檔案有沒有漂移
npm run validate:rd-parity

# 實際跑起來
npm run dev          # http://127.0.0.1:5177/features/video-expansion/
npm run storybook    # 共用元件目錄
```

`generation.json` 是這一版的收據：input hash、用了哪些素材與共用元件（含 sha256）、token 版本、生成用的 adapter 與 model。

---

## 12. 待討論清單

| # | 議題 | 需要誰 |
|---|---|---|
| 1 | §2 的四層解剖理解對不對？在其他 family 也成立嗎？ | RD |
| 2 | §4 假設 C —— 共用元件 props 對不對得上？對不上時誰改？ | RD |
| 3 | §5 註冊面清單有沒有漏（GA、feature flag、權限、gallery red dot）？ | RD |
| 4 | §7 verbatim 要不要正式化成雙向同步承諾？ | RD + PM |
| 5 | §8 `data-testid` 保留、移除、還是改成 RD 慣例？ | RD |
| 6 | `task-contract.yaml` 的 TC-001 ~ TC-003 | RD |
| 7 | TC-004 —— 30 秒是產品限制還是 engine 限制？ | PM + RD |
| 8 | RD 端有沒有已知的 engine payload 可以放進 `payload-samples/`？ | RD |
| 9 | 這個分層要不要成為之後所有 feature 的標準輸出格式？ | RD + PM |
| 10 | `data/` vs `utils/` 命名，以及其他 RD 慣例上的偏好 | RD |

---

## 13. 我們知道還不夠的地方

坦白列出來，避免討論時才發現：

- **分層只驗證過一個功能。** `video-expansion` 是 video family。image／photo-editing／batch 可能不適用。
- **`integration.yaml` 目前是人工從單一模組反推的**，還沒有自動生成器；完整驗證需要把 RD snapshot 完整納入 repo（規劃中）。
- **Surface 層沒有 production 證據。** `platform/surfaces/**` 的 pack 標著 `evidenceStatus: requires-current-production-capture`，也就是 layout 規則目前來自舊的 taxonomy，不是實際 production capture。
- **沒有 CI。** 所有 gate 目前只在本機跑。
- **prototype 不保證逐 byte 重現。** 同一份輸入重跑會得到「符合同一份 contract 與 rendered check」的結果，不是同一份檔案。要凍結某一版請用 `stage:transition`。
