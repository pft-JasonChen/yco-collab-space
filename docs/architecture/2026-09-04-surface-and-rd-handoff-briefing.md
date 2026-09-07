# Surface 怎麼定義、RD 怎麼拿 code

> **讀者：** 團隊會議（PM／Designer／RD／主管）。
> **性質：** 前兩份文件的續篇 —— [架構與共編模式](./2026-09-02-collab-space-overview.md) 講「誰改什麼」，
> [優化評估](./2026-09-02-collab-space-optimization.md) 講「缺什麼」。這份只講兩件它們沒展開的事。
> **RD：** 第 2、3 節請直接在 PR 上 comment，不需要另開文件。

---

## 1. Surface 是什麼，怎麼定義出來的

**一句話：surface 是「在多個功能頁重複出現的版面區域」——不是一個頁面，也不是一個元件。**

- 元件（`platform/ui`）是「一顆按鈕」
- surface 是「結果頁右側那塊放參數的欄位，14 個功能都長一樣」
- 頁面是「video-expansion 這一頁」

### 一塊區域要通過三問才算 surface

1. **它在 RD 多個 family 重複出現嗎？** 用機械統計，不是印象。`feature-layout` 31/34 個 family 都用，這是真的共用；`features-panel` 只有 1/34，那不是。
2. **它有結構意義，還是只有視覺相似？** 有 zone、有元件角色（slot）、有 responsive 優先序，才是 surface。
3. **改它會影響多個功能嗎？** 會，才需要鎖；不會，就讓 feature 自己決定。

### 兩種粒度

| 粒度 | 是什麼 | 例子 |
|---|---|---|
| **pattern**（`kind: module`） | 可重用的區塊 | `video-results`、`history-list`、`detail-modal`、`action-footer` |
| **Surface Pack**（`kind: surface`） | 一個完整頁型，由多個 pattern 組成 | `tool-video` ＝ tool-page ＋ video-results ＋ history-list ＋ … |

Feature 在 `product/surface-intent.yaml` 宣告用哪個 pack、`reuse`／`hybrid`／`novel`，並 **pin 版本**（`2026-09`）。
Pack 更新時開新版，舊 feature 不會被無預警改掉。

### 我們的 surface 憑什麼可信

不是我們畫的，是從 RD 的程式碼推導的，每一步都留證據：

| 證據 | 檔案 | 意思 |
|---|---|---|
| RD 原始碼 | `platform/rd-baseline/**`（81 檔） | 每個檔案的 sha256 都對得起 component contract，`validate:snapshot` 會擋 |
| 採用率 | `docs/surfaces/rd-composition-deviations.md` | 34 個 family 的 import 統計 |
| 尺寸 | `platform/surfaces/pattern/*/geometry.yaml` | **從 RD 的 stylesheet 讀出來的宣告值**，不是量截圖 |
| 鎖定範圍 | `platform/surfaces/shared-surfaces.yaml` | 16 個共用 surface，單一 feature 不得自行改 |

> **geometry 分兩種，刻意分開：**
> `declared` ＝ RD stylesheet 裡真的寫了這個數字，可以靜態比對；
> `measured` ＝ 版面算出來的結果（例如兩個 tab 的分段控制器最後多寬），只能在瀏覽器量。
> 分開記錄，是為了不讓「我們量到的」被當成「RD 寫死的」。

---

## 2. RD 怎麼拿 code

**前提：prototype 永遠不接後端、永遠假資料。** RD 拿到的是 UI 與契約，不是可上線的服務。

### 每個檔案標了可攜等級

| 等級 | 意思 | RD 怎麼處理 |
|---|---|---|
| `verbatim` | 與 RD 原始碼**逐位元組相同** | 不用看，本來就是你們的 |
| `drop-in` | 改寫過但介面相容 | 可以直接放進去，review 差異即可 |
| `reference` | 只是參考，架構不同 | 當設計稿看，自己重寫 |

等級寫在 `design-library/components/<id>/component.yaml` 的 `rd.portability`，逐檔案的對應在 `rd.verbatimFiles`。

### 一個 feature 交付什麼

```
features/<feature>/generated/
├── index.jsx                    L3 模組編排
├── settings/index.jsx           L1 產品組合（版面）
├── data/*.js                    L2 純資料與規則（無 React）
└── contract/
    ├── task-contract.yaml       L4 後端要什麼、回什麼
    └── integration.yaml         要註冊到哪些地方才看得到這頁
```

分層是照 `character-motion-swap` 推導的。**注意：這個分層在約 7 成的 family 成立，不是全部** ——
34 個裡有 10 個沒有 `settings/` 目錄。這是給 RD 的第一個問題（見第 3 節）。

### API 怎麼串

Prototype 不呼叫任何 API，但把「該呼叫什麼」寫下來：

- `contract/task-contract.yaml` —— 這個功能需要後端做什麼、參數是什麼、回什麼形狀
- `product/payload-samples/*.json`（optional）—— 已知的 engine payload 範例，**去識別化**，
  `validate:inputs` 會擋掉任何 token、cookie、真實 email、非 example.com 的 URL

RD 拿 payload sample 直接串 API 即可，不需要反推我們的意圖。

---

## 3. RD 可能問的問題（先備好答案）

| 問題 | 答案 |
|---|---|
| 你們改過我們的元件嗎？會不會分岔？ | 會查。`npm run validate:rd-parity` 逐位元組比對 `verbatim` 檔案，**已經抓到過一次**：Button 的 enabled 字色被換成另一個 token 以通過對比度檢查。已還原，例外正式記錄為 DESIGN-005 |
| 這些 code 我要整包拿還是挑？ | 挑。看 `rd.portability`，`verbatim` 的不用拿（本來就是你們的），`reference` 的別拿 |
| token 從哪來的？ | 你們給的 `yce-frontend 1.34.1`，252 個鎖在 `tokens.lock.json`，`platform/tokens/rd/**` 對我們是唯讀。feature 自創顏色會被 `validate:tokens` 擋 |
| 誰保證 prototype 跟 production 長一樣？ | geometry facts 從你們的 stylesheet 讀。已經抓到 tab 高度我們多了 4px，已改回 42px |
| 我要改共用元件，會不會踩到你們？ | `shared-surfaces.yaml` 鎖了 16 個，改它要走共用層流程。剩下的 feature 自己決定 |
| 你們憑什麼說這是「共用」？ | 34 個 family 的 import 統計，見偏離報告。我們沒有把 1/34 的東西叫共用 |

### 需要 RD 回答的三題

| # | 問題 | 為什麼卡 |
|---|---|---|
| **TC-001** | 四層分層（L1 產品組合／L2 純資料／L3 編排／L4 契約）在你們其他 family 成立嗎？ | 我們只用一個 family 推導 |
| **TC-002** | 10 個沒有 `settings/` 的 family，settings 是平鋪在 `index.js` 嗎？ | 若是，L1／L3 分層對它們要另外設計 |
| **TC-003** | `apply-button` vs `apply-button-with-coin-credit` 的分界是產品規則（扣點）還是歷史殘留？ | 是規則就寫進 contract，是殘留就標 deprecated |

細節在 [`2026-09-03-rd-integration-discussion.md`](./2026-09-03-rd-integration-discussion.md)。

---

## 4. Next action

| # | 事項 | 誰 | 何時 |
|---|---|---|---|
| 1 | 回答 TC-001／002／003 | **RD** | 會議後一週 |
| 2 | 13 個影片類 module 有沒有入口（SM-002 縮減版） | **PM** | 本週 |
| 3 | 偏離 3：apply button 分界是不是扣點規則 | **PM** | 本週 |
| 4 | 看 `shared-surfaces.yaml` 鎖的 16 個 surface 有沒有異議 | **Designer** | 本週 |
| 5 | tab 高度 46→42px、`ToolPageLayout` 多一層 wrapper | **Designer 知會** | 已完成 |
| 6 | 3 個 custom token、DESIGN-005 對比度 | **Designer＋RD** | 卡 design-final |
| 7 | CI 平台選型（GitHub Actions？） | **主管裁示** | 未定 |
| 8 | Figma mapping 12 個全 pending | **Designer** | 卡 canonical approval |

**現在最卡的是 1 和 6。** 沒有 RD 回答 TC-001／002，WS-9.1 沒辦法確認分層通則；
沒有 Designer／RD 對 token 與對比度拍板，任何 feature 都到不了 design-final。
