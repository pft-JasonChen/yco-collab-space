# Product pages

一個產品頁一個資料夾。PM 只寫 `source/`，agent 只寫 `generated/` 與 `evidence/`，
階段紀錄在 `releases.json`。上游功能 spec 直接引用 `features/<feature>/product/**`，
不需要重新上傳。

```text
product-pages/<page>/
├── source/
│   ├── page.source.yaml     # PM：頁面目標、上游 feature／product／competitor、必要 sections、連結
│   ├── brief.md             # PM：本頁額外要求（可留空）
│   └── mock-assets/         # PM：暫時素材；只允許在 Strapi draft
├── generated/
│   ├── content.json         # Stage A：有來源標註的內容
│   ├── layout.json          # Stage B：每段對應的 Designer pattern 與選項
│   ├── strapi-payload.json  # Stage C：可直接送 Strapi 的 body
│   ├── review/spec-compliance.json   # 獨立 reviewer 的判定
│   └── generation.json      # provenance：所有輸入 hash、skill 版本、model
├── evidence/publish/*.json  # push 紀錄（gitignored）
└── releases.json
```

流程：

```text
/product-page-brief <page>      PM 與 agent 建立／更新 source
/product-page-generate <page>   同一套流程：content → review → layout → payload → validate
/product-page-review <page>     單獨重跑 reviewer
/product-page-publish <page>    人工確認後建立 Strapi draft，回寫 entry id 與 admin 預覽網址
```

`npm run page:create -- <page> "<Title>"` 會從 `_template/` 建骨架。
