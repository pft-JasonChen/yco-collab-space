# 給 RD：surface 定義要接上真實元件

> **狀態：** 待送出。三題（SB-001／002／003）需要 RD 回覆方向。
> **背景：** [讓 surface 看得見：計畫](./2026-09-04-surface-visibility-plan.md) 的 Step 2 前置。
> **編號：** 用 `SB-` 而不是 `TC-`，因為 repo 裡已經有兩套獨立的 TC-001~003
> （[handoff briefing](./2026-09-04-surface-and-rd-handoff-briefing.md) 是分層問題，
> [rd-integration-discussion](./2026-09-03-rd-integration-discussion.md) 是 task-contract 問題）。

---

**主旨：surface 定義要接上真實元件，有三題需要你們拍板**

一句話背景：我們有 26 個 surface 定義，但沒有人看過它們長什麼樣，所以沒人知道對不對。要渲染出來給 Designer 看，缺一層「哪個區域由哪個元件填」的對照。這層要怎麼放，想先問你們再動工。

---

**先講一個現況，這不是猜的**

`surface.yaml` 有個 `shell:` 欄位。10 個值**沒有一個**對得上 `platform/ui` 的目錄：

```
shell: tool-page            →  platform/ui/tool-page-layout        差一個字
shell: uploaded-media       →  platform/ui/upload-media-block      差一個字
shell: result-tabs          →  platform/ui/video-results-surface   完全不同
shell: video-workspace      →  不存在
shell: editor-workspace     →  不存在
shell: generator-workspace  →  不存在
shell: marketing            →  不存在
```

前兩個「差一個字」是關鍵 —— 這不是「還沒接上」，是**接上過然後兩邊各自漂走**，而且沒有任何檢查會發現。我們想避免補的新東西幾個月後變成同一個樣子。

---

**SB-001：`componentReuse` 已經在做這件事了，要不要往上提一層？**

video-expansion 的 `surface-intent.yaml` 裡已經有：

```yaml
componentReuse:
  - role: aspect-ratio-selector
    resolution: existing-component
    component: ratio
    evidence: RD common/ratio ported as platform/ui/ratio; ...
```

15 筆，13 筆指名了元件。但這是 **feature 層**的紀錄。

有意思的是**缺的那 7 個 role**：

`media-upload`、`navigation-header`、`primary-action`、`processing-feedback`、`settings-inspector`、`video-player`、`video-settings`

全部都是**共用外殼**的 role。feature 沒記錄它們，因為 feature 對它們沒有選擇權 —— 是 pack 給的。

從 import 看也一樣：video-expansion 實際 import 了 11 個 `platform/ui` 元件，`componentReuse` 只提到 9 個，差的兩個正好是 `button` 和 `tool-page-layout`，也就是最「外殼」的那兩個。

**所以缺的不是紀錄機制，是 pack 自己提供的那一層沒有人記。**

| | 做法 | 問題 |
|---|---|---|
| **A** | 每個 surface 版本一份 `bindings.yaml` 記 pack 自己的；feature 層維持現況 | 兩層，要定義誰蓋過誰 |
| **B** | 不寫，從用到這個 pack 的 feature 反推 | 沒有第二份真相，理論上最乾淨 —— **但 10 個 provisional surface 有 9 個零採用，反推不出東西** |
| **C** | 直接寫進 `surface.yaml` | 會破壞你們既有的原則，見下 |

**我們傾向 A**，想聽你們的，特別是 A vs B。

---

**SB-002：binding 掛在 zone 還是 slot？**

`surface.yaml` 有 zones，`component-slots.yaml` 有 slots，而且**有一大批 id 兩邊都出現**。
這不是 tool-video 的特例 —— **10 個有定義的 pack 裡有 7 個中招，共 14 個 id**：

| pack | 同時是 zone 也是 slot 的 id |
|---|---|
| `workspace/tool-video` | `primary-action`、`settings-inspector`、`video-detail-dialog` |
| `pattern/tool-page` | `primary-action`、`result-column`、`settings-inspector` |
| `pattern/uploaded-media` | `media-upload`、`uploaded-media` |
| `pattern/history-list` | `history-card`、`history-list` |
| `pattern/detail-modal` | `next-action` |
| `marketing/product-page` | `feature-hero` |
| `workspace/tool-image-generator` | `result-gallery` |

「這個區域由哪個元件填」掛在哪一邊，會直接決定 schema 長相。
想請教：當初分成兩個檔案，zone 和 slot 的分界意圖是什麼？

---

**一個我們不打算動的東西**

`tool-video` 的 `decisionBasis` 寫著：

> Zones are named after what the surface holds, not after the component that fills it,
> so a pattern can be re-implemented without renaming the zone.

我們認為這是對的，所以 binding 才刻意不寫進 `surface.yaml`（選項 C 出局）。
**如果這句其實不是刻意的決定，請告訴我們** —— 它現在擋掉了一個比較省事的做法。

---

**SB-003：`shell:` 刪掉還是修好？**

刪掉的話功能由 binding 承接；保留的話要納入驗證，但得先修那 10 個值。
**我們傾向刪。**

---

**補充：一個我們自己踩到的坑**

我們做了一個索引頁把 26 個 surface 列出來（`npm run surfaces:browser`），第一版就把 `pattern/video-results` 顯示成「沒人用」。

原因是 `tool-video` 組合的 6 個 pattern 裡，**5 個寫在 `surface.yaml` 的 zone 描述，第 6 個只寫在 `component-slots.yaml` 的 slot 描述**。我們只掃了 zone。

差一點就得出「這個 pattern 沒人用，可以刪」的結論。這就是 SB-001 為什麼值得花時間 —— 目前「誰組合了誰」只能靠 regex 掃英文句子，還得掃兩個檔案才掃得全。

---

**需要什麼**

三題只要方向，不用細節。schema 我們寫，寫完開 PR 給你們 review。

沒有這三題我們可以先做索引頁（把 26 個 surface 列出來讓大家看有哪些、哪些沒人用），但**渲染那步會卡住** —— 那步才是讓 Designer 能指出「這個版型是錯的」的關鍵。

計畫全文：`docs/architecture/2026-09-04-surface-visibility-plan.md`
