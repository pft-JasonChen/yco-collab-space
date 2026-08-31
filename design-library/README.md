# Shared Design Library

Designer 只需要把 web-ready 素材放在固定類型與自訂 collection 下：

```text
assets/image/<collection>/
assets/video/<collection>/
assets/icon/<collection>/
assets/illustration/<collection>/
assets/logo/<collection>/
```

不需要手寫 manifest、asset ID 或程式碼。PM 或 Designer 在 feature 對話中告訴 Agent
要 index 哪個 collection；Agent 只掃該 collection，並在 prototype revision 固定實際
選用檔案與 hash。

`tokens/`、`components/`、`patterns/` 的正式格式仍待 Designer／RD pilot 決定。目前不要
在這些位置自行發明 schema。

完整 Library Browser 只供本機／private repo 使用，不會部署到 public prototype。
