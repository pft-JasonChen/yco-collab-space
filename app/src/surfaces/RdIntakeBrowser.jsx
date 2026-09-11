import { useState } from "react";
import intake from "virtual:rd-intake";
import config from "../../../prototype.config.json";
import styles from "./Surfaces.module.scss";

export default function RdIntakeBrowser() {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("ai-video");
  const [kind, setKind] = useState("all");
  const visible = intake.candidates.filter(
    (c) =>
      (scope === "all" || c.pilot) &&
      (kind === "all" || c.suggestion === kind) &&
      c.root.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main className={styles.browser}>
      <header className={styles.heading}>
        <div>
          <a href={config.routes.surfacePrefix + "/"}>← Surface Browser</a>
          <h1>RD 待人工定義</h1>
          <p>
            {intake.fileCount} 個來源／資料檔 · {intake.candidates.length}{" "}
            組候選。分類是靜態建議，尚未核准或移植。
          </p>
        </div>
        <span className={styles.badge}>待 PM · Designer · RD 定義</span>
      </header>
      <section aria-label="AI Video 試點">
        <h2>{intake.pilot.title}</h2>
        <p>{intake.pilot.scope}</p>
        <p>
          <a
            href={
              config.routes.featurePrefix + "/" + intake.pilot.feature + "/"
            }
          >
            操作現有 Video Expansion 完整試點
          </a>
        </p>
        <div className={styles.cards}>
          {intake.pilot.phases.map((phase) => (
            <article className={styles.card} key={phase.id}>
              <h3>{phase.title}</h3>
              <p>PM：{phase.pm}</p>
              <p>Designer：{phase.designer}</p>
              <p>可重用元件：{phase.components.join("、")}</p>
              <a
                href={
                  config.routes.surfacePrefix +
                  "/?" +
                  new URLSearchParams({ pack: phase.pack })
                }
              >
                檢視對應 Surface／Pattern
              </a>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.detail} aria-label="來源候選">
        <h2>候選清單</h2>
        <div className={styles.filters}>
          <label>
            搜尋候選
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            盤點範圍
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="ai-video">AI Video 相關（含共用候選）</option>
              <option value="all">全部來源</option>
            </select>
          </label>
          <label>
            建議分類
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="all">全部</option>
              {["surface", "module", "component", "supporting-code"].map(
                (k) => (
                  <option key={k}>{k}</option>
                ),
              )}
            </select>
          </label>
        </div>
        <p role="status">
          顯示 {visible.length} / {intake.candidates.length} 組候選
        </p>
        <p>
          Pattern 是 module
          的重用規則；需比較多個情境後人工提煉。依賴提示不是完整依賴分析。
        </p>
        <div className={styles.cards}>
          {visible.map((c) => (
            <article className={styles.card} key={c.id}>
              <span className={styles.badge}>待人工定義 · {c.suggestion}</span>
              <h3 style={{ overflowWrap: "anywhere" }}>{c.root}</h3>
              <p>
                {c.fileCount} 個檔案 · 依賴提示：
                {c.signals.join("、") || "未檢出（需 RD 確認）"}
              </p>
              {c.unresolvedFiles > 0 && (
                <p>{c.unresolvedFiles} 個檔案需人工補依賴分析</p>
              )}
            </article>
          ))}
        </div>
        {visible.length === 0 && (
          <p className={styles.empty}>沒有符合條件的候選，請調整搜尋或篩選。</p>
        )}
      </section>
    </main>
  );
}
