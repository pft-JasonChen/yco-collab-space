import { useState } from "react";
import index from "virtual:surface-index";
import poster from "../../../design-library/assets/video/rd-component-fixtures/video-object-remover-poster.jpg";
import video from "../../../design-library/assets/video/rd-component-fixtures/video-object-remover.mp4";
import styles from "./Surfaces.module.scss";

const modules = import.meta.glob("../../../platform/ui/*/index.js", {
  eager: true,
});

function resolvePreviewComponents(bindings) {
  return Object.fromEntries(
    Object.entries(bindings.preview?.components ?? {}).map(([name, target]) => {
      const file = index.components[target.component];
      const component =
        modules["../../../" + file]?.[target.export ?? "default"];
      if (!component)
        throw new Error(
          `Surface preview cannot resolve ${target.component}.${target.export ?? "default"}`,
        );
      return [name, component];
    }),
  );
}

export default function SurfacePreview({ pack }) {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("edit");
  const [state, setState] = useState("success");
  const [opened, setOpened] = useState(false);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  if (!pack?.bindings?.preview) return <p>此版本尚無可渲染的實作。</p>;
  const c = resolvePreviewComponents(pack.bindings);
  const recipe = pack.bindings.preview.recipe;
  const item = {
    id: "sample",
    status: state,
    title: "Surface sample",
    tags: ["Synthetic sample", "16:9"],
    date: "09-10 12:00",
    videoUrl: video,
    posterUrl: poster,
    failureDescription: "Synthetic failure. Retry to see the completed state.",
  };
  const action = () => {
    setState("processing");
    setTab("history");
    setNotice("合成處理狀態；使用上方狀態選單切換完成或失敗。");
  };
  const history = c.History ? (
    <c.History
      items={[item]}
      onOpen={() => setOpened(true)}
      onRetry={() => setState("success")}
      onLike={() => setNotice("已示範喜歡")}
      onDislike={() => setNotice("已示範不喜歡")}
      onEdit={() => setTab("edit")}
      onDownload={() => setNotice("示範下載操作；無後端請求。")}
    />
  ) : null;
  const upload = c.Upload ? (
    <c.Upload
      imageUrl={loaded ? poster : undefined}
      videoUrl={loaded ? video : undefined}
      videoDuration={30}
      uploadTitle="Load sample video"
      uploadDescription="使用內建範例，不上傳個人檔案"
      onUpload={() => setLoaded(true)}
      onRemove={() => setLoaded(false)}
      onReplace={() => setLoaded(true)}
      onPreview={() => setOpened(true)}
    />
  ) : null;
  const footer = c.Action ? (
    <c.Action
      label="Generate sample"
      cost={10}
      onClick={action}
      isLoading={state === "processing"}
    />
  ) : null;
  const canvas = (
    <video
      className={styles.video}
      src={video}
      poster={poster}
      controls
      muted
      playsInline
      preload="metadata"
      aria-label="Synthetic sample result"
    />
  );
  const results = c.Results ? (
    <c.Results
      activeTab={tab}
      onTabChange={setTab}
      processing={state === "processing"}
      filterValue={filter}
      onFilterChange={setFilter}
      filterOptions={[
        { value: "all", label: "All samples" },
        { value: "sample", label: "Surface sample" },
      ]}
      editContent={canvas}
      historyContent={history}
    />
  ) : (
    canvas
  );
  const detail = c.Dialog ? (
    <c.Dialog
      opened={opened}
      onClose={() => setOpened(false)}
      title="Surface sample"
      date="2026-09-10"
      videoUrl={video}
      posterUrl={poster}
      sources={[{ id: "source", url: poster, alt: "Sample source" }]}
      metadata={[
        { label: "Resolution", value: "1920 × 1080" },
        { label: "Duration", value: "30s" },
      ]}
      nextActions={[
        {
          id: "sample",
          label: "Use sample",
          onSelect: () => {
            setOpened(false);
            setNotice("已選取範例。");
          },
        },
      ]}
      onLike={() => setNotice("已示範喜歡")}
      onDislike={() => setNotice("已示範不喜歡")}
      onDownload={() => setNotice("示範下載操作；無後端請求。")}
      onRetry={() => setState("success")}
    />
  ) : null;
  let content;
  if (recipe === "uploaded-media")
    content = <div className={styles.inspector}>{upload}</div>;
  else if (recipe === "action-footer")
    content = <div className={styles.inspector}>{footer}</div>;
  else if (recipe === "history-list") content = history;
  else if (recipe === "video-results")
    content = <div className={styles.result}>{results}</div>;
  else if (recipe === "detail-modal")
    content = (
      <button className={styles.control} onClick={() => setOpened(true)}>
        Open sample details
      </button>
    );
  else
    content = (
      <c.Shell title="Surface sample" showInfo={false} showCredits={false}>
        <c.Layout
          panel={
            <>
              <h2>Video settings</h2>
              {upload}
              <p>此處為合成 feature 內容；實際設定由各 feature 決定。</p>
            </>
          }
          footer={footer}
          result={results}
        />
      </c.Shell>
    );
  return (
    <div className={styles.preview} data-surface-preview={pack.key}>
      <div className={styles.toolbar}>
        <span>真實共用元件 · 合成資料</span>
        <label>
          範例狀態{" "}
          <select
            aria-label="範例狀態"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setNotice("");
            }}
          >
            <option value="success">完成</option>
            <option value="processing">處理中</option>
            <option value="failed">失敗</option>
          </select>
        </label>
        {c.Dialog && recipe !== "detail-modal" && (
          <button onClick={() => setOpened(true)}>Open sample details</button>
        )}
      </div>
      {notice && <p role="status">{notice}</p>}
      {content}
      {detail}
    </div>
  );
}
