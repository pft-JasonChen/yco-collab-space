# Product library（PM-owned）

PM 維護的全域產品知識庫，與 Designer 的 `design-library/` 對稱。產品頁生成器從這裡讀：

```text
product-library/
├── products/<slug>/
│   ├── product.yaml          # 現有產品：定位、功能、CTA 連結、ratings、Strapi entry
│   ├── pages/*.md            # 現行產品頁內容快照（作為改版對照與文案風格參考）
│   └── assets/               # 可選：截圖等 PM 參考素材（不會被上傳到 Strapi）
├── competitors/<slug>/
│   ├── competitor.yaml       # 競品基本資料與我們的差異點
│   ├── pages/*.md            # 競品頁面快照（用 npm run library:product:capture 擷取）
│   └── analysis.md           # PM 的競品分析結論
├── messaging/
│   ├── brand-voice.md        # 語氣、用字
│   └── claim-rules.md        # 什麼樣的宣稱可以寫、需要什麼來源
├── review/
│   └── spec-compliance-rubric.md   # reviewer subagent 判斷「是否超出 PM spec」的準則
└── skills/spec-to-content/SKILL.md # PM 開發的 spec → content skill
```

## 來源引用規則

`content.json` 內每個 claim／benefit／step／FAQ 都要有 `sourceRefs`，指向：

- `features/<feature>/product/<file>#<heading>`：功能 spec（首選）；
- `product-library/products/<slug>/product.yaml#<key>` 或 `pages/<file>#<heading>`；
- `product-library/competitors/<slug>/...`：只能支持「定位／差異化」語句，不能作為我們產品能力的唯一來源；
- `product-pages/<page>/source/brief.md#<heading>`：PM 對本頁的額外指示。

`npm run page:validate` 會確認每個 ref 的檔案與標題存在。

## 工具

```bash
npm run library:product:index                       # 建 .collab-cache/product-library-index.json
npm run library:product:capture -- --url <url> --to competitors/<slug>/pages/<name>.md
```

capture 只把公開頁面的標題、段落與清單存成 markdown，不下載圖片、不登入。
