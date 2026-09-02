# SOP — 從 RD snapshot 把共用元件整合進 Collab Space

> **狀態：** 已驗證流程。2026-09-02 以 `icon-action-buttons` 走過一遍，2026-09-03 以
> `constants.js`／`ratioTypes.js` 的 verbatim 還原再驗一次。
> **適用：** Platform Owner、Agent。Designer 與 RD 在第 5、6 步 review。
> **workflow：** `component-foundation-pilot`（可寫 `design-library/components`、
> `design-library/assets`、`platform/ui`、`platform/rd-baseline`、`.storybook`、
> `tools/design-library`、`docs`；不可寫 `features/*/product`、`features/*/generated`、
> `platform/tokens/rd`）。

---

## 何時走這份 SOP

只有在 intake 的 `componentReuse[]` 把某個 component role 解析為 **`new-shared`**、
且 Platform Owner 同意時。role 解析為 `existing-component` 就直接用；解析為
`feature-only` 就留在 `generated/`。

**不要**因為「現成的長得不太一樣」就開新元件 —— 先確認是不是加一個 prop 就能解決。

---

## 六個步驟

### 1. 確認它在 RD 是共用元件，不是單頁私有

```bash
cd <rd-snapshot>
grep -rn "<ComponentName>" src/ | grep -v "<其所在資料夾>"
```

- **兩處以上 import** → 它是共用元件，可以進 `design-library/components`。
- **只有一處** → 它是那個 feature 的私有元件。搬過來只會製造假的共用層；改在
  `generated/` 內實作，並在 `componentReuse[]` 記成 `feature-only`。

`icon-action-buttons` 通過這關的證據：`history-videos/result-video` 與 `next-action`
兩處都 import 它。

### 2. 讀原始碼，把內容分成三堆

| 堆 | 內容 | 處置 |
|---|---|---|
| **可攜** | presentation、互動、狀態語意（例如 like／dislike 互斥、再點取消） | 原樣保留，這是元件的價值 |
| **要替換** | redux、`public/` 資產路徑、`getTranslationFunction()`、Next.js `Image`／`Link` | 換成 props、Design Library collection、module-level store 等價物 |
| **要丟棄** | countly analytics、cross-module routing、auth、download service、task polling | 完全移除，並在 `removedDependencies` 逐項列出 |

**判準：** 替換品必須保留 RD 的**語意**，不是只保留外觀。`icon-action-buttons` 的
reaction store 用 `useSyncExternalStore` 依 `videoId` 收斂，就是為了複製 redux
`toggleVideoHistoryReaction` 的「card 與 dialog 對同一結果看法一致」語意。

### 3. 搬資產並登錄 provenance

```bash
cp <rd>/public/assets/images/<...>/<file>.svg design-library/assets/icon/<collection>/
shasum -a 256 <rd>/public/assets/images/<...>/<file>.svg
```

在 `design-library/assets/<type>/<collection>.provenance.yaml` 逐檔記
`name` / RD `path` / `sha256`。漏登錄的檔案之後沒有任何 gate 會發現它換過。

### 4. 寫實作與 story

```text
platform/ui/<id>/
  <Component>.jsx
  <Component>.module.scss
  <Component>.stories.jsx
  index.js
```

- 只使用 `platform/tokens/rd/**` 已存在的 CSS variable。缺 token 就記進
  `design/design-gaps.yaml`，**不要自創數值**。
- 所有使用者可見字串都是 props，預設值保留英文。共用元件不呼叫 `t()`。
- story 要涵蓋 `publicApi.states` 列出的每一個狀態。

### 5. 寫 component contract

`design-library/components/<id>/component.yaml`：

| 欄位 | 怎麼填 |
|---|---|
| `rd.sourcePaths` / `sourceHashes` | 每一個參考過的 RD 檔案，`shasum -a 256` 實算 |
| `rd.portability` | `verbatim`／`drop-in`／`reference`，見下表 |
| `rd.verbatimFiles` | 只有 `verbatim` 才填；每個 pair 的 `baseline` 必須也在 `sourceHashes` 裡 |
| `implementation.removedDependencies` | **逐項列出丟掉了什麼**。這是 RD 接手時最先看的欄位 |
| `publicApi` | props 與 states |
| `tokens.uses` | 用到的 CSS variable |
| `decisionBasis` | 為什麼這樣拆、替換品保留了什麼語意 |

**portability 怎麼判：**

| 等級 | 判準 |
|---|---|
| `verbatim` | 檔案本身零框架依賴（CSS module、純 JS 常數／純函式／資料表），兩邊逐字相同 |
| `drop-in` | React 元件，RD 只需改 import alias、接回 `t()`／redux 即可使用 |
| `reference` | 結構與 production 差異大（例如 shell、layout），RD 用自己的實作 |

**`verbatim` 要同時 vendor baseline：**

```bash
mkdir -p platform/rd-baseline/<snapshot>/<rd 原路徑的目錄>
cp <rd>/<rd 原路徑> platform/rd-baseline/<snapshot>/<rd 原路徑>
```

並在 `migration/rd-snapshot-manifest.json` 的 `vendoredBaseline.files` 登錄。
`validate:rd-parity` 會拒絕沒有被任何 contract 認領的 baseline 檔案。

### 6. 讓既有元件 compose 它，然後跑完整 gate

```bash
npm run validate:components
npm run validate:rd-parity
npm run test:storybook
npm run prototype:record -- <feature> --adapter <adapter> --model <model>
npm run validate
npm run build
npm run test:rendered -- --feature <feature>
```

如果新元件取代了某個既有元件裡的重複實作（`icon-action-buttons` 取代
`VideoHistory` 與 `VideoInfoDialog` 各自的按鈕列），**同一個 PR 要一起改**，
並且把舊的 SCSS 收斂成只管自己剩下的部分 —— 否則較高 specificity 的舊選擇器
會蓋掉新共用元件的樣式。

---

## 停止條件

遇到以下情形，停下來提 Platform Owner 決策，不要自行繼續：

- RD 那支元件只有一個地方用（見第 1 步）。
- 拿掉 production 依賴後，剩下的東西已經不成一個元件。
- 需要新的 design token 才能忠實重現。
- 要標 `verbatim` 但檔案有框架依賴 —— 那應該是 `drop-in`。
- RD 端同一份檔案已有多個版本／分支，無法確定哪個是基準。

---

## 反面教材

| 事件 | 教訓 |
|---|---|
| `Button.module.css` 曾為了過 axe 對比檢查，把 `--text-inverse-strong` 換成 `--text-strong`，而檔頭仍宣告與 RD verbatim | 宣告 verbatim 就不能有 Collab Space 專屬的修改。要偏離就改 portability 等級並記錄，不要偷偷改 |
| `video-trim-modal/constants.js` 在移植時把 `snapTrimRangeToDisplayedDuration` 改名成 `snapRange`、刪掉全部註解 | 純 JS 檔案沒有改名的理由。改名讓 RD 無法逐檔比對，也丟掉了原作者寫下的判斷依據 |
| `VideoHistory` 與 `VideoInfoDialog` 各自刻了一排 like／dislike／download | 第 1 步就會發現 RD 早有唯一擁有者。跳過第 1 步的代價是兩份會各自漂移的實作 |

---

## 決策判斷依據

- **先確認共用性，再談移植。** 把單頁元件搬進 `design-library/components` 會產生假的共用層，之後每個 feature 都要繞過它。
- **`removedDependencies` 是契約而不是註解。** RD 接手時要知道少了什麼才能補回去；漏列一項就是一個隱藏的整合缺口。
- **verbatim 必須 vendor baseline。** 只靠外部 snapshot 路徑，別人 clone 之後 gate 就形同虛設。
- **共用元件不呼叫 `t()`。** 文案走 props 讓元件保持純粹，Storybook 也不需要 i18n context；RD 端接自己的 `t()` 反而更直接。
