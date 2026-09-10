import index from "virtual:surface-index";
import SurfacePreview from "./SurfacePreview.jsx";

export default {
  title: "Surfaces/Review",
  parameters: { layout: "fullscreen" },
};
const story = (id) => ({
  render: () => (
    <SurfacePreview
      pack={index.versions.find((v) => v.key === `${id}@2026-09`)}
    />
  ),
});
export const ToolPage = story("pattern/tool-page");
export const ToolVideo = story("workspace/tool-video");
export const UploadedMedia = story("pattern/uploaded-media");
export const ActionFooter = story("pattern/action-footer");
export const VideoResults = story("pattern/video-results");
export const HistoryList = story("pattern/history-list");
export const DetailModal = story("pattern/detail-modal");
