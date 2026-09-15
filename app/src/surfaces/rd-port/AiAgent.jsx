import styles from './Gallery.module.scss';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch } from './gallery-adapters.jsx';
import { setMessageDialog } from './gallery-adapters.jsx';
import _includes from 'lodash/includes';
import { historyTab } from './gallery-adapters.jsx';
import { useHistoryTips } from './gallery-adapters.jsx';
import GalleryGrid from './GalleryGrid.jsx';
import GalleryCell from './GalleryCell.jsx';
import { bucketRatio } from './use-aspect-ratio.js';
import CellActions from './CellActions.jsx';
import { LoadingSkeleton } from './gallery-adapters.jsx';
import SelectAllHeader from './SelectAllHeader.jsx';
import EditingToolbar from './EditingToolbar.jsx';
import { useScrollTrigger } from './gallery-adapters.jsx';
import { useWindowDevice } from './gallery-adapters.jsx';
import { downloadUtils } from './gallery-adapters.jsx';
import { generateDownloadFileName } from './gallery-adapters.jsx';
import { useAiAgentGallery } from './gallery-adapters.jsx';
import { routerUtils } from './gallery-adapters.jsx';
import { useRouter } from './gallery-adapters.jsx';
import { useDownloadObjectUrls } from './gallery-adapters.jsx';

// Fetch one url as a blob and save it (works for both images and videos —
// the gallery download modal is image-oriented). Extension comes from the S3
// object basename, falling back to the blob MIME type. `createObjectUrl` is
// the caller's useDownloadObjectUrls creator — the anchor URL must outlive
// this call (see use-download-object-urls).
const downloadSingle = async (url, createObjectUrl) => {
  try {
    const [blob] = await downloadUtils.downloadBlobs([url]);
    const a = document.createElement('a');
    a.href = createObjectUrl(blob, url);
    const basename = url.split('?')[0].split('/').pop() || '';
    const extension = basename.includes('.')
      ? basename.split('.').pop().toLowerCase()
      : blob.type?.startsWith('video')
      ? 'mp4'
      : 'jpg';
    a.download = `${generateDownloadFileName()}.${extension}`;
    a.click();
  } catch (e) {
    console.error('AI Agent single download failed:', e);
  }
};

export default function AiAgent() {
  const router = useRouter();
  const dispatch = useDispatch();
  // Download anchor URLs live until unmount — see use-download-object-urls.
  const createDownloadObjectUrl = useDownloadObjectUrls();
  const { isMd } = useWindowDevice();
  const isCurrentTab = useCallback((tab) => tab === historyTab.aiAgent, []);
  const { tipsText1, tipsText2 } = useHistoryTips(isCurrentTab);
  const containerRef = useRef(null);

  const { items, status, isLoadingMore, loadMore } = useAiAgentGallery();

  // Orphaned media (created under an old account uid) re-signs to a URL whose S3
  // object is gone, so it ORB-blocks / 404s and renders a broken thumbnail. With
  // no delete API, drop any item whose media fails to load — the grid measures
  // every src off-DOM and reports the ones that error — so the gallery stays
  // clean across grid, selection, and download (YCO260622P0015).
  const [erroredSrcs, setErroredSrcs] = useState(() => new Set());
  const handleErroredSrc = useCallback((src) => {
    setErroredSrcs((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  }, []);
  const visibleItems = useMemo(
    () => items.filter((it) => !erroredSrcs.has(it.url)),
    [items, erroredSrcs]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useScrollTrigger({
    containerRef,
    onTrigger: loadMore,
    boundary: 160,
    minBoundary: 80,
    useDynamicBoundary: true,
  });

  const isSelectAll =
    visibleItems.length > 0 && selectedIds.length === visibleItems.length;

  const handleNoticeClick = useCallback(() => {
    dispatch(setMessageDialog({ show: true, type: 'history.notice.agent' }));
  }, [dispatch]);

  const handleToggleEditing = useCallback(() => {
    setIsEditing((prev) => {
      if (prev) setSelectedIds([]);
      return !prev;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.length === visibleItems.length ? [] : visibleItems.map((it) => it.id)
    );
  }, [visibleItems]);

  // Per spec: clicking a result does nothing; selection only happens in edit
  // mode (then the cell toggles its checkbox).
  const handleCellClick = useCallback(
    (item) => {
      const { id, sessionId: session } = item;
      if (!isEditing) {
        routerUtils.push(router, '/agent', {
          session,
        });
        return;
      }
      setSelectedIds((prev) =>
        _includes(prev, id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    },
    [isEditing]
  );

  const handleMultiDownload = useCallback(async () => {
    if (isDownloading || selectedIds.length === 0) return;
    setIsDownloading(true);
    try {
      const urls = visibleItems
        .filter((it) => _includes(selectedIds, it.id))
        .map((it) => it.url)
        .filter(Boolean);
      if (urls.length) {
        const blobs = await downloadUtils.downloadBlobs(urls);
        await downloadUtils.zipBlobs(
          blobs,
          `${generateDownloadFileName()}.zip`,
          null,
          false
        );
      }
    } catch (e) {
      console.error('AI Agent batch download failed:', e);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, selectedIds, visibleItems]);

  const getMedia = useCallback(
    (item) => ({ src: item.url, type: item.type }),
    []
  );
  const getKey = useCallback((item, i) => `${item.id}-${i}`, []);

  const renderCell = useCallback(
    (item, _i, ratio, loading) => (
      <GalleryCell
        aspectRatio={ratio}
        loading={loading}
        thumbnail={item.type === 'image' ? item.url : undefined}
        isVideo={item.type === 'video'}
        videoSrc={item.type === 'video' ? item.url : undefined}
        isEditing={isEditing}
        isSelected={_includes(selectedIds, item.id)}
        onClick={() => handleCellClick(item)}
        actions={
          <CellActions
            onDownload={() => downloadSingle(item.url, createDownloadObjectUrl)}
            menuItems={[]}
          />
        }
        item={item}
      />
    ),
    [isEditing, selectedIds, handleCellClick, createDownloadObjectUrl]
  );

  const initialLoading = status === 'loading' && items.length === 0;
  const showEmpty = status === 'loaded' && visibleItems.length === 0;

  const selectDisabled = useMemo(
    () => visibleItems.length === 0,
    [visibleItems.length]
  );

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        <SelectAllHeader
          styles={styles}
          isEditing={isEditing}
          isSelectAll={isSelectAll}
          onToggleSelectAll={handleToggleSelectAll}
          onNoticeClick={handleNoticeClick}
        >
          <div className={styles.tip}>
            {tipsText1}
            <span className={styles.tipHighLight}>{tipsText2}</span>
          </div>
        </SelectAllHeader>
        <div className={styles.headerBottoms}>
          <EditingToolbar
            styles={styles}
            isEditing={isEditing}
            isMd={isMd}
            selectDisabled={selectDisabled}
            deleteDisabled={true}
            hideDelete={true}
            onToggleEditing={handleToggleEditing}
            onDelete={() => {}}
            onDownload={handleMultiDownload}
            downloadDisabled={selectedIds.length === 0 || isDownloading}
          />
        </div>
      </div>
      <div className={styles.cellsContainer}>
        <div className={styles.cells}>
          {visibleItems.length > 0 && (
            <GalleryGrid
              items={visibleItems}
              getKey={getKey}
              getMedia={getMedia}
              normalizeRatio={(ratio, item) =>
                item.type === 'video' ? bucketRatio(ratio) : ratio
              }
              renderCell={renderCell}
              onErroredSrc={handleErroredSrc}
            />
          )}
          {(initialLoading || isLoadingMore) && (
            <LoadingSkeleton num={12} isVideoTab={false} />
          )}
          {showEmpty && (
            <div
              style={{ padding: '40px 0', textAlign: 'center', width: '100%' }}
            >
              No AI Agent results yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
