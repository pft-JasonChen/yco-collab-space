# Cloud Storage 競品 UX 研究與 YCO 功能提案

- 研究日期：2026-09-14
- 研究者：Jason Chen（PM）+ Claude
- 研究方法：使用實際登入帳號，透過 Chrome 直接操作四家競品的 cloud storage 頁面
- 範圍限制：**不含 share / 協作功能**（依 PM 指示排除）

---

## 0. 證據等級與研究限制

誠實標注哪些是第一手觀察、哪些是推論，避免後續決策踩到錯誤前提。

| 競品 | 帳號等級 | 第一手觀察到的 | 未能觀察（推論或查證） |
|---|---|---|---|
| Picsart | Free | 完整 `/files` 頁面、篩選器、右鍵選單、容量數字、升級彈窗 | 付費後的 UI；容量滿的阻擋畫面 |
| Fotor | Pro+ | 完整 `My Library`、7 個分頁、62 項 Types、詳情頁、升級彈窗與比價表 | 免費帳號的 UI（資料夾鎖、30 天刪除通知） |
| CapCut | Pro | 完整 space 頁、Trash、訂閱彈窗、**Expand storage only** 購買流程與價格 | 免費帳號的 UI；容量滿的阻擋畫面 |
| Canva | Free | 完整 `/projects`、篩選器、右鍵選單、Trash、Billing 頁 | 付費後的 UI；容量滿的阻擋畫面 |

**三個已知的不確定點**

1. **CapCut 方案容量有矛盾。** 受測 Pro 帳號頁面顯示 `462.30MB / 1TB`，但官方說明頁寫 Pro 基礎為 100GB、Teams 1,000GB、可加購堆疊至上限 3,000GB。可能是地區 / 促銷 / 加購差異。兩個數字都列出，不擇一。
2. **Fotor 免費版資料夾限制是推論。** 依據是付費帳號上 `Create a Folder` 與 `Move to folder` 都掛著 🧡 premium 標記，且官方比價表「Project folders」欄位在 Basic 為空白、Pro 起才有 100/200/500。未在免費帳號上實測。
3. **四家的「容量已滿」阻擋畫面都沒有第一手畫面。** 無法在他人正式帳號上塞爆空間。此部分以各家的容量政策與升級入口設計推論。

---

## 1. Cloud Storage 頁面 UI Layout 結構

### 1.1 四家架構總覽

| 面向 | Picsart | Fotor | CapCut | Canva |
|---|---|---|---|---|
| 頁面名稱 | My files | My Library | user…'s space | All projects |
| 導覽層級 | 單層左側欄 | 左側欄 + 頂部內容分頁 | 左側欄（分組） | **雙層**：icon rail + 次級面板 |
| 內容分類方式 | 下拉篩選器 | **頂部分頁（7）** | 下拉篩選器（5）+ 頁面分區 | 下拉篩選器（7）+ 次級導覽 |
| 主要尋找方式 | 篩選 | 篩選 | 篩選 | **搜尋優先**（置中大搜尋框） |
| 容量指標位置 | 頭像選單內（隱藏） | 頁面右上（常駐） | **頁面標題旁（常駐）** | **完全沒有** |
| Grid 型態 | 等比均一格 | **Masonry 瀑布流** | 等比均一格 | 等比均一格 |
| Trash | **無** | 分頁 | 工具列按鈕 | 次級導覽底部 |

### 1.2 Picsart —— 極簡檔案總管

```
┌────────────────────────────────────────────────────────────┐
│ Picsart                              [Upgrade] 🔍 (avatar) │
├──────────────┬─────────────────────────────────────────────┤
│ Start new    │ My files                                    │
│ design       │                                             │
│ Create       │ [All files ▾][My Files ▾]  [↓Date Mod ▾][▤][+New]│
│ Discover     │                                             │
│▸Projects     │ Folders                        Show all     │
│ Brand Kit    │ ┌──────────┐                                │
│ Flow         │ │📁 AI Play│                                │
│ AI Playground│ │0 item・0B│                                │
│ AI Agents    │ └──────────┘                                │
│              │ Files                                       │
│              │ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐        │
│              │ └────┘└────┘└────┘└────┘└────┘└────┘        │
└──────────────┴─────────────────────────────────────────────┘
```

- **雙下拉分工明確**：第一個管「型別」（All files / Folders / Projects / Templates / Photos / Stickers / Videos / Fonts / Audio，共 9 項），第二個管「歸屬」（My Files / Shared With Me）。兩個獨立維度不混在同一個選單，心智模型乾淨。
- 排序：Date Modified / Date Created / Alphabetical。
- `+ New`：File Upload / New Folder / Google Drive。
- 卡片 meta 格式：`Project ・ 22.09 MB ・ 02.09.2026`（型別・大小・日期）。**唯一在卡片上直接顯示檔案大小的競品。**
- 列表檢視是真正的檔案總管欄位：Name / Type / Size / Date / ⋯。

### 1.3 Fotor —— 分頁式內容庫，篩選器最重

```
┌────────────────────────────────────────────────────────────┐
│ fotor [Library▾ Search ⌘K]  [Upgrade 30%][⚡950] (Pro+)     │
├──────────────┬─────────────────────────────────────────────┤
│ Home         │ Creations Projects Uploads Brand Kits       │
│ Create       │ Character Product Trash   ┌────────────────┐│
│ Product Vis. │                           │☁106.19MB/100GB││
│ Growth Vis.  │                           │▰▱▱▱▱▱▱▱▱▱▱▱▱▱ ││
│ Agent        │                           └────────────────┘│
│ Apps         │ [Media:All▾][Types:All▾][Status:All▾]        │
│ Community    │ [☐Collections]  [Create a Folder 🧡][Select] │
│▸My Library   │ Creations                        [Newest ▾] │
│              │ ┌────┐┌──────────┐┌────┐   ← masonry        │
│ Switch Prev  │ └────┘└──────────┘└────┘                    │
│ Settings     │ ┌──────┐┌──────┐┌────┐┌──────┐              │
└──────────────┴─────────────────────────────────────────────┘
```

- **每個分頁有自己的工具列**（強項）：
  - `Creations`：Media / Types / Status / Collections / Create a Folder / Select / Sort
  - `Uploads`：Formats / Create a Folder / Upload File / Select
  - `Projects`：Types / Create a Folder / Select / Newest created
- **Types 篩選器有 62 個 AI 工具選項**，長到內建搜尋框才能用：Agent Image、Text to Image、Image to Image、Face Swap、AI Backgroud(原文拼字錯誤)、AI Baby、AI Hairstyle、AI Art Effects、AI Expand、BG Remover、AI Upscaler、Virtual Model、Product Shot、AI Reshot、Love Story Comic、Poster Generator、AI Camera Shot Generator、Change Image Angles、Fashion Tech Deck、Group Photo Styler、Image Translator、Logo Designer、Portrait Master、AI Image Relight、Product Creative、Smart Listing、Ad Style Transfer、AI Multi-Scene Showcase、AI Pose Changer、AI Scene Replace、Product Retouching、Product Page Generator、Size Modifier、Product Review Template、Remove Filter from Photo Online、AI Travel Photo Generator、AI Headshot、Text to Video、Image to Video、Video to Video、Video Transform、Avatar、Face Mimic、Video Face Swap、Video Enhancer、Video Object Remover、Video BG Remover、Agent Video、Video Extend、Video Try-On、AI Marketing Video、Only Our Kiss、Mood Shot、Draw to Video、Matcha Filter、Matcha Filter Video、UGC Avatar、Product Video、Link to Video Ad、AI Music Generator、Text to Speech。
- Status 篩選器：All / Published / Unpublished（是否已發佈到 Fotor Community）。
- Creations 卡片**不顯示檔名**，純視覺。
- **詳情頁是四家最有商業意圖的設計**：左側大預覽 + 上下切換；右側標題（= 生成工具名）、日期、下載、☆ 收藏、⋯；`Detailed info: 1024 × 768`；底部一塊 **「Edit」再加工格**：AI Upscaler / Magic Layers / AI Expand / BG Remover / AI Replace / Magic Eraser / Image to Video / Agent。

### 1.4 CapCut —— 工作區（space）模型，容量最前面

```
┌────────────────────────────────────────────────────────────┐
│ CapCut                    [CapCut Pro] ⬇ 🗄 🔔 ❓ (avatar)  │
├──────────────┬─────────────────────────────────────────────┤
│ + Create new │ user1799…'s space  462.30MB/1TB  Upgrade ›  │
│ Home         │                     (avatars)[Invite][⚙]    │
│ ─ Create AI ─│ ┌───────────┐┌───────────┐┌───────────┐     │
│ Design Studio│ │▶Create    ││🖼Create   ││🎨Brand kit│     │
│ Video Studio │ │ video   + ││ image   + ││     [Free]│     │
│ Voice Studio │ └───────────┘└───────────┘└───────────┘     │
│ All tools    │ [Upload media▾][New folder][Trash] [All▾]…  │
│ ─ Templates ─│ Folders                                     │
│ Templates    │ Projects                                    │
│ Recent proj. │ Exported videos                             │
│ Share & sched│ Materials                                   │
└──────────────┴─────────────────────────────────────────────┘
```

- **容量數字與 `Upgrade ›` 貼在頁面標題右側**，是四家中唯一把「指標」與「行動」直接相鄰的設計。
- **在儲存頁裡放建立入口**（Create video / Create image / Brand kit），把倉庫變成起點。
- 篩選 `All`：All / Projects / Effects / Exported videos / Materials —— 只有 5 項，且是**生命週期語意**，不是工具名。
- `Upload media`：Upload file / Upload folder / **From phone** / Google Drive / Dropbox。
- 內容分區各自有語意化日期動詞：Projects「Created on」、Exported videos「Exported on」、Materials「Uploaded on」。
- 工具列 sticky，捲動時固定。

### 1.5 Canva —— 搜尋優先，雙層導覽

```
┌────────────────────────────────────────────────────────────┐
│ ▣│ Canva │ All projects  │           [👑Start free trial]  │
│ ＋│       │ Recents       │                                 │
│ AI│       │ Your projects▸│        All projects             │
│ 🏠│       │ Shared with you│                                │
│ 📁│       │ Available off. │   ┌──────────────────────┐    │
│ ▤ │       │ Manage links   │   │🔍 Search designs,    │    │
│ 🎨│       │ ┌────────────┐ │   │   folders and uploads│    │
│ 🖨│       │ │⭐Star tip  │ │   └──────────────────────┘    │
│ ⋯ │       │ └────────────┘ │ [Type▾][Category▾][Owner▾][Date▾]│
│   │       │                │              [↑↓][▤][+]       │
│   │       │ 🗑 Trash       │ Recents  ────────────────→     │
│ (e)│      │                │ Folders                       │
└───┴───────┴────────────────┴────────────────────────────────┘
```

- **搜尋框放在版面正中央、篩選器之上** —— 明確表態：規模大了以後，搜尋比分類更重要。
- `Type`：Any type / Folders / Designs / Brand Templates / Images / Videos / Files（7 項，物件模型語意）。
- `Category`：可搜尋，內容是**輸出格式** —— Instagram Post / Presentation / Doc / Poster… 對應「我要做什麼用途」，而不是「這是哪個工具做的」。
- `Recents` 是橫向 carousel 且可 `Hide section`（使用者可收合分區）。
- 有系統資料夾 `Uploads`。
- 卡片標題本身就是重新命名按鈕（inline rename）。

---

## 2. Cloud Storage 頁面功能 / CRUD 矩陣

| 功能 | Picsart | Fotor | CapCut | Canva |
|---|:--:|:--:|:--:|:--:|
| 建立資料夾 | ✅ | 🔒 付費 | ✅ | ✅ |
| 上傳檔案 | 檔案 / Google Drive | ✅ | 檔案 / 資料夾 / **手機** / GDrive / Dropbox | ✅ |
| 重新命名 | ✅ | ❌ | ✅ | ✅ **inline** |
| 移動到資料夾 | ✅ | 🔒 付費 | ✅ | ✅ |
| 複製 / 建立副本 | ✅ Duplicate | ❌ | ✅ Duplicate to | ✅ Make a copy |
| 下載 | 間接（Open with） | ✅ | ✅ | ✅ |
| 收藏 / 加星號 | ❌ | ✅ ☆ | ❌ | ✅ ⭐ |
| 分享 / 複製連結 | ✅ | ✅ | ✅ | ✅ |
| 刪除 | ⚠️ **永久刪除** | ⚠️ **永久刪除** | ✅ Move to Trash | ✅ Move to Trash |
| 回收桶 / 還原 | ❌ **無** | ✅ 有分頁 | ✅ **30 天 + 倒數** | ✅ **30 天 + 分型別** |
| 多選批次 | ✅ | ✅ | ✅ | ✅ |
| 再加工入口 | Open with ▸ | ✅ **8 工具格** | 開啟編輯器 | 開啟編輯器 |
| 詳細資訊 | 列表欄位 | 燈箱 + 尺寸 | — | Details + **瀏覽數** |
| 離線可用 | ❌ | ❌ | ❌ | ✅ |
| 另存為範本 | ❌ | ❌ | ❌ | 👑 付費 |

### 2.1 右鍵 / ⋯ 選單原文

**Picsart**（平鋪 8 項，無分組）
`Open with ▸` · `Move to` · `Duplicate` · `Rename` · `Select` · `Share with` · `Copy Link` · `Delete`

**Fotor**（卡片 hover）
`Download` · `Edit Image` · `Use in a Design` · `Move to folder 🧡` · `Delete`
（詳情頁的 ⋯ 只有 `Share` · `Delete` —— 連重新命名都沒有）

**CapCut**
標頭 `Created by user1799110745081`
`Rename` · `Share` · `Duplicate to` · `Multi-select` · `Move to` · `Move to Trash`

**Canva**（四家最完整，依意圖分 5 組）
標頭 `Mountain Trail Adventures ✏️` / `Mobile Video ・ By egg chen ・ Edited 1 month ago ・ 📊 0 visitors`
1. `Open in a new tab` · `Details` · `Save as template 👑`
2. `Make a copy` · `Download`
3. `Move` · `Share` · `Copy link`
4. `Make available offline`
5. `Move to Trash`

---

## 3. Upgrade Trigger（容量觸發升級）

### 3.1 四家的觸發設計

| 面向 | Picsart | Fotor | CapCut | Canva |
|---|---|---|---|---|
| 容量可見性 | 頭像選單內 | 頁面常駐 | **標題列常駐** | **看不到** |
| 容量是否可點 | ✅ 點了開升級彈窗 | ❌ 純顯示 | ✅ 旁邊就是 Upgrade › | — |
| 常駐升級按鈕 | 黑色 Upgrade pill | Upgrade 30% Off + 20% Off | CapCut Pro 徽章 | 👑 Start your free trial |
| 功能內嵌鎖 | ❌ | ✅ 🧡 標記在功能旁 | ❌ | ✅ 👑 標記在選單項旁 |
| 彈窗主打 | **點數**（storage 排第 11 條） | 點數 + 完整比價表 | 訂閱 / **或只買空間** | 範本與 AI 額度 |
| 補差價顯示 | ❌ | ✅ Subtotal / Remaining value / Payment due | ❌ | ❌ |
| 只買空間 | ❌ | ❌ | ✅ **Expand storage only** | ❌（改賣 AI Pass） |

### 3.2 Picsart：入口對了，訊息錯了

點頭像 → 選單顯示 `0 credits left ›` 與 `57.01 MB / 100 MB used ›` 兩列，皆可點。
點容量列 → 開啟 **Upgrade your plan** 彈窗：

- Pro：$15 → **$10.5/mo**（年繳），500 credits/month，~100 Nano Banana Pro / ~83 Seedance 2.5 影片
- Ultra：$75 → **$60/mo**（年繳，per seat），2,500 credits/month，滑桿可選 1,500 / 2,500 / 5,000 / 10,000 / 10,000+

**問題**：使用者是因為「空間」點進來的，但彈窗主視覺是點數與 AI 模型，`100 GB of cloud storage` 排在 Pro 條列第 11 項、`300 GB of cloud storage per seat` 排在 Ultra 第 12 項。**入口訊息與落地訊息不一致**，轉換率會被自己吃掉。

### 3.3 Fotor：把「整理」本身變成付費牆

- 🧡 標記直接掛在 `Create a Folder` 與 `Move to folder` 上 —— 免費使用者**不能整理自己的檔案**。
- 升級彈窗有完整比價表，且有兩條獨立的儲存槓桿：

| 欄位 | 意義 |
|---|---|
| `Cloud Storage` | 容量（512MB / 2GB / 100GB / 500GB） |
| `Creations Storage Duration` | **保存天數**（Basic 30 天 → 付費 Unlimited） |
| `Project folders` | **資料夾數量上限**（— / 100 / 200 / 500） |

- 補差價透明：`Subtotal NT$4284` / `Remaining value NT$−490.6` / `Payment due NT$3793.4`。這是四家唯一做到的，中途升級摩擦最低。

### 3.4 CapCut：唯一把「只買空間」獨立出來的設計

點標題旁 `Upgrade ›` →

**第一層：訂閱**
```
Join ◆ Pro                     user1799110745081 [Pro]
✓ advanced AI-powered editing  Expires on 2026/09/27
✓ Free use of all paid features   Manage auto-renewal | Redeem code
✓ Unlock and edit all templates
✓ 1200 monthly credits         Choose plan
✓ desktop, mobile, and web     ○ NT$490.00 /Monthly
✓ Cancel anytime               ○ NT$4490.00 /Yearly

                               [    Purchase →    ]
                                Expand storage only   ← 第二層入口
```

**第二層：只買空間**
```
user1799…'s space          ‹  Select your plan          ✕
462.30MB of 1TB used          ┌ 10GB ┬ 100GB ┬ 1000GB ┐
▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱          [ Monthly | Yearly ]
Will expire on 2026/09/27
[Manage auto-renewal]         ⦿ $0.99 / One-month
      ☁                       [   Purchase now   ]
✓ Multiple formats of media
✓ Backup and saving safety
✓ Large backup storage
```

**容量包價格（實測）**

| 容量 | 月繳 | 年繳 |
|---|---|---|
| 10 GB | $0.99 | — |
| 100 GB | $1.99 | — |
| 1,000 GB | $6.99 | $59.99 |

官方說明頁補充：容量包可**堆疊**在既有方案上，總容量上限 3,000 GB。

### 3.5 Canva：完全不談容量

- 容量指標在產品裡**任何地方都找不到** —— 不在頭像選單、不在 Settings、不在 Billing 頁。
- Billing 頁計量的是 **AI usage**：「Your monthly usage · Resets on Oct 1 / 0% used」+ `👑 Get more`。
- 加購賣的是 **AI Pass**（40× Pro 的 AI 量），**不賣空間**。
- 結論：Canva 把升級槓桿完全押在 **AI 額度與素材庫**，容量只是附帶條款。使用者只有在「撞牆」那一刻才會知道有上限。

---

## 4. UX Flow：Free User 情境與 Pro 優勢

### 4.1 容量階梯對照

| 方案層級 | Picsart | Fotor | CapCut | Canva |
|---|---|---|---|---|
| Free | **100 MB** | **512 MB**（+ 30 天後刪除） | ~5 GB | **5 GB** |
| 入門付費 | Pro 100 GB<br>$10.5–15/mo | Pro 2 GB<br>NT$1,290/yr | Pro 100 GB（官方）<br>／1 TB（實測）<br>NT$490/mo・NT$4,490/yr | Pro 100 GB<br>NT$3,600/yr |
| 進階 | Ultra 300 GB/seat<br>$60–75/mo | Pro+ 100 GB<br>NT$2,500/yr | Teams 1,000 GB | Business 500 GB<br>NT$6,300/yr/人 |
| 最高 | — | Max 500 GB<br>NT$4,284/yr | 加購可堆疊至 3,000 GB | Enterprise 1 TB |
| Free → 入門倍數 | **1,000×** | 4×（Pro）／200×（Pro+） | 20×（官方）／200×（實測） | 20× |
| 單買空間 | ❌ | ❌ | ✅ | ❌ |

### 4.2 Free User 會遇到的四種情境

**情境 A：一開始就不夠用（Picsart）**
100 MB 在 AI 影片時代等於「存不了東西」。受測帳號已用 57.01 MB —— 只是幾張圖加兩個專案。使用者感受不是「我用完了」，而是「**這個功能好像沒做完**」。免費層若小到不像一個層級，它就不會產生升級慾望，只會產生離開。

**情境 B：東西會自己消失（Fotor）**
Basic 是 512 MB **且只保存 30 天**。使用者上個月生成的圖，這個月回來找不到了。這對「雲端」兩個字的信任傷害最大 —— 不是空間不夠，是**東西不見了**。

**情境 C：不能整理（Fotor）**
免費使用者不能建資料夾、不能搬檔案。結果是免費使用者的空間永遠是一坨。這個設計的邏輯是「用混亂逼你付費」，但實際效果通常相反：混亂的人不會升級，他們會停止累積。

**情境 D：看不到儀表板（Canva）**
5 GB 不算小，但完全不揭露。使用者第一次知道有上限，是在**某個動作被擋下來的當下**。這是體驗最突兀的一種 —— 沒有預警、沒有心理準備、正在做事的時候被打斷。

### 4.3 升級 Pro 除了空間變多，還有什麼？

**四家共同的主要賣點（空間都不是主打）**

| 類別 | 具體內容 |
|---|---|
| **AI 用量** | 點數 / 月額度（Picsart 500→2,500、Fotor 1,200→12,000/yr、CapCut 1,200/月、Canva 10×→20×） |
| **併發與批次** | Fotor 併發生成 1→10→30→50；Picsart 批次編輯 50→100 張；Canva 批次生成 |
| **輸出品質** | **去浮水印**（Fotor Basic 是 watermarked JPG/PNG/PDF）、HD、透明 PNG、4K、CMYK 印刷檔 |
| **模型取用** | 頂級模型解鎖（Picsart 140+ 模型、Fotor Exclusive AI Model Access） |
| **素材庫** | Canva 4.7M→141M 素材、1.6M→3.6M 範本；Picsart Getty 影片庫 |
| **品牌資產** | Brand Kits（Canva 1→5→100→1000、Fotor 多組、Picsart 3+→10+） |
| **代理 / 自動化** | Picsart 15+ AI agents、CLI、MCP（Claude Code / Cursor / ChatGPT）；Fotor Agent chats 50→10,000 |
| **組織能力** | Fotor 資料夾數 0→100→200→500 |
| **保存期限** | Fotor 30 天 → Unlimited |
| **體驗** | 無廣告、優先佇列、優先客服、離線（Canva） |

**結論：沒有任何一家用「空間」當升級主訴求。** 空間是 supporting benefit，主訴求永遠是「你能產出更多、更好、更快」。這對 YCO 的定價敘事很重要 —— 空間應該是 Pro 的**信任基礎**，而不是 Pro 的**賣點**。

---

## 5. UX 設計優缺點分析

### 5.1 Picsart

**優點**
- 認知負擔最低：一頁、兩區、9 項篩選，全部一眼掃完。
- 型別與歸屬拆成兩個獨立下拉，心智模型乾淨。
- 列表檢視是真的檔案總管（含 Size 欄），**唯一在卡片上顯示檔案大小**的競品 —— 使用者要清空間時，這是唯一有用的資訊。
- 支援 Google Drive 匯入。

**缺點**
- **沒有回收桶。** `Delete` 在 hover 選單裡，一鍵永久刪除。四家中刪除風險最高。
- 容量藏在頭像選單，使用者不會主動發現。
- 100 MB → 100 GB 的 1,000× 落差，讓免費層像 demo 而不是方案。
- 沒有收藏 / 星號，無法標記重要檔案。
- 升級彈窗訊息與入口不一致（見 3.2）。

### 5.2 Fotor

**優點**
- 容量常駐頁面。
- **每個分頁配自己的工具列** —— 篩選維度貼合內容型別，是正確的資訊設計。
- **詳情頁的「Edit」再加工格是四家最好的商業設計**：把儲存頁從墳場變成工具漏斗入口。
- **兩條獨立儲存槓桿**（容量 × 保存期限）—— 變現面更大。
- 升級彈窗有補差價計算，誠實且降低摩擦。
- Masonry 保留原始比例，視覺辨識快。

**缺點**
- **62 項的 Types 篩選器，需要內建搜尋框才能用。** 一個篩選器如果需要搜尋，代表分類法已經失效了。工具數量會一直長，這個設計不可持續。
- **把「整理」關進付費牆** —— 反效果（見 4.2 情境 C）。
- 詳情頁 ⋯ 只有 Share / Delete，連改名都沒有。
- 工具列同時有 7 個分頁 + 3 個篩選 + Collections 勾選 + 資料夾 + 選取 + 排序，密度過高。
- Creations 卡片沒有檔名，無文字可掃、可搜。
- 選項有拼字錯誤（`AI Backgroud`），品質訊號不佳。

### 5.3 CapCut

**優點**
- **容量 + 升級同處標題列** —— 指標與行動相鄰，是四家最好的升級觸發位置。
- **`Expand storage only` 把容量與訂閱解耦** —— 只想要空間的人不必被推銷整套訂閱，$0.99 的入門價幾乎無決策成本。
- 分類用**生命週期語意**（Projects / Effects / Exported videos / Materials），只有 5 項且會隨工具增加而穩定。
- **回收桶四家最好**：明示「保留 30 天」政策橫幅 + 每張卡片紅色倒數（`Less than 1 day`）+ 用 `Date moved` 排序。
- 語意化日期動詞（Created / Exported / Uploaded on），零成本提供脈絡。
- 儲存頁內建 Create video / Create image 入口 —— 倉庫也是起點。
- `From phone` 上傳，正視行動端現實。

**缺點**
- Materials 顯示原始雜湊檔名（`4a965833243146ac98cc1165d858…`），完全不可讀。
- 單一長捲動四個分區，分區不可收合，內容多時很難navigate。
- 對單人免費用戶而言，「space + Invite members」的工作區框架過重。
- 官方文件（Pro 100GB）與實際帳號（1TB）不一致，方案溝通混亂。

### 5.4 Canva

**優點**
- **搜尋優先**，是規模化後的正確答案 —— 分類法有上限，搜尋沒有。
- **⋯ 選單四家最好**：依意圖分 5 組、付費項目就地標 👑、破壞性動作獨立在最後一組。
- **Inline rename** —— 標題本身就是控制項，改名最快。
- 收藏 ⭐ + 教學提示卡（告訴使用者星號怎麼用）。
- 次級導覽的語意 scope（Recents / Your projects / Shared / Available offline / Manage links）。
- Trash 依內容型別分頁，空狀態直接教育 30 天政策。
- `Category` 篩選對應**輸出用途**（Instagram Post / Presentation / Doc），符合使用者的目的語言。
- 分區可收合，Recents 用 carousel。

**缺點**
- **容量完全不揭露** —— 連 Billing 頁都沒有。四家透明度最差，使用者只能靠撞牆發現上限。
- 空間**無法單獨購買**，唯一路徑是整包升級方案。
- 雙層導覽吃掉不少水平空間。
- Recents carousel 把項目藏在畫面外緣。

### 5.5 ELI5：用最白話的方式解釋這些設計

> 以下用生活化比喻說明，方便和非設計背景的同事對齊。

**Cloud Storage 頁面是什麼？**
它是你的**衣櫃**。你做的每件衣服（AI 生成結果）、買回來的布料（上傳素材）、還在車縫的半成品（專案）都掛在裡面。衣櫃的工作只有兩件事：**讓你找得到東西**，以及**讓你放得下東西**。

**容量表是什麼？**
是車子的**油表**。油表存在的價值不是告訴你「現在幾公升」，而是讓你**在還來得及的時候決定要不要加油**。Canva 把油表拆掉了 —— 車子照樣會沒油，只是你會在高速公路中間才發現。CapCut 把油表和加油站放在同一個位置，這是對的。

**Upgrade trigger 是什麼？**
是**油量警示燈**。好的警示燈有三個特性：太早亮很煩、太晚亮沒用、亮的時候要告訴你加油站在哪。所以 Picsart 的問題是：警示燈亮了，你按下去，它卻帶你去看新車型錄（點數方案），沒帶你去加油站。

**容量 vs 保存期限，差在哪？**
容量是**冰箱多大**，保存期限是**食物放幾天會壞**。Fotor 免費版兩個都限制：冰箱小（512MB），而且東西 30 天會自己消失。冰箱小你還能理解，東西自己消失會讓你**再也不敢把重要的東西放進去** —— 這是對「雲端」信任的根本性破壞。

**分類 vs 搜尋，該押哪邊？**
分類是**抽屜**，搜尋是**問管家**。東西少的時候抽屜比較快（伸手就拿到）；東西多到一定程度，再多抽屜也沒用，你只會忘記放哪個抽屜 —— 這時候「問管家」才快。Fotor 做了 62 個抽屜，多到需要一個「找抽屜的抽屜」；Canva 直接請管家站在門口。**兩者不是二選一，而是有交叉點**：東西少時給抽屜，東西多時給管家。

**回收桶是什麼？**
是「**垃圾還沒拿去倒**」。使用者需要的不是垃圾桶本身，而是**後悔的權利**。Picsart 沒有回收桶，等於刪除鍵旁邊沒有安全栓 —— 而它就放在 hover 選單裡，滑鼠隨便一滑就到了。CapCut 更進一步，在每袋垃圾上寫「還有 X 天車會來收」，使用者知道自己有多少時間後悔。

**點數（credits）和空間（storage）有什麼不一樣？**
點數是**電影票**，空間是**停車位**。買票才能看電影（才能生成），有車位才能把車停著（才能保存）。兩者**不能互相取代**：買 100 張電影票不會讓你多一個車位。這就是為什麼 CapCut 把「只買空間」拆出來是對的 —— 有些人已經有票了，他只是需要一個車位。

**給非設計同事的一句話總結**
> 儲存空間的 UX 不是在設計一個倉庫，是在設計一段**信任關係**：使用者願不願意把作品交給你保管。透明（看得到用量）、可回復（刪錯救得回來）、不設陷阱（整理不用付費）、不會自己消失（不設保存期限），這四件事一旦有一件做不到，使用者就會開始在本機另存一份 —— 那一刻起，你的雲端就只是一個中繼站，不是他的資產庫。

---

## 6. YCO Cloud Storage 功能提案

> 前提：YCO 需同時容納 **AI 生成結果（唯讀成品）** 與 **可繼續編輯的專案**。
> 範圍：**不含 share / 協作功能**。

### 6.1 六條設計原則（每一條都對應一個競品教訓）

| # | 原則 | 來源 |
|---|---|---|
| P1 | **容量永遠可見。** 常駐在頁面標題列，不藏在選單裡。 | 學 CapCut，避開 Canva |
| P2 | **分類用生命週期，不用工具名。** 工具會一直增加，生命週期不會。 | 學 CapCut，避開 Fotor 的 62 項 |
| P3 | **整理功能永不收費。** 資料夾、收藏、搬移、改名，免費版全開。 | 避開 Fotor |
| P4 | **刪除必須可回復。** 30 天回收桶 + 卡片上倒數。 | 學 CapCut，避開 Picsart |
| P5 | **儲存頁是入口，不是終點。** 每個項目都有「繼續加工」路徑。 | 學 Fotor 的 Edit 格 |
| P6 | **升級入口貼著用量指標。** 觸發點與行動點不能分開。 | 學 CapCut，避開 Picsart |

### 6.2 資訊架構（三層）

**第一層：內容類別（頂部分頁，4 個，固定不再增加）**

| 分頁 | 收什麼 | 為什麼獨立 |
|---|---|---|
| **專案** | 有畫布狀態、可再編輯 | 使用者對它的意圖是「繼續做」 |
| **生成結果** | AI 產出的唯讀成品 | 使用者對它的意圖是「用它 / 再加工」 |
| **素材** | 使用者上傳的原始檔 | 使用者對它的意圖是「拿來用」 |
| **回收桶** | 30 天內可還原 | 安全網 |

**第二層：篩選（每個分頁不同維度，學 Fotor 的分頁工具列，但收斂數量）**

| 分頁 | 篩選維度 |
|---|---|
| 專案 | 尺寸/比例、狀態（草稿 / 已匯出）、日期 |
| 生成結果 | 媒體（圖 / 影片 / 音訊）、**工具家族**、日期 |
| 素材 | 格式、來源（上傳 / 手機 / 雲端硬碟）、日期 |

**關鍵決策：工具篩選必須分組成家族，上限 8 組。**
Fotor 的 62 項會隨工具數量無限增長。YCO 應先分家族，第二層才是工具名：

```
人像美型 ▸ 影片生成 ▸ 商品情境 ▸ 修圖擴圖 ▸ 風格生成 ▸ 音訊
```

新工具上線時歸入既有家族，篩選器永遠只有 6–8 項。**這是本提案最重要的單一架構決策。**

**第三層：使用者自訂組織（全部免費）**
資料夾（可巢狀）・⭐ 收藏・全站搜尋（⌘K，跨三個分頁）

### 6.3 版面配置

```
┌──────────────────────────────────────────────────────────────┐
│ YCO   [🔍 搜尋 ⌘K]        ⚡320 點數  ☁3.2/5 GB 升級›  (avatar)│
├───────────┬──────────────────────────────────────────────────┤
│ + 建立     │  我的空間                                        │
│ 首頁       │  ☁ 3.2 GB / 5 GB  ▰▰▰▰▰▰▱▱▱▱   [管理空間] [升級›] │
│ 工具       │                                                  │
│▸我的空間   │  ┌────────────┐┌────────────┐┌────────────┐      │
│ 範本       │  │ ＋ 新增專案 ││ ⬆ 上傳素材  ││ 📱 從手機匯入│      │
│           │  └────────────┘└────────────┘└────────────┘      │
│           │  ── 專案 │ 生成結果 │ 素材 │ 回收桶 ──────────    │
│           │  [媒體▾][工具家族▾][日期▾]  [新增資料夾][選取][⇅][▤]│
│           │  資料夾                                           │
│           │  ┌────┐┌────┐                                     │
│           │  └────┘└────┘                                     │
│           │  內容                                             │
│           │  ┌────┐┌────┐┌────┐┌────┐┌────┐                  │
│           │  └────┘└────┘└────┘└────┘└────┘                  │
└───────────┴──────────────────────────────────────────────────┘
```

**刻意的取捨**
- 容量出現**兩次**：header chip（全站常駐）+ 頁面容量條（進入儲存頁時的完整資訊）。重複是刻意的 —— 前者是餘光可見，後者是決策資訊。
- 建立入口放在儲存頁上方（學 CapCut），讓空的儲存頁也有下一步。
- 搜尋放 header 而非頁面中央（與 Canva 不同）：YCO 的分類只有 4 個分頁，規模還沒到需要搜尋主導；但 ⌘K 全域可用，規模長大後可無痛把它升級成主導元素。

### 6.4 卡片與詳情

**卡片**
```
┌─────────────────┐
│ ☐            ☆ ⋯│  ← hover 才出現
│                 │
│   [縮圖]  00:12 │  ← 影片顯示時長 / 圖片顯示尺寸
│                 │
└─────────────────┘
  山景影片擴展        ← 點擊即可 inline 改名（學 Canva）
  影片・22.1 MB・09/02  ← 型別・大小・日期（學 Picsart 顯示大小）
```

**檔案大小必須顯示在卡片上。** 這是 Picsart 唯一做對而其他三家都漏掉的事 —— 當使用者被要求「清理空間」時，沒有大小資訊他根本無從下手。

**⋯ 選單（依意圖分組，學 Canva）**
```
開啟          詳細資訊
───────────────────────
建立副本      下載
───────────────────────
重新命名      移動到資料夾      加入收藏
───────────────────────
移至回收桶
```

**詳情面板（學 Fotor 的 Edit 格，但做得更明確）**
```
┌──────────────────────┬───────────────────┐
│                      │ 山景影片擴展        │
│                      │ 影片生成・09/02     │
│      [大預覽]         │ 1920×1080・22.1 MB │
│                      │ ⬇ 下載  ☆ 收藏  ⋯  │
│      ˄  ˅            │                   │
│                      │ ── 繼續加工 ──      │
│                      │ 🔍畫質提升  ✂去背   │
│                      │ ⬌ 擴展畫面  🎬轉影片 │
│                      │ 🎨風格轉換  🔊配音   │
└──────────────────────┴───────────────────┘
```
「繼續加工」的工具**依內容型別動態決定**（圖片 / 影片 / 音訊給不同組合），且顯示每個動作會消耗的點數。

### 6.5 容量的四個狀態（升級觸發核心）

| 狀態 | 用量 | 視覺 | 出現位置 | 文案 | 行動 |
|---|---|---|---|---|---|
| **S1 正常** | 0–74% | 中性灰容量條 | 常駐 | `3.2 GB / 5 GB` | 無 |
| **S2 提醒** | 75–89% | 琥珀色容量條 | 常駐 + hover tooltip | `快滿了，還剩 1.2 GB` | `管理空間` |
| **S3 警告** | 90–99% | 橘色容量條 + 頁面橫幅 | 進入儲存頁時常駐橫幅 | `空間剩下 5%。清理一些檔案，或擴充空間以繼續儲存新作品。` | `管理空間` `擴充空間` |
| **S4 阻擋** | 100% | 紅色 + 動作當下的 modal | 儲存 / 生成的當下 | `空間已滿，這次的生成結果無法儲存。` | `管理空間` `+100 GB` `升級 Pro` |

**兩個關鍵設計主張**

1. **每一個狀態都必須同時提供「清理」與「付費」兩條路。**
   只給付費選項會讓使用者覺得被勒索。給了清理選項，反而讓選擇付費的人是真心覺得值得 —— 這對留存與客訴量的影響比短期轉換率更重要。

2. **必須提供「管理空間」檢視。** 四家競品都沒做好這件事。
   ```
   管理空間                            已用 4.8 GB / 5 GB
   [依大小排序 ▾]  已選 3 項，可釋放 820 MB   [移至回收桶]
   ─────────────────────────────────────────────────
   ☑ 山景影片擴展_final.mp4    影片   412 MB   3 個月前
   ☑ 商品情境_v2.mp4           影片   280 MB   3 個月前
   ☑ 人像去背_原檔.png          圖片   128 MB   5 個月前
   ☐ 專案：夏季廣告             專案    64 MB   昨天
   ```
   預設依**大小遞減**排序（不是日期），因為使用者此刻的目標是「快速釋放空間」，不是「回顧作品」。

### 6.6 購買流程

**兩條路徑，同一個入口（採用 CapCut 的兩層模式）**

```
觸發（S2 / S3 / S4 或主動點容量列）
   │
   ▼
┌─────────────────────────────────────────────────┐
│ 你目前用了 4.8 GB / 5 GB                          │
│ ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱                            │
│                                                 │
│ ┌── 路徑 A：升級 Pro ──────────────────────────┐ │
│ │ 100 GB 空間 + 無浮水印 + 2,000 點數/月 + …    │ │
│ │ [ 月繳 NT$XXX ]  [ 年繳 NT$XXX  省 XX% ]     │ │
│ │ [           升級 Pro           ]             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│              只擴充空間 →   ← 路徑 B 入口         │
└─────────────────────────────────────────────────┘
   │
   ▼ （路徑 B）
┌─────────────────────────────────────────────────┐
│ ‹  選擇容量                                   ✕  │
│    ┌ +10 GB ┬ +100 GB ┬ +1 TB ┐                │
│    [ 月繳 | 年繳 ]                              │
│    ⦿ NT$XX / 月                                │
│    現有 5 GB + 100 GB = 105 GB                  │  ← 明示疊加後總量
│    [          立即購買          ]               │
└─────────────────────────────────────────────────┘
   │
   ▼
付款 → 成功頁 → **自動回到剛才被中斷的動作**
```

**四個差異化細節（競品都沒做好）**

1. **疊加後總量要算給使用者看**（`現有 5 GB + 100 GB = 105 GB`）。CapCut 的容量包會堆疊，但購買當下沒有把加總結果說清楚。
2. **補差價要透明。** 中途升級時顯示 `小計 / 既有方案剩餘價值 / 實付金額`（學 Fotor，這是四家唯一做到的）。
3. **成功後自動恢復被中斷的動作。** 若使用者是在「生成影片」時被 S4 擋下，購買完成後應直接把那次生成接續完成，而不是丟回儲存頁讓他自己重來。**四家都沒做，這是最有感的差異化點。**
4. **明示續約與到期日**（學 CapCut 的 `Will expire on` + `Manage auto-renewal`），降低訂閱焦慮與退款客訴。

### 6.7 YCO 免費層建議

| 項目 | 建議 | 理由 |
|---|---|---|
| 容量 | **5 GB** | 對齊 CapCut / Canva。不要學 Picsart 的 100 MB —— 小到像故障，只會趕走人。 |
| 保存期限 | **不限期** | 不要學 Fotor 的 30 天。東西自己消失會摧毀對「雲端」的根本信任。 |
| 資料夾 / 收藏 / 搬移 / 改名 | **全開** | 不要學 Fotor 鎖整理功能。整齊的免費用戶累積得更多、看得到用量成長，升級的理由才誠實。 |
| 回收桶 | **30 天** | 業界標準，且是信任基礎。 |
| 匯出 | 加浮水印 / 標準解析度 | 這才是該放的付費牆 —— 它限制的是「產出」，不是「保管」。 |

**核心主張：付費牆應該放在「產出」，不該放在「保管」與「整理」。**
使用者可以接受「免費版輸出有浮水印」，但很難接受「免費版不能整理自己的東西」或「東西會被刪掉」。前者限制的是價值交付，後者傷害的是信任。

### 6.8 Pro 的完整價值主張（空間只是其中一項）

參考四家的共同結構，YCO Pro 建議包含：

- **AI 用量**：點數大幅提升、併發生成數提升
- **輸出**：無浮水印、4K / 原始解析度、透明背景
- **模型**：進階模型取用、優先運算佇列
- **效率**：批次處理、範本儲存
- **保管**：100 GB 空間、保留原始檔（raw）、版本歷史
- **體驗**：無廣告、優先客服

**排版建議**：容量放在條列**中段偏後**，與四家做法一致 —— 它是信任基礎，不是購買理由。但**升級彈窗若是從容量觸發進入，第一行必須先回答容量**（這是 Picsart 犯的錯，務必避開）。

### 6.9 建議追蹤的指標

| 指標 | 為什麼重要 |
|---|---|
| 免費用戶進入 S2 / S3 / S4 的比例 | 驗證 5 GB 的門檻是否設對 |
| 各狀態的轉換率 | 預期 S4 意圖最高但情緒最差，需觀察客訴與退訂 |
| 「清理」vs「付費」的選擇比 | 若清理遠高於付費，代表容量設太小或價值感不足 |
| 購買後恢復中斷動作的完成率 | 驗證 6.6 的差異化設計是否有效 |
| 容量包 vs 訂閱的購買組合 | 決定未來資源該投在哪條路徑 |
| 「繼續加工」格的點擊率 | 驗證 P5（儲存頁作為工具入口）是否成立 |

### 6.10 提案前需要先確認的事

1. **YCO 的平均資產大小是多少？** 5 GB 這個數字是對齊競品得出的，但若 YCO 以影片生成為主，單支 4K 影片可能就 200 MB —— 5 GB 只能存 25 支。需要用實際資料回推。
2. **「生成結果」與「專案」的儲存計費方式？** 專案若包含所有中間素材，佔用會遠大於成品。需決定是否分開計量、或專案只計最終狀態。
3. **工具家族怎麼切？** 6.2 提的六族是示意，需要用 YCO 實際工具清單重新歸納，並確認新工具的歸類規則。

---

## 附錄：資料來源

**第一手操作（2026-09-14，Chrome + 實際登入帳號）**

- Picsart `/files`（Free）
- Fotor `/cloud/creations`、`/cloud/uploads`、`/cloud/projects`、`/cloud/trash`、`/pricing`（Pro+）
- CapCut `/my-cloud/<id>`、`/my-cloud/<id>/trash`（Pro）
- Canva `/projects`、`/folder/trash`、`/settings/billing-and-teams`、`/pricing`（Free）

**次級來源**

- [CapCut — How Much Storage Expansion Does Space Support?](https://www.capcut.com/help/space-storage)
- [CapCut Standard vs Pro – Full Comparison Guide](https://www.capcut.com/resource/capcut-standard-vs-pro)
- [Picsart Pricing 2026 (Flowith)](https://flowith.io/blog/picsart-pricing-free-vs-plus-vs-pro-plan/)
- [Picsart Help Center — subscription types](https://support.picsart.com/hc/en-us/articles/360002232017-What-types-of-subscriptions-does-Picsart-offer)
