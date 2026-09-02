# content + layout → Strapi payload mapping rules（RD-owned）

這份規則是 `strapi/skills/content-to-strapi/SKILL.md` 與 `tools/product-page/validate-pages.mjs`
共同依據。改規則時兩邊都要更新。

## 1. 輸入與輸出

| 輸入 | 位置 | Owner |
|---|---|---|
| `content.json` | `product-pages/<page>/generated/content.json` | Agent（PM skill 產出） |
| `layout.json` | `product-pages/<page>/generated/layout.json` | Agent（Designer skill 產出） |
| Component registry | `strapi/components/*.json`、`strapi/content-types/*.json` | RD |
| Shared assets | `strapi/media/shared-assets.json` | RD |

輸出：`product-pages/<page>/generated/strapi-payload.json`，其結構 = content-type
`attributes` 物件（不含外層 `data`／`content` 包裝），可直接作為
`POST /content-manager/collection-types/<uid>` 的 JSON body。

## 2. 頂層欄位

| payload 欄位 | 來源 |
|---|---|
| `pageName` | `content.meta.pageName` |
| `pageKey` | `content.meta.pageKey`；必須等於 `functionKey` 最後一段 |
| `functionKey` | `content.meta.functionKey`，格式 `/products/<pageKey>` |
| `shortDescription` | `content.meta.shortDescription` |
| `isVisibleInListView` | `true`，除非 `page.source.yaml` 指定 |
| `languages.languages` | `content.locale` |
| `b2BorB2C.b2BorB2C` | `content.meta.audience` |
| `status` | 永遠 `"draft"` |
| `seo` | `content.seo` 逐欄位對應；`ratingValue`／`ratingCount` 只能來自 product-library 的 `ratings` |
| `topBanner` | `content.hero` + layout `hero.pattern` |
| `sections[]` | `content.sections[]` 依 `layout.sections[]` 順序逐一轉換 |

不得輸出：`id`、`createdAt`、`updatedAt`、`publishedAt`、`vuid`、`versions`。

## 3. 文字欄位

- `richtext` 且 `html: true` 的欄位：純文字包成 `<p>…</p>`；bullet list 轉成
  `<ul><li><strong>標題：</strong>內文</li></ul>`；不得輸出 `<script>`、inline style 以外的標籤。
- `string` 欄位：純文字，不含 HTML。
- 長度以 Designer pattern 的 `copy.*.maxChars` 為準（validator 以純文字長度計算）。
- 語言：`content.locale` 為 `ENU` 時全部英文；其他語言由既有 n8n localisation flow 處理，不在此產生。

## 4. Section 對應

`layout.sections[i].pattern` → `design-library/patterns/product-page/<pattern>.yaml` →
`strapiComponent` 決定 `__component`。`layout.sections[i].options` 的每個 key 必須是該
component 的 `layoutFields`；值必須在 enum 內。Pattern 的 `fieldDefaults` 先套用，
再由 content 與 options 覆寫。

| content role | 預設 pattern | `__component` |
|---|---|---|
| `intro` | `intro-rich-text` | `product-page.rich-editor` |
| `benefits` | `feature-highlight` | `apps-page.section-be-af-image` |
| `how-to` | `how-to-steps` | `product-page.section-steps` |
| `use-case-group-heading` | `section-heading` | `product-page.rich-editor` |
| `use-case` | `use-case-alternating` | `apps-page.section-be-af-image` |
| `faq` | `faq` | `apps-page.section-faq` |

`use-case` 連續出現時，`sectionOrderLeft` 從 `01` 遞增、`sectionOrderRight` 為總數，
`textPosition` 依 pattern `default: alternate` 左右交替。

## 5. 媒體欄位

`media` 型欄位只能是下列三種之一：

| 值 | 意義 | push 工具行為 |
|---|---|---|
| `null` | 此 slot 不放素材 | 不處理 |
| 整數 | Strapi 既有 media id | 直接送出 |
| `{"$assetRef": "<ref>"}` | 待解析素材 | 依 ref 類型處理 |

`$assetRef` 格式：

- `strapi:<ref>` → 查 `strapi/media/shared-assets.json` 取得 id。
- `design-library:assets/<type>/<collection>/<file>` → 上傳 `design-library/assets/...` 後取得 id。
- `mock:<file>` → 上傳 `product-pages/<page>/source/mock-assets/<file>`；只允許在 draft，
  進入 `page-pm-review` 前必須全部換成 design-library 或 strapi 素材。

`content.sections[].media[]` 的 `slot` 對應 component 的 media 欄位路徑，例如
`sectionBeAfMedia.imageBeforeDesktop`。

## 6. CTA

- `content.hero.primaryCta` → `topBanner.buttonText[0].text`；`link` 若為空則 `null`。
- App badges：`page.source.yaml` 的 `appLinks.ios`／`android` 有值時，`topBanner.imageCTA`
  產生兩筆並使用 shared assets 的 badge。
- Section CTA 最多兩個（component `max: 2`），`newTab: true`、`ctaActivate: true`。
- 內部連結一律相對路徑 `/products/<pageKey>/result-photo`；外部連結必須是 `https://`。

## 7. 待 RD 確認事項

- 巢狀 component 的真實 uid（目前 `uidStatus: inferred`）。
- 更新既有 entry 時是否需保留巢狀 `id`；目前 create 流程一律移除。
- `backgroundColor` 完整允許值；`Layout`／`layout`／`buttonType` 的 enum。
- `/upload` 是否接受 admin JWT；若只接受 API token，改用 `STRAPI_ADMIN_TOKEN`。
