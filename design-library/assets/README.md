# Asset folders

第一層只能是 `image`、`video`、`icon`、`illustration`、`logo` 或 `font`。第二層是 Designer
自訂的 collection 名稱，例如 `video/dance`。Collection 內可以再放 `desktop/`、
`mobile/`、`posters/` 等子資料夾。

`font` 僅接受 `.woff` 與 `.woff2`。Pilot 中的 RD icon font 必須保留來源 hash；它是
暫時的 production-parity input，未取代後續 Designer/RD canonical SVG icon pipeline。

沒有 feature 引用的素材可以留在 Library，不需要額外登記，也不會進 public build。
