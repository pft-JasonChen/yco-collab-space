# Competitors

一個競品一個資料夾，從 `_template/` 複製。`pages/` 放公開頁面擷取的 markdown，
`analysis.md` 放 PM 的結論。競品資料只能用來支持我們的「定位／差異化」語句；
產品能力宣稱仍必須引用 `features/<feature>/product/**` 或 `products/<slug>/product.yaml`。

```bash
npm run library:product:capture -- --url https://example.com/product --to competitors/<slug>/pages/enu-product-2026-09-02.md
```

擷取只保留標題、段落與清單文字，並在檔頭記錄來源 URL 與時間。不要複製競品的圖片、
商標或整段文案到我們的頁面。
