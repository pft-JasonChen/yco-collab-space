# RD intake and generation integrity

## 已實作範圍

`generation.json.integrity` 記錄完整 generated 目錄（排除自身 metadata）的逐檔 SHA-256、依賴逐檔 SHA-256、靜態 import/export/require/URL/CSS 邊，以及 revision hash。新增、刪除與修改均使證據過期。審核 `currentEvidence()` 與 build 使用同一個 live evidence validator，重新探索依賴，不信任舊 metadata 的檔案清單。

共用元件 provenance 已改成遞迴解析，涵蓋 CreditControls 間接引用的 Button。Surface context 遞迴鎖定 `composes` 的 module/pattern 版本；缺版本、循環與無法靜態解析的 runtime import 都會失敗。npm runtime package 必須存在於 lockfile 並有 integrity。Host、共用 UI、tokens、public、生成工具與 RD intake metadata 採保守整目錄 hash：可能使未實際用到該檔案的 prototype 一併過期，這是目前為完整性選擇的取捨。

這是內容完整性與過期偵測，不是密碼簽章或身分驗證。可修改 repository 的人仍能重新生成 hashes；真正的權限隔離、CODEOWNERS、受保護分支與受信任 CI 是後續治理工作。非靜態載入需先設計可驗證 manifest，不能關閉檢查。輸出 hash 指 prototype source outputs，不宣稱是 dist 部署位元組的簽章。

執行 `npm run eval:integrity` 可重現 seeded mutation tests；測試先確認原始 evidence 可核准，再修改產出／依賴，確認 PM inputs hash 不變但 approval gate 拒絕。`npm test` 與既有 build CI 已包含這些測試。

## Surface、Module、Pattern 的邊界

| 名稱 | 本專案語意 | AI Video 範例 |
| --- | --- | --- |
| Surface | 承載完整工作情境的畫面契約，含 zones、slots、狀態與響應規則；不等於每個 URL | `workspace/tool-video` |
| Module | 可嵌入 surface 的區塊或互動單元，不必有獨立 route | History、detail dialog、settings/results 組合 |
| Pattern | 可跨情境重用的佈局／互動規則；目前儲存為 `kind: module`、`pattern/*` ID | `pattern/detail-modal`；規範如何開啟、關閉、返回焦點與承載內容 |
| Component | 實際可 import 的 UI 實作與 props 契約 | Button、VideoHistory、VideoInfoDialog |

Pattern 與 component 不一對一；同一 pattern 可由數個 component 組合，也可由不同實作履行。RD 原專案的 feature/module 名稱是產品分類，不能直接當成這裡的 module 定義。

## 全量來源盤點已落地

`npm run snapshot:intake -- --source <RD snapshot directory>` 靜態讀取 `src` 的程式／樣式／JSON。結果在 `migration/rd-intake-inventory.json`：逐檔相對路徑、SHA-256、靜態 imports、依賴提示與候選分組。程式碼、環境檔、金鑰、binary media、node_modules、build outputs 不會被搬入。盤點範圍不包含 src 外的設定或 binary，故不宣稱完整 production dependency closure。遇到無法解析的檔案會標記 `unresolved`。

424 組是路徑分組候選，**不是 424 個已定義或可預覽的 UI**。所有候選都是 `pending-human-definition`；locale 路徑合併成同一候選。分類與 AI Video 範圍皆為啟發式提示，需人工拆併。Pattern 不自動從資料夾名稱推定。既有 catalog 的核准狀態不會被這次盤點改寫。

在 `/surfaces/?view=rd-intake` 可搜尋／篩選候選、檢視六階段 AI Video 工作表與既有預覽。公開介面只收到摘要，不含 raw code、hash 清單、import 字串或本機絕對路徑。RD 完整來源資料不能透過這個路由取得。

## AI Video 第一批實作方式

使用者已選擇 AI Video 全流程。六階段為：入口 → 載入 → 裁切／設定 → 送出／處理 → History 成功／失敗 → 詳情／Next Action。先沿用既有 Video Expansion 合成資料流程作為可操作試點；其他 Video 生成引擎尚未移植，不能把這個試點視為所有 AI Video 工具功能都完成。

人工決策工作表是 `migration/ai-video-pilot.json`。PM 填寫入口／出口、狀態轉換、錯誤與驗收；Designer 決定 Figma、zones vs slots、共用與工具特有差異、響應及焦點規則；RD 確認來源快照、可移植檔案、原始依賴與 adapter 邊界。AI 可以提案和產出 patch，不能代填人類核准。

建議交付順序：

1. PM 與 Designer 在既有可渲染試點逐階段填寫工作表，補上每個缺口的 owner 與決議。
2. 將確定的候選拆分成 presentation component、module/pattern 契約、feature-specific 行為、production adapter 四類。
3. 只將明確 allowlist 的來源納入 immutable baseline 與 snapshot manifest。保留來源 hashes；presentation port 另外記錄 local hashes、移除的依賴及 `reference` 或 `verbatim`。
4. 每個版本獨立 `bindings.yaml`，保持 zone／slot namespace 區別，shell 保留語意分類。新增 `provisional` 版本與合成情境 fixture；不要覆寫既有核准版本。
5. 不搬 production hooks／store／API／登入／付款流程。透過 props/events 與 deterministic adapter 模擬 task status、credit、history、errors；需要真實服務的需求另案。
6. 執行 parity、snapshot、hash mutation、build、三種 viewport 和 keyboard／error recovery 檢查，再由 PM／Designer／RD 依權責 review。真正 feature stage approval 仍用 `stage:transition`。

`reference` 的意義是「此 port 以 RD 作來源參考」，並非「不用檢查」。快照 hash、local hash、props、tokens、渲染與人工審查仍須保留。不能為了 preview 全過就批次把所有元件改成 reference。
