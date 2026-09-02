---
name: content-to-strapi
owner: rd
version: 1
description: Convert a validated content.json + layout.json into a Strapi v4 payload that matches the RD component registry exactly.
---

# content-to-strapi（RD skill）

你是 Stage C 的轉換器。輸入是同一頁的 `generated/content.json` 與 `generated/layout.json`，
輸出是 `generated/strapi-payload.json`。你不得改寫文案內容、不得新增 content 裡沒有的
claim、不得發明 registry 沒有的欄位。

## 讀取順序

1. `strapi/registry.yaml`，取得 content-type 與 components 清單。
2. `strapi/content-types/yce-product-page.json`，取得頂層欄位。
3. `layout.json` 用到的每個 pattern 對應的 `design-library/patterns/product-page/<pattern>.yaml`
   與其 `strapiComponent` 的 `strapi/components/<uid>.json`。
4. `strapi/mapping/rules.md`（規則）與 `strapi/media/shared-assets.json`（共用素材）。
5. `.collab-cache/strapi-registry-index.json`（若存在，是 component ↔ pattern ↔ token 的綁定表）。

## 轉換步驟

1. 依 `rules.md` 第 2 節填頂層欄位；`status` 固定 `"draft"`；不要輸出任何 system／forbidden 欄位。
2. `hero` → `topBanner`：套用 pattern `fieldDefaults`，再放 content。
3. 逐一處理 `layout.sections[]`：
   - 用 pattern 決定 `__component`；
   - 先套 `fieldDefaults`，再套 `options`，再放 content 文字；
   - 文字依 `rules.md` 第 3 節轉 HTML；
   - 媒體依 `rules.md` 第 5 節輸出 `null`、整數 id 或 `{"$assetRef": …}`；
   - CTA 依第 6 節。
4. 每個 component 的欄位都要完整輸出（未使用的欄位給 `null`、repeatable 給 `[]`），
   讓 payload 與 Strapi 既有 entry 的形狀一致。
5. 寫入 `generated/strapi-payload.json`（2 空格縮排）。

## 自我檢查（寫檔後必做）

```bash
npm run page:validate -- --page <page>
```

任何 `[payload]` 錯誤都要修正後重跑。常見錯誤：未知欄位、enum 值不在允許清單、
必填欄位為 null、`publishedAt` 出現、`$assetRef` 指到不存在的檔案、
`sectionOrderLeft` 格式不是兩位數字。

## 禁止事項

- 不呼叫任何 Strapi API；push 由 `/product-page-publish` 另行執行。
- 不修改 `content.json`、`layout.json` 或任何 `source/**`、`strapi/**` 檔案。
- 不使用 `refs/` 內的真實 media id，除非該 id 已列在 `shared-assets.json`。
