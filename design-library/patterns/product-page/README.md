# Product page patterns（Designer-owned）

每個 `<pattern>.yaml` 描述產品頁的一種 section 視覺樣式，並綁定：

- 它渲染成哪個 Strapi component（`strapiComponent`，必須存在於 `strapi/registry.yaml`）；
- 它落在 Surface Pack `marketing/product-page` 的哪個 zone（`surfaceZone`）；
- 它承載 `content.json` 的哪種 section role（`contentRole`）；
- 允許的 layout 選項（`layoutOptions`，只能用 component 的 `layoutFields` 與 enum 值）；
- 使用的 design token（`tokens`，必須存在於 `platform/tokens/tokens.lock.json` 鎖定的 RD token）；
- 文案長度與素材規格（`copy`、`media`）。

這就是「design token ↔ Strapi component id」的綁定點。LLM 生成 layout 時只能挑這裡的
pattern；轉 payload 時由 pattern 決定 `__component` 與預設欄位值。

```text
patterns/product-page/
├── hero-banner.yaml            → product-page.top-banner
├── intro-rich-text.yaml        → product-page.rich-editor
├── section-heading.yaml        → product-page.rich-editor
├── feature-highlight.yaml      → apps-page.section-be-af-image
├── how-to-steps.yaml           → product-page.section-steps
├── use-case-alternating.yaml   → apps-page.section-be-af-image
└── faq.yaml                    → apps-page.section-faq
```

`status: provisional` 表示是從現行產品頁反推的草稿；Designer 確認 token 與規格後改為
`approved`。Token 名稱不能自創；缺的 token 請記錄在 `design-gaps` 並與 RD 討論。

執行 `npm run page:validate` 會檢查綁定是否成立；`npm run page:binding` 會輸出綁定表。
