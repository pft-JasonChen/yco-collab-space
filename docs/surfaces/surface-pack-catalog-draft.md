# Surface Pack 候選清單（PM 編輯草案）

> 狀態：Draft，尚未成為 generator gate。  
> Owner：Prototype Platform Owner／PM。  
> 用途：提供新 feature 的起始 layout、components 與參考證據；不是允許建立的頁面白名單。

## 1. 先修正一個核心假設

新 feature 不一定已經存在對應的 surface。Surface Pack 不能放在 Intake 之前，也不能要求每個 feature 一定選到一個既有 pack。

正確流程是：

```text
需求 Intake
  → 理解新功能的目標、流程、資訊層級與使用情境
  → 選擇 surface strategy
      ├─ reuse：以一個既有 pack 為起點
      ├─ hybrid：混合一個主要 pack 與其他 pack／module
      └─ novel：沒有合適 pack，建立 feature-specific 暫時版 surface intent
  → PM 確認
  → 生成 prototype
```

因此，Surface Pack 是「參考食譜」，不是「只能從菜單選一道菜」。

## 2. 三種 surface strategy

### 2.1 `reuse`

新功能與既有頁面骨架高度相似。沿用 pack 的 shell、主要區域、responsive 規則與基礎 components，再針對 feature 調整內容與互動。

例：新的照片修圖功能，以 `workspace/tool-photo-editing` 為起點。

### 2.2 `hybrid`

新功能有可辨識的主要 shell，但需要借用其他 pack 或 module。

例：以 Product Page 為主要頁面，但 Hero 內嵌一個簡化的 Image Generator 體驗。

### 2.3 `novel`

沒有任何現有 pack 能合理代表新功能。Intake 直接產生 feature-specific `surface-intent.yaml`，記錄暫時版 UI 的：

- 資訊層級；
- 必要 zones；
- 可借用的既有 components；
- 主要互動與 state；
- responsive 優先順序；
- 與既有 YCO pattern 不同的地方；
- PM 採用這個暫時結構的判斷依據。

`novel` 不會阻擋 PM review。它只表示這個 prototype 不能用既有 surface 的視覺相似度當作主要評分基準，需要依功能、design-system compliance、可用性與主管 review 判斷。

## 3. Pack 的建議內容

每一個正式 Surface Pack 應包含：

```text
platform/surfaces/<family>/<name>/<version>/
├── surface.yaml              # ID、版本、shell、zones、狀態
├── layout-rules.md           # layout 與 responsive 規則
├── component-slots.yaml      # 必要／選用 component roles
├── evaluation.yaml           # DOM anchors、layout assertions、visual rubric
├── provenance.json           # 來源、擷取日、Figma node、審核狀態
└── references/
    ├── desktop.webp
    ├── compact-desktop.webp
    └── tablet.webp
```

Pack 只能引用 RD authoritative token 名稱，不包含另一套 token value。

## 4. 候選 Surface Pack 清單

以下由舊 repo 的 surface taxonomy 整理而來，但舊 production screenshots、Figma node 與 component 規則都必須重新查證後，才可以變成新 repo 的 authoritative pack。

### A. Marketing surfaces

| Pack ID | 起始 layout | 主要 component roles | 目前建議狀態 |
|---|---|---|---|
| `marketing/home-anonymous` | Header → Hero → feature showcase → CTA → Footer | Navigation, Hero, Feature cards, CTA, Footer | 有舊參考；待重新擷取 production |
| `marketing/home-authenticated` | Header → recent tools → recommendations → quick actions | Auth navigation, Avatar, Tool cards, Tabs | 有舊 Figma 線索；待查證現況 |
| `marketing/product-page` | Header → feature hero／demo → use cases → proof → CTA → Footer | Hero, Demo entry, Use-case cards, Testimonial, CTA, Footer | 第一批建議實作 |
| `developer/api-product` | Developer hero → capabilities → code examples → CTA／pricing | Hero, Tabs, Code block, Search, CTA, Footer | 舊資料不足；暫不 authoritative |
| `developer/api-product-search` | API Product shell＋documentation/search area | Search, Result list, Tabs, Code block | 舊資料不足；暫不 authoritative |

### B. Workspace／Tool surfaces

| Pack ID | 起始 layout | 主要 component roles | 目前建議狀態 |
|---|---|---|---|
| `workspace/tool-photo-editing` | Header＋tool rail＋inspector＋image canvas＋canvas controls | Upload, Tool navigation, Slider, Toggle, Before/after, Zoom controls | 第一批建議實作 |
| `workspace/tool-ai-portrait` | Header＋inspector＋portrait result canvas | Upload, Presets, Intensity controls, Processing, Result | 舊參考不足；保留候選 |
| `workspace/tool-image-generator` | Header＋wide prompt inspector＋result gallery | Prompt input, Style selector, Generate CTA, Processing, Result gallery | 第一批建議實作 |
| `workspace/tool-video` | Header＋inspector＋video canvas／player | Upload, Settings, Progress, Player, Export CTA | 第一批建議實作 |
| `workspace/tool-ai-agent` | Header＋conversation／task intake＋working result area | Message thread, Composer, Tool calls, Result preview, Actions | 屬於新形態；應先以 hybrid／novel pilot |
| `library/gallery` | Header → filter/search → justified asset grid → pagination | Search, Filters, Thumbnail, Selection, Empty state, Pagination | 有舊參考；待重新擷取 production |

### C. Commerce surfaces

| Pack ID | 起始 layout | 主要 component roles | 目前建議狀態 |
|---|---|---|---|
| `commerce/pricing-page` | Header → tier comparison → feature matrix → CTA | Pricing cards, Comparison table, CTA, FAQ | 舊資料不足；保留候選 |
| `commerce/pricing-overlay` | Modal／drawer → current entitlement → plan options → CTA | Modal, Plan cards, Benefit list, CTA | 可作為 overlay pack，不一定是完整頁面 |
| `commerce/checkout` | Order summary＋payment／billing form＋confirmation | Form, Summary, Validation, Alert, CTA | Prototype 必須保持假資料，不串金流 |

### D. Account／Auth surfaces

| Pack ID | 起始 layout | 主要 component roles | 目前建議狀態 |
|---|---|---|---|
| `account/member` | Account navigation＋profile／plan／billing sections | Avatar, Tabs, Cards, History table, CTA | 舊資料不足；保留候選 |
| `account/auth` | Auth panel／overlay＋validation／recovery | Form, Password hint, Validation, Alert, Modal | 可作為 page 或嵌入式 flow |

### E. Content、promotional 與 reusable modules

這一組大多不是獨立完整頁面，應當作 decorator／module 加到主要 surface，不應強迫 feature 把它選成 primary pack。

| Pack ID | 用途 | 主要 component roles | 目前建議狀態 |
|---|---|---|---|
| `content/whats-new` | 新功能公告 panel／modal | Announcement card, Media, CTA, Modal | Module candidate |
| `content/promo-banner` | 頁面頂部促銷訊息 | Banner, Countdown／copy, CTA, Dismiss | Module candidate |
| `content/seasonal-skin` | 既有 surface 的季節裝飾 | Decorative assets, Theme mapping | 不能改變核心 brand／behavior |
| `content/marketing-grid` | Product／Homepage 共用的 marketing grid | Grid, Cards, Media, CTA | Module candidate |

## 5. 不再建立 `Other` pack

`Other` 容易變成「沒有理解需求也可以繼續」的逃生門。新架構改用 `novel` strategy，並要求清楚記錄：

- 為什麼既有 packs 都不適用；
- 暫時版 UI 的結構；
- 借用了哪些既有 components；
- 哪些決策需要主管或 Designer 後續確認。

## 6. Feature 如何引用 pack

### Reuse 範例

```yaml
schemaVersion: 1
strategy: reuse
temporary: true
primaryPack:
  id: workspace/tool-image-generator
  version: 2026-08
borrowedPacks: []
deviations: []
decisionBasis:
  - The feature follows prompt to processing to generated-result behavior.
```

### Hybrid 範例

```yaml
schemaVersion: 1
strategy: hybrid
temporary: true
primaryPack:
  id: marketing/product-page
  version: 2026-08
borrowedPacks:
  - id: workspace/tool-image-generator
    roles:
      - embedded-demo
deviations:
  - The generator is embedded in the hero instead of opening a separate tool route.
decisionBasis:
  - Management review must cover both the marketing story and the core interaction.
```

### Novel 範例

```yaml
schemaVersion: 1
strategy: novel
temporary: true
primaryPack: null
borrowedPacks: []
layoutIntent:
  zones:
    - task-intake
    - live-working-state
    - structured-result
  responsivePriority:
    - Preserve the task result before secondary controls.
decisionBasis:
  - No current YCO surface supports this workflow without forcing an incorrect mental model.
```

## 7. 從 feature-specific pattern 升級成 pack

Novel prototype 不會自動變成共用 pack。只有符合以下條件時才考慮升級：

1. 主管已核准該結構，或 PM 明確指定它是未來基準；
2. 行為與 layout roles 已穩定；
3. 通過 token、responsive、accessibility 與 browser evaluation；
4. 已出現第二個可重用案例，或 Platform Owner 明確判斷值得提前沉澱；
5. 涉及 Designer 最終流程時，Designer 已看過並同意相關視覺規則。

## 8. 版本規則

- Feature 必須 pin 明確 pack version，不能只寫 `latest`。
- Production style 更新時新增版本，不覆寫舊版本。
- Catalog 可以指定新的 default，但既有 feature 不會自動升級。
- Pack reference 必須保存本地 snapshot 與 provenance，不能在生成當下只依賴會變動的 live URL。

## 9. 判斷依據

- 新功能本來就可能沒有現成頁型；若 pack 是必要輸入，流程會在最需要探索時停止。
- 既有 layout 與 components 仍然有價值，適合當作可組合的起點，而不是固定模板。
- `reuse／hybrid／novel` 能同時避免 generic AI UI，也保留真正創新的空間。
- Feature pin 版本可維持歷史可重現；新的 production style 不會讓舊 prototype 無預警改變。
- 將成功的 novel pattern 延後升級成 pack，可避免只用過一次就過度抽象化。
- Surface 定義 layout intent，不重新定義 RD token value，因此不會產生第二套 design-token source of truth。

