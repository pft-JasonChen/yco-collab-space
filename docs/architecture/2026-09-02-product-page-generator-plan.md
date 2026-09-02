# Product Page Generator — 架構與流程（product-page track）

> 狀態：PM 於 2026-09-02 確認方向後實作；fixture 為 AI Character Motion Transfer。
> 精簡討論版（含流程圖）：`2026-09-02-product-page-track-discussion.md`；待辦 handoff：`docs/handoff/2026-09-02-product-page-opus-handoff.md`。
> 本文件描述如何在既有 `yco-collab-space` 上加一條 **product-page track**，
> 讓 PM、Designer、RD 各自維護自己的 library 與 skill，並用同一套 agent 流程把
> 功能 spec 變成 Strapi draft。

## 1. 一分鐘版本

```text
features/<feature>/product/**   (PM 功能 spec，與 prototype track 共用，不重複上傳)
product-library/**              (PM：現有產品、競品、messaging、reviewer rubric、spec-to-content skill)
design-library/patterns/product-page/**   (Designer：section pattern ↔ Strapi component ↔ token 綁定、page-layout skill)
strapi/**                       (RD：component registry、content-type、共用素材、mapping rules、content-to-strapi skill)
        │
        ▼  /product-page-generate <page>   （任一角色觸發，流程相同）
product-pages/<page>/generated/
  content.json ──► review/spec-compliance.json (獨立 reviewer subagent, 不同 model)
  layout.json
  strapi-payload.json
  generation.json (所有輸入 hash、skill 版本、builder/reviewer model)
        │
        ▼  /product-page-publish <page>   （人工確認後）
Strapi draft entry  →  evidence/publish/<ts>.json (entry id、admin preview URL)
```

角色隔離靠路徑所有權（`collab-space.map.yaml` workflows 的 writablePaths／protectedPaths），
不靠「誰按下指令」。A 改了自己的 skill 或 library，B 下次執行時自然採用，因為
generation.json 綁定所有輸入的 hash；任何一份輸入變動都會讓上一版 generated 變 stale。

## 2. 對既有 repo 的改動（全部追加式）

| 檔案 | 改動 | 為什麼 |
|---|---|---|
| `collab-space.map.yaml` | 新增 `track: product-page` 的 5 個 stage、6 個 transition、8 個 artifact、1 個 system（`strapi-admin`）、6 個 workflow、3 個 rule、2 個 index | 單一控制面，沿用 actors 與 enforcement 模型 |
| `tools/collab-space/schemas/collab-space-map.schema.json` | 可選欄位 `track`、indexes 可選 `productLibrary`／`strapiRegistry` | 舊資料無 `track` 時視為 `prototype` |
| `tools/collab-space/policy.mjs` | `{page}` 路徑展開、`trackOf`／`stagesForTrack`／`transitionsForTrack`、跨 track transition 檢查 | 兩條 track 共用 policy 函式 |
| `tools/collab-space/stage-policy.mjs` | feature release 只接受 prototype track 的 stage | 避免 feature 誤用產品頁 stage |
| `tools/collab-space/generate-reference.mjs` | 依 track 分組輸出 | 文件仍由契約生成 |
| `tools/prototype-cli/validate-inputs.mjs` | `intake` 階段且無 generated code 的 feature 只做 intake-level 檢查 | 允許「只有 spec、沒有 prototype」的 feature 作為產品頁上游 |
| `package.json` | 新增 `page:*`、`library:product:*` scripts；`validate` 尾端串 `page:validate` | build 一併驗證產品頁 |
| `.gitignore` | `product-pages/*/evidence/` | push 紀錄含環境資訊 |
| `agent-adapters/model-policy.example.json` | 新增 `specComplianceReview` | reviewer 必須與 builder 不同 model |
| `README.md`、`COLLABORATION.md`、`AGENTS.md`、`design-library/patterns/README.md` | 各加一段指向本 track | 入口說明 |

`features/**`、`platform/**`、既有 tools 的行為都沒有被刪改。

## 3. 三個角色各自擁有什麼

| 角色 | 擁有的路徑 | 提供什麼 | 對應 skill |
|---|---|---|---|
| PM | `features/<f>/product/**`、`product-library/**`、`product-pages/<p>/source/**` | 功能 spec、現有產品與競品 library、brand voice／claim rules、reviewer rubric、頁面 brief | `product-library/skills/spec-to-content` |
| Designer | `design-library/patterns/product-page/**`、`design-library/skills/**` | 每種 section 的 pattern：綁 Strapi component、允許的 layout 選項、token、文案長度、素材規格 | `design-library/skills/page-layout` |
| RD | `strapi/**` | component uid 與欄位、content-type、共用 media id、mapping rules、push client | `strapi/skills/content-to-strapi` |
| Agent | `product-pages/<p>/generated/**`、`evidence/**` | 三階段產物、review、provenance | — |

### Design token ↔ Strapi component 綁定

`design-library/patterns/product-page/<pattern>.yaml`：

```yaml
strapiComponent: apps-page.section-be-af-image   # 必須存在於 strapi/registry.yaml
layoutOptions:
  textPosition: { values: [left, right], default: alternate }   # 只能用 component 的 layoutFields 與 enum
tokens:
  title: { fontSize: --font-size-heading-2, color: --text-strong }  # 必須存在於 tokens.lock
copy:  { title: { maxChars: 60 } }
media: { sectionBeAfMedia.imageBeforeDesktop: { required: true, aspectRatio: "4:3" } }
```

`npm run page:binding` 把這些綁定攤平成 `.collab-cache/strapi-registry-index.json`，
agent 在生成前讀它，就同時知道「這個 section 長什麼樣」與「背後送哪個 component、哪些欄位」。

## 4. Harness：怎麼確保沒有超出 PM spec

| 層 | 機制 | 抓什麼 |
|---|---|---|
| Deterministic（`page:validate`） | 每個 claim／bullet／step／FAQ 必須有 `sourceRefs`，且檔案與標題／key 真的存在、在本頁 upstream 範圍內 | 無來源的句子、引用不存在的段落、引用別的 feature |
| | 競品檔不能是產品能力的唯一來源 | 把競品功能寫成我們的 |
| | pattern／component／enum／token／長度／必填／forbidden 欄位 | 自創 component、超出 Designer 限制、`publishedAt` |
| | generation.json 的 inputHash、artifact hash、registry／patterns／token lock hash | 任何角色改了輸入後仍沿用舊產物 |
| Independent review | 另一個 model 的 subagent 依 `spec-compliance-rubric.md` 逐句對照 spec，寫 `review/spec-compliance.json`；驗證 reviewer≠builder、`contentHash` 與 content 一致、無 blocker | 語意上超出 spec、矛盾、無來源數字、語氣 |
| Source guard | `page:update:begin`／`check` 快照所有 protected paths | 生成過程偷改 spec／library／registry |
| Stage gate | `page:stage:transition` 綁定 evidence hash；review 未過、有 mock 素材、無 publish evidence 都擋 | 未審核就往下走 |
| Mutation tests | `tools/product-page/policy.test.mjs` 植入 12 種錯誤，validator 必須全部抓到 | validator 自己失效 |

## 5. Strapi 端（RD 提供的事實）

- Strapi v4 admin API：`POST {STRAPI_ADMIN_URL}/admin/login` → `data.token`；
  `POST /content-manager/collection-types/api::yce-product-page.yce-product-page` 建 entry。
  這與既有 n8n「Strapi - ENU to Multi」流程使用的端點相同。
- payload = content-type attributes（無外層包裝），media 欄位是數字 id；
  生成階段用 `{"$assetRef": "…"}` 佔位，push 時解析／上傳。
- 目前 registry 內的巢狀 component uid 是從既有 payload 反推（`uidStatus: inferred`），
  RD 對照 Strapi schema 後改為 `confirmed`。
- 自動化只建 draft；publish 與多語翻譯仍在 Strapi 內由人觸發。

## 6. 指令速查

```bash
npm run page:create -- <page> "<Title>"        # 骨架
/product-page-brief <page>                      # PM 確認 brief
/product-page-generate <page>                   # content → review → layout → payload → validate
/product-page-review <page>                     # 單獨重跑 reviewer
npm run page:validate -- --page <page>          # deterministic gates
npm run page:publish -- --page <page>           # dry run
/product-page-publish <page>                    # 人工確認後建 Strapi draft
/product-page-promote <page> <stage>            # evidence-bound 階段核准
npm run page:binding                            # component ↔ pattern ↔ token 綁定表
npm run library:product:index                   # product-library index
npm run library:product:capture -- --url … --to competitors/<slug>/pages/<name>.md
```

## 7. 尚未完成／待各角色確認

- RD：確認 inferred uid、`backgroundColor`／`Layout`／`buttonType` 的完整 enum、更新 entry 時是否保留巢狀 id、`/upload` 是否接受 admin JWT。
- Designer：把 7 個 provisional pattern 對照 Figma，確認 token 與素材規格；上傳 `assets/video/ai-motion-transfer`。
- PM：確認 `messaging/*` 與 rubric 草稿；補齊競品 library；為真實產品頁補限制（clip 長度、解析度、credits）。
- 平台：多語系仍交給 n8n；workflow eval（隔離 workspace 跑整條 generate）可沿用 `tools/evaluation/workspace.mjs` 後續加入。

## 8. 判斷依據

- 產品頁與 prototype 共用 `features/<f>/product/**`，PM 只寫一次 spec。
- 把 skill 放在各角色的 library 裡，而不是集中在 `.claude/`，所有權才能用同一套路徑規則保護。
- reviewer 只讀 rubric、spec、library 與 content.json，不讀 builder 的推理或 payload，避免被說服。
- 先做 deterministic 來源檢查，再做語意 review：機械檢查便宜且可重現，語意 review 抓機械檢查抓不到的「合理但 spec 沒說」。
