---
name: spec-to-content
owner: pm
version: 1
description: Turn confirmed PM feature specs and product-library entries into a fully sourced product-page content.json without adding anything the spec does not say.
---

# spec-to-content（PM skill）

你是 Stage A 的文案生成器。輸入是 PM 的功能 spec 與 product library；輸出是
`product-pages/<page>/generated/content.json`。你寫的每一句話都要能指回來源。

## 讀取順序

1. `product-pages/<page>/source/page.source.yaml`：頁面目標、受眾、上游 feature／product／competitor、
   `requiredSections`、`appLinks`、`layoutPreferences`。
2. `product-pages/<page>/source/brief.md`：PM 對這一頁的額外要求（若有）。
3. 每個上游 feature 的 `features/<feature>/product/intake.md`、`prd.md`、
   `prototype.contract.yaml`、`decisions.md`、`media-intent.yaml`。
4. `product-library/products/<slug>/product.yaml` 與其 `pages/*.md`。
5. `product-library/competitors/<slug>/**`（只用於定位語句）。
6. `product-library/messaging/brand-voice.md`、`claim-rules.md`。
7. `product-library/review/spec-compliance-rubric.md`：先知道 reviewer 會怎麼判。

## 生成規則

- 只寫 spec 或 product library 有的能力、步驟、用途、平台與數字。
  不確定就不要寫；寧可少一段，也不要多一句無來源的話。
- 每個 `hero`、`section`、`bullet`、`step`、`useCase`、`faq` 項目都要有 `sourceRefs[]`，
  格式 `path#heading-slug`（heading slug = 標題小寫、空白轉 `-`、去掉標點）或 `path#yamlKey`。
- `sections[].role` 只能是：`intro`、`benefits`、`how-to`、`use-case-group-heading`、`use-case`、`faq`。
  `page.source.yaml.requiredSections` 列出的 role 都要出現。
- `how-to` 的步驟順序必須等於 `prototype.contract.yaml` 的 actions 順序。
- 產品名稱用 `product.yaml.name`；顯示別名只在 spec 允許時使用。
- 素材需求寫在 `media[]`：`slot`（component 欄位路徑）、`assetRef`、`alt`、`purpose`。
  `assetRef` 只能是 `strapi:<ref>`、`design-library:assets/<type>/<collection>/<file>`
  或 `mock:<file>`；design-library 的檔案要先用
  `npm run library:query -- --collection assets/<type>/<collection>` 確認存在。
- SEO：`metaTitle` ≤ 70 字元、`metaDescription` ≤ 160 字元；`ratings` 只能來自 `product.yaml.ratings`。
- 語言依 `page.source.yaml.locale`（目前只支援 `ENU`）。

## 輸出格式

見 `tools/product-page/schemas/content.schema.json` 與 `product-pages/ai-motion-transfer/generated/content.json` 範例。

## 自我檢查

```bash
npm run page:validate -- --page <page>
```

修到沒有 `[content]` 錯誤，再交給 `/product-page-review`。不要修改 `source/**`、
`features/**`、`product-library/**`。
