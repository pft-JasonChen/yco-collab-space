# 讓 surface 看得見：計畫

> **要解決的問題：** 現在 surface 只有文字。沒有人看過它們長什麼樣，所以沒有人知道它們對不對。
> **讀者：** 執行這件事的人（RD／PM），以及要來審查的 Designer。
> **狀態：** Step 1 已完成（2026-09-06，branch `feat/surface-visibility`）。Step 2 等 RD 回覆 SB-001／002。
> **修正紀錄：** §1.5 記錄 Step 1 推翻的三個原始數字。

---

## 0. 目的：渲染是驗證，不是文件

這件事的起點不是「想要一份好看的 surface 型錄」，是這句話：

> 現在只有文字且大家沒看過也不知道是不是能用的（說不定渲染出來才發現是錯的）

所以**驗收標準不是「browser 做出來了」，是「有人看了，並且指出了錯」**。
渲染出來發現 surface 定義錯 = 這件事成功了，不是失敗。
渲染出來大家都說對 = 也可以，但那要是**看過之後**的結論，不是沒看過的預設。

這決定了後面每一個取捨：任何會讓「看到的東西」跟「真正被使用的東西」不同的做法，都是在製造假的安心感，不做。

---

## 1. 現況盤點（2026-09-04 實查）

### 1.1 數量

| 項目 | 數字 |
|---|---|
| catalog 登錄 | 26（`surface` 15、`module` 11） |
| `planned`（只有一行登錄，沒有檔案） | 16 |
| `provisional`（有檔案，沒人看過） | 10 |
| `approved` | **0** |
| 實際存在的 version 目錄 | 11 |
| 有 pin pack 的 feature | **1**（video-expansion → tool-video，`hybrid`） |

`collab-space-readiness` 和 `_template` 都是 `novel`、`primaryPack: null`。

> **2026-09-06 修正：** 上面「只有 1 個被用過」是錯的，Step 1 的 browser 做出來後查出真實數字。
> 正確的是 **10 個裡有 8 個在用，只有 2 個真的沒人用**（`marketing/product-page`、`workspace/tool-image-generator`）。
> 錯在兩件事：`workspace/tool-photo-editing` 被 video-expansion **borrowed**（借了 `settings-inspector`、`tool-rail` 兩個 role），
> 我只看了 `primaryPack`；6 個 `pattern/*` 則是被 `tool-video` **組合**，而組合關係寫在散文裡，不看散文就會全部誤判成沒人用。
> 這正是 SB-001 要解決的問題本身 —— 詳見 §1.5。

### 1.2 三個缺失的連結

| 連結 | 現況 | 後果 |
|---|---|---|
| pack → 它 compose 哪些 pattern | 寫在 `decisionBasis` 的散文裡 | 程式讀不到，只能人讀 |
| zone／slot → 哪個元件填它 | **完全不存在**，`component:` 在所有 `component-slots.yaml` 出現 **0** 次 | 無法從定義推出要渲染什麼 |
| surface → 實作 | `shell:` 欄位 | **10 個值沒有一個對得上 `platform/ui` 目錄** |

`shell:` 的失效方式特別值得看，因為它是「近乎對上」：

```
shell: tool-page        →  platform/ui/tool-page-layout      （差一個字）
shell: uploaded-media   →  platform/ui/upload-media-block    （差一個字）
shell: result-tabs      →  platform/ui/video-results-surface （完全不同）
shell: video-workspace  →  （不存在）
shell: editor-workspace →  （不存在）
shell: generator-workspace → （不存在）
shell: marketing        →  （不存在）
```

這不是「還沒接上」，是**接上過然後各自漂走了**，而且沒有任何檢查會發現。
它跟這個專案已經抓到的其他錯誤是同一類：Button token、4px tab 高度、三處 effect-key 查詢 —— 兩份真相，沒有人比對。

### 1.3 好消息：零件都在，而且都能渲染

- `platform/ui` 有 **12 個元件目錄**，**12 個都有 Storybook story**（共 25 個 story）
- video-expansion 一頁就 import 了其中 **11 個**

**所以缺的從來不是零件，是「組合」。** 唯一被組合過的 surface 是 `tool-video/2026-09`，而且是間接的 —— 靠 video-expansion 這個 feature 湊出來，不是 surface 自己站出來過。

### 1.4 兩個現成的基礎建設（不用從零開始）

| 檔案 | 行數 | 對這件事的意義 |
|---|---|---|
| `tools/design-library/browser-server.mjs` | 84 | **Surface Browser 的現成範本。** 同樣是 scan → 產 HTML → 本機 serve，`renderLibraryHtml(index)` 已經抽成純函式所以可測。照抄結構即可。 |
| `tools/prototype-cli/validate-surfaces.mjs` | 142 | **binding 檢查的現成落點。** 已經在驗 catalog／manifest 一致性、slot id 重複、evaluation metadata。新規則加在這裡，不用新開 gate。 |

### 1.5 Step 1 做完之後查到的（2026-09-06）

Surface Browser 一做出來就推翻了這份文件原本的三個數字。**這是這份計畫預期的結果**（§0：渲染是驗證），只是比預期早發生 —— 連畫面都還沒有，光是把資料排出來就夠了。

| 原本寫的 | 實際 | 為什麼會錯 |
|---|---|---|
| 10 個 provisional「9 個零採用」 | **只有 2 個真的沒人用** | 只看了 `primaryPack`，漏掉 borrowed 與「被組合」 |
| `tool-photo-editing` 沒人用 | **video-expansion borrowed 它**（`settings-inspector`、`tool-rail`） | 同上 |
| 6 個 pattern 沒人用 | **全部被 `tool-video` 組合** | 組合關係只存在於散文 |
| tool-video 有 3 個 id 同時是 zone 與 slot | **7 個 pack、14 個 id** —— 是系統性的，不是特例 | 只查了一個 pack |

**還有一個給執行者的陷阱**，我自己就踩了：`pattern/video-results` 一度顯示成沒人用。原因是 `tool-video` 的 6 個 pattern 裡，**5 個寫在 `surface.yaml` 的 zone 描述，第 6 個只寫在 `component-slots.yaml` 的 slot 描述**。只掃 zone 就會漏掉它 —— 然後有人會提議刪掉一個天天在用的 pattern。

這件事本身就是 SB-001 最好的論據：**「誰組合了誰」只能靠 regex 掃英文句子才知道，而且要掃兩個檔案才掃得全。**

真正沒人用的只有這兩個，Step 4 要問的就是它們：

- `marketing/product-page`
- `workspace/tool-image-generator`

---

## 2. 一個修正：不要新增狀態

先前口頭建議過加一個 `rendered` 狀態。**查過之後撤回。**

`validate-surfaces.mjs:36` 的 enum 已經是：

```js
['planned', 'provisional', 'approved', 'deprecated']
```

`approved` 早就在，只是**從來沒有任何一個 entry 用過（目前 0 個）**。
所以階梯不用蓋，缺的是**升級條件**：

```
planned      只有名字
provisional  寫下來了，沒人看過        ← 現在 10 個全卡在這
approved     被渲染過、被 Designer 看過、發現的問題已回寫
deprecated   不再使用
```

**`provisional → approved` 的條件就是這份計畫的產出。** 這比新增欄位好，因為它讓「沒人看過」這件事在既有的 schema 裡就是可見的，不需要額外解釋。

---

## 3. 三個不同的問題，不要混在一起

| | 問題 | 今天能不能答 |
|---|---|---|
| **A** | 有哪些 surface？ | **可以。** catalog 資料完整 |
| **B** | 每個 surface 裡面有什麼（zone、slot、規則）？ | **可以。** YAML 都在 |
| **C** | 它長什麼樣？ | **不行。** 資料根本不存在 |

A 和 B 便宜，C 貴。**先把 A、B 做出來給大家看**，因為光是 A 就會引發你要的對話（「16 個 planned 是什麼？」「這 2 個沒人用的還要嗎？」）。不要等到 C 做完才給人看。

---

## 4. 被否決的做法：在 YAML 裡宣告版面

> C1：在 `surface.yaml` 加 `layout:` 區塊寫欄寬、順序、比例，然後照著畫方框圖。

**不做。** 理由是這個專案已經付過三次學費的同一件事：

它會產生**第二份真相**。畫出來的圖來自 YAML 的宣告，真正跑的頁面來自 `platform/ui` 的 CSS。兩者一開始一致，然後其中一邊改了，另一邊不會有任何錯誤 —— 圖繼續畫得好好的，只是不再是真的。

`shell:` 欄位就是這個結局的現場證據：它曾經是對的，現在 10/10 對不上，而且沒人發現。再加一層 `layout:` 只是把同樣的錯誤做大。

**圖必須從真正被渲染的東西產生，不能從描述它的文字產生。**

---

## 5. 計畫

### Step 1 — Surface Browser（索引：答 A 和 B）

**做什麼**　照 `browser-server.mjs` 的結構，掃 `catalog.yaml` + 各 `surface.yaml` / `component-slots.yaml` / `layout-rules.md`，產一頁本機 HTML。

**內容**　每個 entry 一張卡：狀態、kind、版本、zones（含 required）、slots（含 role）、layout rules 摘要、**誰在用它**（掃 features 的 `surface-intent.yaml`）。

**要刻意讓它顯眼的事實**（這是這一步真正的產出）：
- 16 個 `planned` 只有名字 —— 標成「尚未定義」
- 10 個 `provisional` 沒人看過（`approved` 目前 0 個）—— 標成「未經審查」
- **真正沒人用的 surface** —— 2 個（見 §1.5；原本以為 9 個）
- `shell:` 對不上實作 —— 10/10

**狀態：已完成（2026-09-06）**

```bash
npm run surfaces:browser     # http://127.0.0.1:5179
```

- `tools/design-library/surfaces.mjs` —— 掃描器，`scanSurfaces()` 為純函式
- `tools/design-library/surface-browser.mjs` —— `renderSurfaceHtml()` + 本機 server，另有 `/api/index` 吐 JSON
- 8 個測試在 `tools/design-library/surfaces.test.mjs`，已進 `npm test`

**驗收**　Designer／PM／RD 各自看過並且**至少提出一個「這個不需要」或「缺這個」**。沒有人提出任何意見 = 這一步沒達成目的，要去問為什麼。

**成本**　低。資料全部現成，範本現成。實際花費符合預期。

---

### Step 2 — 補 binding 層（前置，不可跳）

**為什麼不可跳**　Step 3 要渲染，就必須知道「哪個 zone 由哪個元件填」。這個資訊今天不存在於任何檔案裡，只存在於 video-expansion 的 import 清單。不補這層，Step 3 只能靠人猜，猜出來的圖就是第 4 節否決的那種假圖。

**放哪裡 —— 一個必須尊重的既有決定**

`tool-video` 的 `decisionBasis` 明寫：

> Zones are named after what the surface holds, not after the component that fills it, so a pattern can be re-implemented without renaming the zone.

**這個原則是對的，不要為了方便就破壞它。** zone 用「裝什麼」命名而不是「誰來裝」，換實作才不用改合約。

所以 binding **不能寫進 `surface.yaml`**，要獨立一份 —— 每個 surface 版本一個 `bindings.yaml`：

- zone id → 目前由哪個 `platform/ui` 元件實作
- pack → 它 compose 哪些 pattern（把散文改成結構化）
- 明確定位成「**目前的實作**」，可隨實作改而不動 zone 合約

**同時處理掉 `shell:`**　它現在是純誤導。兩條路，執行時擇一：
1. 刪掉，功能由 `bindings.yaml` 承接（乾淨，建議）
2. 保留但納入驗證，強制對上真實目錄（保守，但要先修 10 個值）

**驗證**　規則加進 `tools/prototype-cli/validate-surfaces.mjs`：

- `bindings.yaml` 指名的每個元件，目錄必須真的存在
- `provisional` 以上的每個 pack，每個 `required: true` 的 zone 都要有 binding（或明確標 `unimplemented:` 並附理由）
- pack 宣告 compose 的每個 pattern，必須是 catalog 裡真實存在的 id

**這一步的意義大於它的產出**　它把「surface 定義」和「真實程式碼」第一次綁在一起，並且**由 CI 維持**。做完之後，`shell:` 那種漂移不可能再無聲發生。

---

### Step 3 — 渲染 surface story（答 C）

**做什麼**　一個 surface 一個 Storybook story，用 `bindings.yaml` 指定的**真元件**組出來。

**不要用灰方塊。** Designer 要判斷的是「這個版型對不對」—— 灰方塊只看得出結構，看不出對錯。用真元件配示範內容（示範內容一律合成資料，遵守既有的 no-backend 規則）。

**一個要先講清楚的取捨** —— 這 10 個 pack 分成三種（§1.5 修正後）：

| | 能不能渲染 |
|---|---|
| 6 個 `pattern/*` + `workspace/tool-video` | **可以。** 元件都在，video-expansion 已經證明它們組得起來 |
| `workspace/tool-photo-editing` | **部分可以。** video-expansion 借用了它的 `settings-inspector` 和 `tool-rail`，這兩個 role 已經有對應元件（`result-page-shell`）。其餘沒有 |
| `workspace/tool-image-generator`、`marketing/product-page` | **不行。沒有任何實作，也沒有任何 feature 用它、沒有任何 pack 組合它。** |

**建議：不要為了看而寫實作。**

最後兩個要渲染，等於得先為它們從零寫出實作 —— 那是真正的開發工作，而且是為了兩個**真正零採用**的 surface 做的。本末倒置。

讓 Step 1 的 browser 誠實標示它們「**已宣告、無實作、無採用**」。這個標示本身就是對齊資訊：大家會問「那我們還需要它嗎？」—— 那正是要的討論。可能的結論是刪掉，也可能是「下一個 feature 就要用」，兩種都比現在的沉默好。

**驗收**　7 個渲染得出來的 surface 都有 story，並且截圖可分享。

---

### Step 4 — Designer 審查，把發現回寫

**真正的產出是修正，不是檢視器。**

流程：
1. 拿 Step 1 的索引 + Step 3 的畫面開審查會
2. 每一條意見落到具體檔案：`surface.yaml` 的 zone 定義、`layout-rules.md` 的規則、或 catalog 的狀態
3. 修完的 pack `provisional → approved`（第 2 節那個現成的 enum）
4. 沒被修的、沒人要的，`deprecated` 或從 catalog 移除

**這件事的成功指標是「有幾個 surface 因為被看見而改變了」**，不是「browser 上線了」。

---

## 6. 執行順序與相依

```
Step 1（索引）        獨立，可先做，先給人看
Step 2（binding）     Step 3 的前置，不可跳
Step 3（渲染）        需要 Step 2
Step 4（審查回寫）    需要 1 和 3
```

Step 1 不必等 Step 2。**先讓大家看到清單，比等到有圖再一起看更早引發討論**，而討論本身就是目的。

---

## 7. 給執行者的注意事項

### 7.1 從 RD 資料夾拿東西：只有一條路

Step 3 需要示範內容，這是最容易出事的地方 —— 有人為了讓畫面好看，直接從 RD 快照資料夾複製一張圖或一支影片進來。**不可以。**

**規則：任何來自 RD 的檔案，一律走 `npm run snapshot:vendor`，不手動複製。**

好消息是驗證機制已經存在而且已經在 `npm run validate` 裡（第 8 個 gate），不用另外做。
`tools/migration/snapshot.mjs` 的 `verifySnapshot()` 目前驗這些，**每一條都是雙向的**：

| 驗什麼 | 為什麼重要 |
|---|---|
| 磁碟上的檔案**重新算 sha256**，跟 manifest 記的比對 | 記錄下來的雜湊值不等於檔案沒被改。這條是真的重算 |
| manifest 的雜湊 vs 元件 contract 的雜湊 | 兩份記錄互相對帳 |
| 每個 contract 宣稱的來源，檔案必須真的被 vendored | 防「宣稱有但沒搬」 |
| **每個 vendored 檔案必須被某個 contract 認領** | 防「搬了但沒人用」的孤兒檔案偷渡進來 |
| 來源路徑不得命中 `rejectedPatterns` | **安全邊界**，不是方便性過濾。擋 `.env*`、憑證、金鑰、`node_modules`、build 產物 |
| vendored 檔案本身再檢查一次 `rejectedPatterns` | 就算 contract 沒攔到，檔案本身也擋 |
| site map 推導來源同樣要 vendored 且雜湊相符 | 沒人能重跑的推導不算可稽核 |

現況：`[snapshot] PASS 83 vendored RD files match their contracts`。

隨時可重驗：

```bash
npm run validate:snapshot
```

**所以執行時的實際做法是：**

1. 示範內容**優先用合成資料**，不要碰 RD 快照
2. 真的需要 RD 的檔案 → `npm run snapshot:vendor`，讓它進 manifest 並拿到雜湊
3. commit 前跑 `npm run validate`，snapshot gate 會擋下任何沒登記的檔案
4. **絕不** `cp` 或拖拉檔案進 `platform/rd-baseline/`

### 7.2 其他

- **合成資料**　story 的示範內容全部是合成的，不打任何後端／正式 API／測試 API。
- **token**　示範內容只用既有 CSS 變數，不新增 token 名稱，不寫死顏色。
- **`platform/tokens/rd/**` 唯讀**　這是 upstream 輸入，不動。
- **`bindings.yaml` 不是合約**　它描述「現在怎麼實作」，會隨實作變。zone 定義才是合約。這個區別要寫在檔案的註解裡，否則下一個人會搞混。
- **不要加 `rendered` 狀態**　`approved` 已經在 enum 裡（第 2 節）。

---

## 8. 待決事項

**已送 RD** —— 全文見 [給 RD：surface 定義要接上真實元件](./2026-09-04-rd-surface-binding-questions.md)。
編號用 `SB-` 而非 `TC-`，因為 repo 裡已有兩套獨立的 TC-001~003。

| # | 問題 | 誰決定 | 擋住什麼 |
|---|---|---|---|
| **SB-001** | binding 放哪裡？A（pack 層 `bindings.yaml`）／B（從 feature 反推）／C（寫進 `surface.yaml`，已否決）。<br>關鍵事實：`componentReuse` 已在 feature 層做同樣的事，缺的是 pack 自己提供的那層 | RD + PM | **Step 2、3** |
| **SB-002** | binding 掛在 zone 還是 slot？3 個 id 兩邊都有（`primary-action`、`settings-inspector`、`video-detail-dialog`） | RD | **Step 2 的 schema** |
| **SB-003** | `shell:` 刪掉還是修好？我們傾向刪 | RD | Step 2（小） |

**其餘**

| # | 問題 | 誰決定 |
|---|---|---|
| 4 | 兩個真正零採用的 surface（`marketing/product-page`、`workspace/tool-image-generator`）留著還是刪？<br>（原本列三個，`tool-photo-editing` 其實有人借用，見 §1.5） | Designer + PM，Step 4 決定 |
| 5 | 16 個 `planned` 有幾個是真的要做的？ | PM，Step 1 之後 |
| 6 | Step 3 的截圖要不要進 repo？（現在 `.gitignore:10-13` 排除全部 `evidence/`） | 跟 CI 平台問題（D5）一起決定 |

**Step 1 不被上面任何一題擋住**，可以立刻開始。
