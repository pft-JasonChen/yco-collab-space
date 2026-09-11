import index from "virtual:surface-index";
import SurfaceBrowser from "./SurfaceBrowser.jsx";
import SurfacePreview from "./SurfacePreview.jsx";
import RdIntakeBrowser from "./RdIntakeBrowser.jsx";

export default function SurfaceRoute() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "rd-intake") return <RdIntakeBrowser />;
  if (params.get("preview") !== "1") return <SurfaceBrowser />;
  const pack = index.versions.find((v) => v.key === params.get("pack"));
  return pack ? (
    <SurfacePreview key={pack.key} pack={pack} />
  ) : (
    <main>
      <h1>找不到指定 surface 版本</h1>
      <a href="./">回到 Surface Browser</a>
    </main>
  );
}
