# Strapi push client

`tools/product-page/push-strapi.mjs` 是唯一會呼叫 Strapi 的程式。它：

1. 讀取 repo 根目錄 `.env`（gitignored）或環境變數；
2. 若有 `STRAPI_ADMIN_TOKEN` 直接使用，否則以 `STRAPI_ADMIN_EMAIL`／`STRAPI_ADMIN_PASSWORD`
   呼叫 `POST {STRAPI_ADMIN_URL}/admin/login` 取得 `data.token`；
3. 解析 payload 內所有 `$assetRef`：`strapi:` 查共用素材表，`design-library:`／`mock:`
   以 `POST {STRAPI_ADMIN_URL}/upload` 上傳後取得 media id；
4. `POST {STRAPI_ADMIN_URL}/content-manager/collection-types/<uid>` 建立 **draft** entry，
   或在 `--entry <id>` 時 `PUT …/<uid>/<id>` 更新既有 draft；
5. 把 request 摘要、entry id 與 admin 預覽網址寫到
   `product-pages/<page>/evidence/publish/<timestamp>.json`。

預設是 `--dry-run`：只解析素材、印出將送出的 payload 摘要，不打任何 API。
真正送出需要 `--confirm`，而且只能由 `/product-page-publish` workflow 在人類確認後執行。

```bash
npm run page:publish -- --page ai-motion-transfer            # dry run
npm run page:publish -- --page ai-motion-transfer --confirm  # create draft
npm run page:publish -- --page ai-motion-transfer --confirm --entry 404  # update draft 404
```

## 環境變數

複製 `strapi/client/.env.example` 到 repo 根目錄 `.env` 後填值。永遠不要把 `.env`、JWT
或帳密放進 repo、issue、聊天紀錄或 `refs/` 以外的任何地方。

## 已知限制

- 工具不會 publish；`publishedAt` 出現在 payload 會被 validator 擋下。
- `/upload` 是否接受 admin JWT 尚待 RD 確認；失敗時工具會列出未解析的 `$assetRef` 並停止，不會送出半套 entry。
- 多語系由既有 n8n「Strapi - ENU to Multi」流程處理：ENU draft 在 Strapi 內 publish 後
  才會觸發翻譯，這裡不重做。
