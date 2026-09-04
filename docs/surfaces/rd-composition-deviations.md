# RD 組合鏈偏離報告

> **狀態：** 已裁示（Jason Chen，2026-09-04）。5 條中 4 條結案，1 條轉給 RD。
> 每一條都是機械比對出來的結構偏離，**不代表它是錯的** —— 判斷的是「這是刻意的產品決定，還是技術債」。
>
> | # | 裁示 |
> |---|---|
> | 1 · 3 個 family 不用 `feature-layout` | **照 RD 現況記錄，不試圖統一** |
> | 2 · `process-status` 兩版並存 | **照 RD 現況記錄，不試圖統一** |
> | 3 · apply button 兩種並存 | **是產品規則（免費 vs 扣點），寫進 surface contract** |
> | 4 · 規模極端值 | **照 RD 現況記錄，不試圖統一** |
> | 5 · 10 個 family 沒有 `settings/` | **保留，需 RD 回答（WS-9.1／TC-002）** |
> **量測來源：** `yce-frontend-gm-260909` 的 `src/components/result-page/<family>/**`，34 個 family。
> **方法：** 統計對 `result-page/common/<surface>` 的 import（同時吃 `@/` alias 與 `../common/` 相對路徑），**以 family 為單位計數，不是以檔案**。
> **關聯：** [`platform/surfaces/shared-surfaces.yaml`](../../platform/surfaces/shared-surfaces.yaml)

---

## 共用 surface 採用率

| 採用率 | Surface |
|---|---|
| 31/34 · 91% | `feature-layout` |
| 24/34 · 70% | `empty-result` |
| 21/34 · 61% | `interaction-tools-bar` |
| 19/34 · 55% | `hidden-file-input`（判為基礎設施） |
| 14/34 · 41% | `not-enough-credit` |
| 10/34 · 29% | `video-feature` |
| 9/34 · 26% | `process-status-v2` |
| 8/34 · 23% | `image-transform-wrapper` |
| 7/34 · 20% | `apply-button-with-coin-credit`、`scroll-to-top-button` |
| 6/34 · 17% | `apply-button`、`prompt`、`watermark-icon`、`react-scene` |
| 5/34 · 14% | `cross-promote-icon` |
| 4/34 · 11% | `message-dialogs` |
| 3/34 · 8% | `preview-left` |
| 2/34 · 5% | `process-status`（舊版） |
| 1/34 · 2% | `features-panel` |

`feature-layout` 是唯一接近全面的骨架。其餘沒有任何一個超過 70%。

---

## 偏離 1 — 3 個 family 不用 `feature-layout`

| Family | 規模 | 判斷線索 |
|---|---|---|
| `face-shape-detector` | 2943 行 / 28 檔 | 規模正常卻不用骨架，最可疑 |
| `image-template` | 198 行 / 4 檔 | 太小，可能只是薄殼、真正的頁在別處 |
| `video-template` | 107 行 / 3 檔 | 同上 |

**要你判斷：** `face-shape-detector` 是刻意用了不同版型（它是偵測工具不是編輯工具），還是它早於 `feature-layout` 就存在？兩個 template family 是不是根本不算獨立頁面？

**裁示（2026-09-04）：照 RD 現況記錄，不試圖統一。** RD 的組合方式是 RD 的決定；
我們的工作是把它記下來讓 prototype 對得上，不是要求它一致。這三個 family 不進共用 surface 的採用率門檻，其餘不動。

---

## 偏離 2 — `process-status` 有兩個版本並存，且 23 個 family 兩個都不用

| | Family |
|---|---|
| v1（2 個） | `ai-video-filters`、`video-enhance` |
| v2（9 個） | `basic-editing`、`body-reshape`、`color-correction`、`colorize`、`lighting`、`object-removal`、`object-replace`、`out-paint`、`photo-enhance` |
| 都不用（23 個） | 其餘全部 |

沒有任何 family 同時用兩個。

**要你判斷：** v1 的兩個是待遷移，還是有理由停在舊版？23 個「都不用」的是自己畫進度，還是那類功能根本沒有非同步處理？

**裁示（2026-09-04）：照 RD 現況記錄，不試圖統一。** v1／v2 並存是 RD 的遷移節奏，
不是我們要解的問題。兩個版本都列進 `shared-surfaces.yaml`，新 feature 預設用 v2。

---

## 偏離 3 — apply button 兩種並存，21 個 family 兩個都不用

| | Family |
|---|---|
| `apply-button` | `basic-editing`、`makeup-transfer`、`object-removal`、`object-replace`、`out-paint`、`photo-enhance` |
| `apply-button-with-coin-credit` | `ai-text-to-video-generator`、`face-swap`、`face-swap-vid`、`image-to-video`、`text-to-image`、`video-enhance`、`video-object-remover` |
| 都不用（21 個） | 其餘全部 |

分界看起來像「要不要顯示點數成本」—— 影像編輯類用前者，生成類用後者。

**要你判斷：** 這個分界是產品規則（免費 vs 扣點）還是歷史殘留？如果是產品規則，應該寫進 surface contract；如果是殘留，`apply-button` 該標成 deprecated。

**裁示（2026-09-04）：是產品規則，不是歷史殘留。** 分界就是「這個操作要不要扣點數」——
影像編輯類免費用 `apply-button`，生成類扣點用 `apply-button-with-coin-credit`。
已寫進 [`shared-surfaces.yaml`](../../platform/surfaces/shared-surfaces.yaml) 的 `selectionRule`：
新 feature 選哪一個由「是否消耗點數」決定，不由它像哪個既有頁決定。
`apply-button` **不標 deprecated** —— 它服務的是免費操作，仍然正確。

---

## 偏離 4 — 規模極端值（中位數 3036 行）

| | Family | 行數 |
|---|---|---|
| 過大 | `ai-makeup` | 19506 |
| | `text-to-image` | 9993 |
| | `image-to-video` | 8065 |
| 過小 | `image-converter` | 817 |
| | `image-template` | 198 |
| | `video-template` | 107 |

**要你判斷：** `ai-makeup` 是中位數的 6.4 倍 —— 它是真的複雜，還是一個該拆的巨獸？兩個 template family 小於 200 行，是不是其實共用同一個實作？

**裁示（2026-09-04）：照 RD 現況記錄，不試圖統一。** 檔案規模是 RD 內部重構的議題，
不影響 prototype 能不能對上版型。僅保留數據供 RD 參考。

---

## 偏離 5 — 10 個 family 沒有 `settings/` 目錄（多數 24/34 有）

`ai-video-filters`、`background-removal`、`basic-editing`、`face-shape-detector`、`image-converter`、`image-template`、`text-to-image`、`video-enhance`、`video-object-remover`、`video-template`

**要你判斷：** 這些是沒有可調參數（例如 `background-removal` 一鍵完成），還是把 settings 平鋪在 `index.js` 裡？後者的話 L1／L3 分層在這些 family 就不成立 —— 這**直接影響 WS-9.1**（分層通則是否適用其他 family）。

**裁示（2026-09-04）：保留，需 RD 回答。** 這一條 PM 無法判斷 —— 要知道那 10 個 family 是
「沒有可調參數」還是「settings 平鋪在 `index.js`」，必須看 RD 的實作意圖。
已轉為 **TC-002**，見 [RD 討論稿](../architecture/2026-09-03-rd-integration-discussion.md)。
**這是 WS-9.1 的前置條件**，RD 未回答前分層通則不擴大適用。

---

## 這份報告對 WS-9 的意義

我們的四層 anatomy 是以 `character-motion-swap` 為樣本推導的。它有 `data/`、`hooks/`、`components/settings/`，用 `feature-layout`。

實際分布：`hasHooks` 27/34、`hasSettings` 24/34、`hasData` 16/34。

**也就是說：分層假設在約 7 成的 family 成立，不是全部。** 偏離 5 那 10 個沒有 `settings/` 的 family 是最需要 RD 確認的一群 —— 如果它們的 settings 平鋪在 `index.js`，我們提議的 `settings/` 分層對它們就要另外設計。這正是給 RD 的討論稿第 2 節「需 RD 確認」那一題的具體證據。
