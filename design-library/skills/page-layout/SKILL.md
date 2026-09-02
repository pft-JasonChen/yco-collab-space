---
name: page-layout
owner: designer
version: 1
description: Compose a product page layout by assigning one Designer-owned pattern to every content section, using only registered layout options and tokens.
---

# page-layout（Designer skill）

你是 Stage B 的排版器。輸入是 `generated/content.json`；輸出是 `generated/layout.json`。
你只能從 `design-library/patterns/product-page/*.yaml` 挑 pattern，不得自創 pattern、
token 或 Strapi 欄位。

## 讀取順序

1. `platform/surfaces/marketing/product-page/2026-08/surface.yaml`：zone 順序
   （navigation、feature-hero、use-cases、conversion-action、footer；navigation 與 footer 由網站 shell 提供）。
2. `design-library/patterns/product-page/README.md` 與所有 pattern。
3. `content.json` 的 `hero`、`sections[]`（每段有 `role`）、`faq`。
4. `product-pages/<page>/source/page.source.yaml` 的 `layoutPreferences`（PM 可指定順序或排除的 pattern）。

## 規則

- 每個 content section 恰好對應一個 layout entry，`contentId` 一對一。
- `pattern.contentRole` 必須等於 section `role`；沒有對應 pattern 時停止並回報 design gap，
  不要硬塞另一個 pattern。
- `options` 只能用 pattern `layoutOptions` 的 key；值必須在 `values` 內或符合 `pattern`。
  `default: alternate` 代表連續同 pattern 的 section 左右交替（第一個用 `left`）。
  `default: sequence`／`total` 代表 01、02…與總數的兩位數字串。
- 檢查文案長度是否超過 pattern `copy.*`；超過時不要改文案，記錄在 `layout.json`
  的 `warnings[]`，由 PM skill 重跑。
- zone 順序：feature-hero → use-cases（intro、benefits、how-to、group heading、use cases）
  → conversion-action（faq）。不要改變 PM 在 content 中的 section 順序，除非
  `layoutPreferences.order` 明確指定。
- `tokensUsed` 列出本頁用到的所有 token 名稱（從 pattern `tokens` 收集），供 validator 對照 lock。

## 輸出格式

```json
{
  "schemaVersion": 1,
  "page": "<page>",
  "contentHash": "<sha256 of content.json>",
  "surfacePack": { "id": "marketing/product-page", "version": "2026-08" },
  "shellZones": ["navigation", "footer"],
  "hero": { "pattern": "hero-banner", "options": {} },
  "sections": [
    { "contentId": "intro", "pattern": "intro-rich-text", "options": { "Layout": "Standard" } }
  ],
  "tokensUsed": ["--font-size-heading-1"],
  "warnings": [],
  "decisionBasis": ["..."]
}
```

## 自我檢查

```bash
npm run page:validate -- --page <page>
```

修正所有 `[layout]` 錯誤後才算完成。不要修改 `content.json`、`source/**` 或 pattern 檔。
