# Strapi registry（RD-owned）

這個資料夾是 RD 提供給產品頁生成器的「網站目前支援的 Strapi 結構」。生成器與
validator 只認這裡的定義；LLM 生成任何 section 前，都必須先在這裡找到對應的
component uid、欄位型別與允許值。

```text
strapi/
├── registry.yaml                 # 版本、admin API 路徑、content-type、components 清單
├── content-types/
│   └── yce-product-page.json     # 產品頁 content-type 的頂層欄位與 dynamic zone
├── components/
│   ├── product-page.top-banner.json
│   ├── product-page.rich-editor.json
│   ├── apps-page.section-be-af-image.json
│   ├── product-page.section-steps.json
│   ├── apps-page.section-faq.json
│   └── shared.*.json             # 巢狀共用欄位群（section text、background、cta…）
├── media/shared-assets.json      # 已存在於 Strapi 的共用素材 id（App badge、placeholder）
├── mapping/rules.md              # content + layout → Strapi payload 的轉換規則
├── skills/content-to-strapi/     # RD 開發的轉換 skill
└── client/                       # push 工具說明與 .env.example（實際值不進 repo）
```

## 與 Design 的綁定

Designer 在 `design-library/patterns/product-page/<pattern>.yaml` 內以
`strapiComponent: <uid>` 綁定視覺 pattern 與這裡的 component。`npm run page:validate`
會檢查：

- 每個 pattern 綁定的 uid 存在於 `registry.yaml`；
- pattern 的 `layoutOptions` 只使用 component 已定義的欄位與 enum 值；
- pattern 引用的 design token 存在於 `platform/tokens/tokens.lock.json` 鎖定的 RD token。

`npm run page:binding` 會輸出一份 component ↔ pattern ↔ token 的綁定表到
`.collab-cache/strapi-registry-index.json`，供 agent 在生成前讀取。

## 更新原則

- 只有 RD 更新這裡。改 uid、欄位、enum 值後執行 `npm run page:validate`，
  會找出所有因此失效的 pattern 與已生成 payload。
- `uidStatus: inferred` 代表 uid 是從既有 payload 反推、尚未對照 Strapi schema 確認；
  RD 確認後改成 `confirmed`。
- `media/shared-assets.json` 的 id 是 Strapi 既有 media library 的 id；換環境要重填。
- 不要把 admin 帳密、JWT、`refs/` 內的 payload 匯出放進這個資料夾。
