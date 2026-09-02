# Handoff：<主題>

日期：YYYY-MM-DD ｜ 執行：Opus ｜ 審核：Fable ｜ 分支：`<branch>`

## 背景
兩三句：為什麼要做、決定是誰在什麼時候確認的（附文件路徑）。

## 執行規則
沿用 `docs/handoff/2026-09-02-product-page-opus-handoff.md` 的「執行規則」，不重抄。

## Tasks

### T<n>：<一句話>
- 需要誰先給輸入：PM / Design / RD / 無
- 輸入：<檔案或角色提供的內容>
- 只改：<路徑清單>
- 步驟：
  1. …
- 驗收：
  ```bash
  npm run page:validate -- --page <page>
  npm test
  ```
- 不得：<明確禁止事項>
- 待決定：<執行中發現需要角色決定的事，寫在這裡，不猜>

## 回報格式
每個 task 一行：`T<n> DONE|BLOCKED|SKIPPED — 驗收指令輸出摘要 — 待決定`。
