import { useEffect, useRef, useState } from "react";
import index from "virtual:surface-index";
import config from "../../../prototype.config.json";
import styles from "./Surfaces.module.scss";

const labels = {
  planned: "尚未定義",
  provisional: "待人工審查",
  approved: "已審查",
  deprecated: "已淘汰",
};
const href = (key, preview = false) =>
  config.routes.surfacePrefix +
  "/?" +
  new URLSearchParams({ pack: key, ...(preview ? { preview: "1" } : {}) });

export default function SurfaceBrowser() {
  const params = new URLSearchParams(window.location.search);
  const initial = index.versions.find((p) => p.key === params.get("pack"));
  const [selected, setSelected] = useState(initial?.key ?? null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [viewport, setViewport] = useState("responsive");
  const pack = index.versions.find((p) => p.key === selected);
  const detailRef = useRef(null);
  useEffect(() => {
    if (pack) {
      detailRef.current?.scrollIntoView({ block: "start" });
      detailRef.current?.focus({ preventScroll: true });
    }
  }, [pack]);
  const entry = index.entries.find((e) => e.id === pack?.id);
  const visible = index.entries.filter((e) => {
    const versions = index.versions.filter((p) => p.id === e.id);
    return (
      e.id.toLowerCase().includes(query.toLowerCase()) &&
      (status === "all" || e.status === status) &&
      (kind === "all" || kind === e.kind) &&
      (availability === "all" ||
        (availability === "preview"
          ? versions.some((p) => p.bindings?.preview)
          : !versions.some((p) => p.bindings?.preview)))
    );
  });
  const choose = (key) => {
    setSelected(key);
    window.history.replaceState(null, "", href(key));
  };
  const previewWidth = config.viewports.find((v) => v.name === viewport)?.width;
  return (
    <main className={styles.browser}>
      <header className={styles.heading}>
        <div>
          <a href="/">← Prototype features</a>
          <p className={styles.eyebrow}>
            YCO COLLAB SPACE · PM / DESIGN REVIEW
          </p>
          <h1>Surface Browser</h1>
          <p>從全貌到真實元件，檢查每個 surface 的結構、採用與缺口。</p>
        </div>
        <span className={styles.badge}>Synthetic data only</span>
      </header>
      <div className={styles.stats}>
        {[
          [index.entries.length, "登錄項目"],
          [index.versions.length, "已定義版本"],
          [
            index.versions.filter((v) => v.bindings?.preview).length,
            "可預覽版本",
          ],
          [
            index.entries.filter((e) => e.status === "planned").length,
            "尚未定義",
          ],
          [
            index.entries.filter((e) => e.status === "approved").length,
            "已審查",
          ],
        ].map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className={styles.filters}>
        <label>
          搜尋
          <input
            type="search"
            value={query}
            placeholder="搜尋 surface 名稱"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          狀態
          <select
            aria-label="狀態"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">全部狀態</option>
            {Object.entries(labels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          類型
          <select
            aria-label="類型"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="all">全部類型</option>
            <option value="surface">Surface</option>
            <option value="module">Module / Pattern</option>
          </select>
        </label>
        <label>
          預覽
          <select
            aria-label="預覽"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="all">全部</option>
            <option value="preview">可預覽</option>
            <option value="missing">尚無預覽</option>
          </select>
        </label>
      </div>
      <p role="status">
        顯示 {visible.length} / {index.entries.length} 個項目
      </p>
      <div className={styles.cards}>
        {visible.map((e) => {
          const versions = index.versions.filter((p) => p.id === e.id);
          const latest = versions.find((p) => p.version === e.defaultVersion);
          const users = [
            ...new Set(
              versions.flatMap((p) => p.adopters.map((a) => a.feature)),
            ),
          ];
          return (
            <article className={styles.card} key={e.id}>
              <div className={styles.cardTop}>
                <span>{e.kind}</span>
                <span>{labels[e.status]}</span>
              </div>
              <h2>{e.id}</h2>
              <p>
                {latest?.bindings?.preview
                  ? "可互動預覽 · 尚待審查"
                  : versions.length
                    ? "已定義 · 尚無完整預覽"
                    : "尚未定義 · 只有 catalog 登錄"}
              </p>
              <p>採用：{users.join("、") || "無 feature 直接採用"}</p>
              <p>組合：{latest?.composedBy.join("、") || "無 pack 組合"}</p>
              {versions.length > 0 && (
                <button
                  className={styles.control}
                  onClick={() => choose((latest ?? versions[0]).key)}
                >
                  檢視定義與預覽
                </button>
              )}
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <p className={styles.empty}>
          沒有符合條件的 surface。請調整搜尋或篩選。
        </p>
      )}
      {params.has("pack") && !initial && !pack && (
        <p role="alert">找不到指定版本，請從清單選擇。</p>
      )}
      {pack && (
        <section
          ref={detailRef}
          tabIndex={-1}
          className={styles.detail}
          aria-label="Surface 詳情"
        >
          <div className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>SURFACE DETAIL</p>
              <h2>{pack.id}</h2>
            </div>
            <label>
              版本
              <select
                aria-label="版本"
                value={pack.key}
                onChange={(e) => choose(e.target.value)}
              >
                {index.versions
                  .filter((v) => v.id === pack.id)
                  .map((v) => (
                    <option value={v.key} key={v.key}>
                      {v.version}
                      {v.version === entry?.defaultVersion ? "（預設）" : ""}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <p>
            {labels[pack.status]} · shell：{pack.shell}
            （語意分類，不是元件路徑）
          </p>
          <p>
            此版本採用：
            {pack.adopters
              .map(
                (a) =>
                  `${a.feature} (${a.relationship}${a.roles.length ? ": " + a.roles.join(", ") : ""})`,
              )
              .join("、") || "無"}
          </p>
          <p>
            宣告組合：{pack.composes.join("、") || "無"} · 被組合：
            {pack.composedBy.join("、") || "無"}
          </p>
          {pack.bindings?.preview ? (
            <>
              <div className={styles.toolbar}>
                <a href={href(pack.key, true)} target="_blank" rel="noreferrer">
                  開啟獨立預覽 ↗
                </a>
                <label>
                  畫面尺寸
                  <select
                    aria-label="畫面尺寸"
                    value={viewport}
                    onChange={(e) => setViewport(e.target.value)}
                  >
                    <option value="responsive">符合容器</option>
                    {config.viewports.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} · {v.width}px
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p>
                元件示範，非正式產品頁。未實作區域見下方表格；預覽不代表 RD 或
                Designer 已核准。
              </p>
              <div className={styles.frameScroll}>
                <iframe
                  key={pack.key}
                  title={`${pack.key} preview`}
                  src={href(pack.key, true)}
                  style={{ width: previewWidth ?? "100%" }}
                />
              </div>
            </>
          ) : (
            <p className={styles.empty}>
              此版本沒有完整實作，暫不產生推測版面。
            </p>
          )}
          {["zones", "slots"].map((namespace) => (
            <div key={namespace} className={styles.tableWrap}>
              <h3>
                {namespace === "zones"
                  ? "Zones · 結構區域"
                  : "Slots · 元件角色"}
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>名稱</th>
                    <th>必要</th>
                    <th>說明</th>
                    <th>目前實作／缺口</th>
                  </tr>
                </thead>
                <tbody>
                  {pack[namespace].map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.required ? "是" : "否"}</td>
                      <td>{row.description}</td>
                      <td>
                        {pack.bindings?.[namespace]?.[row.id]?.component ??
                          pack.bindings?.[namespace]?.[row.id]?.unimplemented ??
                          "未指定"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <details>
            <summary>Layout rules</summary>
            <pre>{pack.layoutRules}</pre>
          </details>
        </section>
      )}
    </main>
  );
}
