// RD gallery.js presentation and result-item/GalleryCell composition.
// Redux history/network tasks are replaced with synchronous synthetic fixtures.
import { useState, useEffect, useRef } from 'react';
import styles from './Gallery.module.scss';
import GalleryGrid from './GalleryGrid.jsx';
import GalleryCell from './GalleryCell.jsx';
import CellActions from './CellActions.jsx';
import SelectAllHeader from './SelectAllHeader.jsx';
import EditingToolbar from './EditingToolbar.jsx';
import DeleteConfirmModal from './DeleteConfirmModal.jsx';
import EmptyContent from './EmptyContent.jsx';
import { getTranslationFunction, useRouter, useWindowDevice } from './adapters.jsx';
import photo from '../../../../design-library/assets/video/rd-component-fixtures/video-object-remover-poster.jpg';
import video from '../../../../design-library/assets/video/rd-component-fixtures/video-object-remover.mp4';
const makeItems = tab => Array.from({ length: tab === 'videoEditor' ? 6 : 5 }, (_, i) => ({ id: `${tab}-${i}`, width: [1, 4/3, 3/4][i%3], height: 1, thumbnail: photo, videoSrc: video }));
export default function Gallery({ tabName }) {
  const [items, setItems] = useState(() => makeItems(tabName));
  const [isEditing, setEditing] = useState(false);
  const [selected, setSelected] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const containerRef = useRef(null);
  const { isMd } = useWindowDevice();
  const router = useRouter();
  const { t } = getTranslationFunction();
  const isVideo = tabName === 'videoEditor';
  useEffect(() => { setItems(makeItems(tabName)); setSelected([]); setEditing(false); setPendingDelete(null); }, [tabName]);
  const toggle = id => setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  const handleToggleEditing = () => { setEditing(!isEditing); setSelected([]); };
  const handleCellClick = item => isEditing ? toggle(item.id) : router.push(isVideo ? '/products/video-object-remover/result-photo' : '/edit/result-photo');
  const handleDownload = () => router.push('gallery/download');
  const tipPrefix = isVideo ? 'my.account.history.enhance.video.tip.' : tabName === 'photoEditor' ? 'my.account.history.tip.' : 'my.account.history.generator.tip.';
  const renderTipsOrSelectAll = () => (
    <SelectAllHeader styles={styles} isEditing={isEditing} isSelectAll={selected.length === items.length && !!items.length} onToggleSelectAll={() => setSelected(selected.length === items.length ? [] : items.map(x => x.id))} onNoticeClick={() => router.push('gallery/retention-notice')}>
      <div className={styles.tip}>{t(tipPrefix + '1')}<span className={styles.tipHighLight}>{t(tipPrefix + '2', { dtl: '30' })}</span></div>
    </SelectAllHeader>
  );
  const renderSelectOrCancel = () => (
    <EditingToolbar styles={styles} isEditing={isEditing} isMd={isMd} selectDisabled={!items.length} deleteDisabled={!selected.length} onToggleEditing={handleToggleEditing} onDelete={() => setPendingDelete(selected)} onDownload={handleDownload} downloadDisabled={!selected.length} />
  );
  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        {renderTipsOrSelectAll()}
        <div className={styles.headerBottoms}>{renderSelectOrCancel()}</div>
      </div>
      <div className={styles.cellsContainer}>
        {items.length === 0 && <EmptyContent currentTab={tabName} />}
        <div className={styles.cells}>
          <GalleryGrid items={items} getKey={item => item.id} getRatio={item => item.width / item.height} renderCell={(item, index, ratio, loading) => (
            <GalleryCell item={item} aspectRatio={ratio} loading={loading} thumbnail={item.thumbnail} isVideo={isVideo} videoSrc={isVideo ? item.videoSrc : undefined} duration={isVideo ? '00:05' : undefined} isEditing={isEditing} isSelected={selected.includes(item.id)} onClick={() => handleCellClick(item)} actions={
              <CellActions onDownload={handleDownload} menuItems={[
                { label: t(isVideo ? 'text.to.video.next.action.retry' : 'my.account.gallery.edit.image'), icon: isVideo ? 'retry' : 'edit', onClick: () => handleCellClick(item) },
                { label: t('general.delete'), icon: 'delete', danger: true, onClick: () => setPendingDelete([item.id]) },
              ]} />
            } />
          )} />
        </div>
      </div>
      <DeleteConfirmModal opened={!!pendingDelete} descKey={isVideo ? 'message.dialog.desc.delete.history.video.singular' : 'message.dialog.desc.delete.history'} onConfirm={() => { setItems(current => current.filter(x => !pendingDelete.includes(x.id))); setPendingDelete(null); setSelected([]); setEditing(false); }} onCancel={() => setPendingDelete(null)} />
    </div>
  );
}
