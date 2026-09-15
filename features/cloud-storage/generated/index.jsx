import { useMemo, useState } from 'react';
import NavigationHeader from '../../../platform/ui/navigation-header/index.js';
import CategoryRail from '../../../platform/ui/category-rail/index.js';
import GalleryTabs from '../../../platform/ui/gallery-tabs/index.js';
import GalleryGrid, { bucketRatio } from '../../../platform/ui/gallery-grid/index.js';
import GalleryCell from '../../../platform/ui/gallery-cell/index.js';
import SelectionToolbar, { SelectAllHeader } from '../../../platform/ui/selection-toolbar/index.js';
import ConfirmDialog from '../../../platform/ui/confirm-dialog/index.js';
import PricingOverlay from '../../../platform/ui/pricing-overlay/index.js';
import EmptyImage from '../../../platform/ui/empty-image/index.js';
import Button from '../../../platform/ui/button/index.js';
import { createTranslator } from '../../../platform/runtime/i18n.js';
import dictionary from '../product/i18n.json';
import mockData from '../product/mocks/cloud-storage.json';
import {
  ReviewUsageControl,
  StorageCriticalBanner,
  StorageFullDialog,
  StorageMeter,
  resolveStorageState,
} from './storage.jsx';
import styles from './index.module.scss';

import landscapeExpand from '../product/mock-assets/landscape-expand.jpg';
import portraitHairstyle from '../product/mock-assets/portrait-hairstyle.jpg';
import squareReshape from '../product/mock-assets/square-reshape.jpg';
import wideEnhance from '../product/mock-assets/wide-enhance.jpg';
import tallClothes from '../product/mock-assets/tall-clothes.jpg';
import landscapeColorize from '../product/mock-assets/landscape-colorize.jpg';
import videoPoster from '../product/mock-assets/video-poster.jpg';
import sampleClip from '../product/mock-assets/sample-clip.mp4';

export const featureMeta = {
  slug: 'cloud-storage',
  title: 'Cloud Storage',
  stage: 'pm-draft',
  readiness: 'working',
};

const t = createTranslator(dictionary);

// Mock rows carry no binary, so the thumbnails are attached here by id. Keeping
// the map in code rather than in the JSON keeps product/mocks readable as data.
const THUMBNAILS = {
  'item-project-summer-ad': landscapeExpand,
  'item-project-lookbook': portraitHairstyle,
  'item-image-headshot': portraitHairstyle,
  'item-image-product-scene': squareReshape,
  'item-image-expand': landscapeExpand,
  'item-video-generated': videoPoster,
  'item-video-style': landscapeColorize,
  'item-upload-source-clip': videoPoster,
  'item-upload-reference': wideEnhance,
};

const FOLDER_COVERS = {
  'folder-campaign': squareReshape,
  'folder-reels': tallClothes,
};

const VIDEO_TABS = new Set(['videos']);

// Literal lookups rather than interpolated keys. The handoff validator extracts
// only single-quoted literal keys, so a key built by interpolation would travel
// to RD undeclared while reading as an unused entry in this feature's own
// dictionary — the two failures that check exists to catch.
const TAB_LABELS = {
  projects: t('cloud.storage.tab.projects'),
  images: t('cloud.storage.tab.images'),
  videos: t('cloud.storage.tab.videos'),
  uploads: t('cloud.storage.tab.uploads'),
  trash: t('cloud.storage.tab.trash'),
};

const EMPTY_COPY = {
  projects: t('cloud.storage.empty.projects'),
  images: t('cloud.storage.empty.images'),
  videos: t('cloud.storage.empty.videos'),
  uploads: t('cloud.storage.empty.uploads'),
};

// The rail's items are resolved here because category-rail is presentational:
// the shared component owns the markup and keyboard model, the consumer owns
// what the rows are and what selecting one does. Navigation is inert in this
// prototype, so onSelect only moves the highlight.
const RAIL_ITEMS = mockData.railCategories.map((entry) => ({
  key: entry.key,
  label: entry.label,
  iconName: entry.iconName,
  dividerBefore: entry.dividerBefore,
}));

function ratioOf(item) {
  return item.ratio || 1;
}

function emptyTypeFor(tabId) {
  if (tabId === 'videos') return 'video';
  if (tabId === 'uploads') return 'upload-drag';
  return 'general';
}

function formatMb(bytes) {
  return `${Math.round(bytes / 1048576)} MB`;
}

export default function CloudStorage() {
  const [activeTab, setActiveTab] = useState('images');
  const [toolFamily, setToolFamily] = useState('all');
  const [sort, setSort] = useState('newest');
  const [reviewState, setReviewState] = useState(mockData.capacity.defaultReviewState);
  const [openFolderId, setOpenFolderId] = useState(null);
  const [selection, setSelection] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [fullDialogOpen, setFullDialogOpen] = useState(false);
  const [trashConfirmId, setTrashConfirmId] = useState(null);
  const [purchasePath, setPurchasePath] = useState(null);
  const [railKey, setRailKey] = useState('gallery');
  const [planTab, setPlanTab] = useState('pro');
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [selectedPack, setSelectedPack] = useState('pack-100');

  const usage = useMemo(
    () =>
      mockData.capacity.reviewStates.find((entry) => entry.id === reviewState) ??
      mockData.capacity.reviewStates[0],
    [reviewState],
  );

  const quotaBytes = mockData.plan.quotaBytes;
  const storageState = resolveStorageState(usage.usedBytes, quotaBytes);
  const usageForMeter = { ...usage, quotaBytes, quotaLabel: mockData.plan.quotaLabel };

  const folders = useMemo(
    () => (openFolderId ? [] : mockData.folders.filter((folder) => folder.tab === activeTab)),
    [activeTab, openFolderId],
  );

  const items = useMemo(() => {
    let rows = mockData.items.filter((item) => item.tab === activeTab);
    if (openFolderId) rows = rows.filter((item) => item.folderId === openFolderId);
    if (toolFamily !== 'all') rows = rows.filter((item) => item.toolFamily === toolFamily);
    if (sort === 'size-desc') rows = [...rows].sort((a, b) => b.sizeBytes - a.sizeBytes);
    if (sort === 'oldest') rows = [...rows].reverse();
    return rows;
  }, [activeTab, openFolderId, toolFamily, sort]);

  const selectedBytes = useMemo(
    () =>
      mockData.items
        .filter((item) => selection.includes(item.id))
        .reduce((total, item) => total + item.sizeBytes, 0),
    [selection],
  );

  const openFolder = mockData.folders.find((folder) => folder.id === openFolderId) ?? null;
  const isTrash = activeTab === 'trash';
  const showFilters = !isTrash;
  const allSelected = items.length > 0 && items.every((item) => selection.includes(item.id));

  function toggleSelected(id) {
    setSelection((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function toggleEditing() {
    setIsEditing((current) => {
      if (current) setSelection([]);
      return !current;
    });
  }

  // Cleanup has no dedicated view in this version: it enters the existing batch
  // selection with sort switched to size-descending, so the largest items are
  // actionable first. Recorded as a PM decision, not an omission.
  function enterCleanup() {
    setFullDialogOpen(false);
    setPurchasePath(null);
    setActiveTab('images');
    setOpenFolderId(null);
    setSort('size-desc');
    setSelection([]);
    setIsEditing(true);
  }

  function changeTab(tabId) {
    setActiveTab(tabId);
    setOpenFolderId(null);
    setSelection([]);
    setIsEditing(false);
    setToolFamily('all');
  }

  function openPurchase(path) {
    setFullDialogOpen(false);
    setPurchasePath(path);
  }

  const trashTarget = mockData.items.find((item) => item.id === trashConfirmId) ?? null;
  const subscription = mockData.purchase.subscription;

  return (
    <div className={styles.page} data-testid="cloud-storage-page" data-horizontal-overflow="false">
      <div data-surface-zone="global-header">
        <NavigationHeader
          userType="free"
          showCredits
          creditBalance={320}
          showFeatureName={false}
          showFeatureInfo={false}
          onUpgrade={() => openPurchase('subscription')}
        />
      </div>

      <div className={styles.body}>
        <div data-surface-zone="category-navigation" className={styles.railZone}>
          <CategoryRail
            className={styles.rail}
            items={RAIL_ITEMS}
            activeKey={railKey}
            onSelect={setRailKey}
            ariaLabel={t('cloud.storage.rail.label')}
          />
        </div>

        <main className={styles.main} data-surface-zone="gallery-content">
          <header
            className={styles.heading}
            data-surface-zone="gallery-heading"
            data-testid="gallery-heading"
            data-meter-adjacent="true"
          >
            <h1 className={styles.title}>{t('cloud.storage.page.title')}</h1>
            <div data-surface-zone="capacity-summary" className={styles.meterZone}>
              <StorageMeter
                t={t}
                usage={usageForMeter}
                state={storageState}
                onManage={enterCleanup}
                onUpgrade={() => openPurchase('subscription')}
              />
            </div>
          </header>

          <ReviewUsageControl
            t={t}
            value={reviewState}
            options={mockData.capacity.reviewStates}
            onChange={setReviewState}
          />

          {storageState === 'critical' && (
            <StorageCriticalBanner
              t={t}
              usage={usageForMeter}
              onManage={enterCleanup}
              onExpand={() => openPurchase('packs')}
            />
          )}

          <div className={styles.quickCreate}>
            <Button variant="secondary" data-testid="create-entry">
              {t('cloud.storage.action.new.project')}
            </Button>
            <Button
              variant="secondary"
              data-testid="upload-entry"
              onClick={() => storageState === 'full' && setFullDialogOpen(true)}
            >
              {t('cloud.storage.action.upload')}
            </Button>
            <Button variant="secondary" data-testid="import-phone-entry">
              {t('cloud.storage.action.import.phone')}
            </Button>
          </div>

          <GalleryTabs
            className={styles.tabRow}
            tabs={mockData.tabs.map((tab) => ({ key: tab.id, label: TAB_LABELS[tab.id] }))}
            activeKey={activeTab}
            onTabChange={changeTab}
            ariaLabel={t('cloud.storage.tabs.label')}
          />

          <div className={styles.toolbar} data-surface-zone="gallery-actions">
            <SelectAllHeader
              isEditing={isEditing}
              isSelectAll={allSelected}
              onToggleSelectAll={() =>
                setSelection(allSelected ? [] : items.map((item) => item.id))
              }
              labels={{ selectAll: t('cloud.storage.action.select.all'), tips: t('cloud.storage.tips') }}
            >
              <span className={styles.tip}>{t('cloud.storage.tip.retention')}</span>
            </SelectAllHeader>

            <div className={styles.toolbarRight}>
              {showFilters && (
                <>
                  <label className={styles.control}>
                    <span className={styles.controlLabel}>{t('cloud.storage.filter.tool.family')}</span>
                    <select
                      className={styles.select}
                      data-testid="tool-family-filter"
                      data-level="2"
                      value={toolFamily}
                      onChange={(event) => setToolFamily(event.target.value)}
                    >
                      {mockData.toolFamilies.map((family) => (
                        <option key={family.id} value={family.id} data-testid={`tool-family-option-${family.id}`}>
                          {family.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.control}>
                    <span className={styles.controlLabel}>{t('cloud.storage.sort.label')}</span>
                    <select
                      className={styles.select}
                      data-testid="sort-control"
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                    >
                      {mockData.sortOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button variant="tertiary" size="small" data-testid="create-folder">
                    {t('cloud.storage.action.new.folder')}
                  </Button>
                </>
              )}
              {isTrash && (
                <span className={styles.trashSort} data-testid="trash-grid" data-sort="date-moved">
                  {t('cloud.storage.trash.sort')}
                </span>
              )}
              {!isTrash && (
                <SelectionToolbar
                  isEditing={isEditing}
                  onToggleEditing={toggleEditing}
                  deleteDisabled={selection.length === 0}
                  downloadDisabled={selection.length === 0}
                  onDelete={() => setTrashConfirmId(selection[0] ?? null)}
                  onDownload={() => {}}
                  labels={{
                    select: t('cloud.storage.action.select'),
                    cancel: t('cloud.storage.action.cancel'),
                    delete: t('cloud.storage.action.trash'),
                    download: t('cloud.storage.action.download'),
                  }}
                />
              )}
            </div>
          </div>

          {isEditing && selection.length > 0 && (
            <div className={styles.selectionSummary} data-testid="batch-toolbar">
              <span data-testid="selected-count">
                {t('cloud.storage.batch.selected', { count: selection.length })}
              </span>
              <span className={styles.batchSize} data-testid="selected-size">
                {t('cloud.storage.batch.frees', { size: formatMb(selectedBytes) })}
              </span>
            </div>
          )}

          {isTrash && (
            <div className={styles.trashBanner} data-testid="trash-policy-banner" data-counts-against-quota="true">
              {t('cloud.storage.trash.policy', { days: mockData.trash.retentionDays })}
            </div>
          )}

          {openFolder && (
            <nav
              className={styles.breadcrumb}
              data-surface-zone="folder-navigation"
              data-testid="folder-breadcrumb"
            >
              <button
                type="button"
                className={styles.breadcrumbRoot}
                data-testid="breadcrumb-root"
                onClick={() => setOpenFolderId(null)}
              >
                {TAB_LABELS[activeTab]}
              </button>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span>{openFolder.name}</span>
            </nav>
          )}

          {folders.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('cloud.storage.section.folders')}</h2>
              <div className={styles.folderRow}>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    className={styles.folderCard}
                    data-testid="folder-card"
                    onClick={() => setOpenFolderId(folder.id)}
                  >
                    <span
                      className={styles.folderCover}
                      style={{ backgroundImage: `url(${FOLDER_COVERS[folder.id]})` }}
                    />
                    <span className={styles.folderName}>{folder.name}</span>
                    <span className={styles.folderMeta}>
                      {t('cloud.storage.folder.meta', { count: folder.itemCount, size: folder.sizeLabel })}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Sort order and folder scope are the feature's state, not the shared
              grid's, so they are declared on the section the feature owns. The
              grid itself exposes only its own data-component-role. */}
          <section
            className={styles.section}
            data-testid="gallery-grid-section"
            data-sort={sort}
            data-scope={openFolderId ? 'folder' : 'root'}
          >
            <h2 className={styles.sectionTitle}>
              {isTrash ? t('cloud.storage.section.trash') : t('cloud.storage.section.items')}
            </h2>

            {isTrash ? (
              <div className={styles.trashList} data-surface-zone="trash-management">
                {mockData.trash.items.map((entry) => (
                  <article key={entry.id} className={styles.trashCard} data-testid="trash-card">
                    <div className={styles.trashCardMain}>
                      <span className={styles.trashName}>{entry.name}</span>
                      <span className={styles.trashMeta}>
                        {entry.type} · {entry.sizeLabel} · {entry.movedLabel}
                      </span>
                    </div>
                    <span
                      className={entry.emphasis === 'final-day' ? styles.trashCountdownFinal : styles.trashCountdown}
                      data-testid="trash-countdown"
                    >
                      {/* The runtime has no plural rule, and the last day wants
                          its own urgency anyway — "1 days left" would be both a
                          grammar bug and a wasted warning. */}
                      {entry.daysRemaining <= 1
                        ? t('cloud.storage.trash.countdown.last')
                        : t('cloud.storage.trash.countdown', { days: entry.daysRemaining })}
                    </span>
                    <div className={styles.trashActions}>
                      <Button variant="tertiary" size="small" data-testid="trash-restore">
                        {t('cloud.storage.action.restore')}
                      </Button>
                      <Button variant="tertiary" size="small" tone="destructive" data-testid="trash-delete-forever">
                        {t('cloud.storage.action.delete.forever')}
                      </Button>
                    </div>
                  </article>
                ))}
                <div className={styles.trashFooter}>
                  <Button variant="secondary" size="small" tone="destructive" data-testid="trash-empty-all">
                    {t('cloud.storage.action.empty.trash')}
                  </Button>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className={styles.empty} data-testid="empty-state">
                <EmptyImage type={emptyTypeFor(activeTab)} background="sunken" />
                <p className={styles.emptyTitle}>{EMPTY_COPY[activeTab]}</p>
              </div>
            ) : (
              <GalleryGrid
                items={items}
                getKey={(item) => item.id}
                getRatio={ratioOf}
                normalizeRatio={VIDEO_TABS.has(activeTab) ? bucketRatio : undefined}
                renderCell={(item, index, ratio) => (
                  <div className={styles.cellWrap}>
                    <GalleryCell
                      aspectRatio={ratio}
                      thumbnail={THUMBNAILS[item.id]}
                      alt={item.name}
                      isVideo={Boolean(item.durationLabel)}
                      videoSrc={item.durationLabel ? sampleClip : undefined}
                      duration={item.durationLabel}
                      isEditing={isEditing}
                      isSelected={selection.includes(item.id)}
                      onClick={() => isEditing && toggleSelected(item.id)}
                      domId={`cloud-storage-${item.id}`}
                      actions={
                        <button
                          type="button"
                          className={styles.cellMenu}
                          data-testid="item-menu-trigger"
                          onClick={() => setTrashConfirmId(item.id)}
                          aria-label={t('cloud.storage.action.more')}
                        >
                          ···
                        </button>
                      }
                    />
                    <div className={styles.cellMeta}>
                      <span className={styles.cellName} data-testid="cell-name">
                        {item.name}
                      </span>
                      <span className={styles.cellFacts}>
                        <span data-testid="cell-type">{item.type}</span>
                        <span aria-hidden="true">·</span>
                        <span data-testid="cell-size">{item.sizeLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span data-testid="cell-date">{item.dateLabel}</span>
                      </span>
                    </div>
                  </div>
                )}
              />
            )}
          </section>
        </main>
      </div>

      {fullDialogOpen && (
        <StorageFullDialog
          t={t}
          usage={usageForMeter}
          onManage={enterCleanup}
          onBuyPack={() => openPurchase('packs')}
          onUpgrade={() => openPurchase('subscription')}
          onClose={() => setFullDialogOpen(false)}
        />
      )}

      {/* Mounted only while it has a target. The shared Modal parks its closed
          state instead of unmounting, so an always-mounted dialog would leave a
          second role="dialog" in the accessibility tree behind the page. */}
      {trashTarget && (
        <ConfirmDialog
          opened
          title={t('cloud.storage.trash.confirm.title')}
          description={t('cloud.storage.trash.confirm.body', { days: mockData.trash.retentionDays })}
          confirmLabel={t('cloud.storage.action.trash')}
          cancelLabel={t('cloud.storage.action.cancel')}
          tone="destructive"
          closeLabel={t('cloud.storage.action.close')}
          onConfirm={() => setTrashConfirmId(null)}
          onCancel={() => setTrashConfirmId(null)}
        />
      )}

      {/* Two paths, one overlay instance. The shared Modal parks its closed
          state rather than unmounting, so rendering an overlay per path would
          leave two role="dialog" nodes in the accessibility tree at once. The
          path selects the props instead. */}
      {purchasePath && (
        <div data-surface-zone="purchase-overlay">
        <PricingOverlay
          opened
          onClose={() => setPurchasePath(null)}
          onCheckout={() => setPurchasePath(null)}
          aside={
            <p className={styles.purchaseUsage}>
              {t('cloud.storage.meter.usage', { used: usage.usedLabel, quota: mockData.plan.quotaLabel })}
            </p>
          }
          {...(purchasePath === 'subscription'
            ? {
                title: t('cloud.storage.purchase.plan.title'),
                tabs: [{ key: 'pro', label: subscription.planLabel, tone: 'pro' }],
                activeTabKey: planTab,
                onTabChange: setPlanTab,
                plans: [
                  { key: 'monthly', name: t('cloud.storage.purchase.monthly'), price: subscription.monthlyLabel },
                  {
                    key: 'yearly',
                    name: t('cloud.storage.purchase.yearly'),
                    price: subscription.yearlyLabel,
                    savePercent: subscription.yearlySavingLabel,
                  },
                ],
                selectedPlanKey: selectedPlan,
                onSelectPlan: setSelectedPlan,
                features: { title: t('cloud.storage.purchase.benefits'), items: subscription.benefits },
                summary: t('cloud.storage.purchase.renewal', { date: mockData.purchase.summary.renewalLabel }),
                labels: { checkout: t('cloud.storage.action.upgrade.pro'), close: t('cloud.storage.action.close') },
                secondaryAction: (
                  <button
                    type="button"
                    className={styles.expandOnly}
                    data-testid="plan-expand-storage-entry"
                    onClick={() => setPurchasePath('packs')}
                  >
                    {t('cloud.storage.purchase.expand.only')}
                  </button>
                ),
              }
            : {
                title: t('cloud.storage.purchase.pack.title'),
                plans: mockData.purchase.storagePacks.map((pack) => ({
                  key: pack.id,
                  name: pack.label,
                  note: pack.resultingTotalLabel,
                  price: pack.monthlyLabel,
                })),
                selectedPlanKey: selectedPack,
                onSelectPlan: setSelectedPack,
                features: {
                  title: t('cloud.storage.purchase.pack.benefits'),
                  items: [t('cloud.storage.purchase.pack.stacks'), t('cloud.storage.purchase.pack.cancel')],
                },
                // The resulting total, not just the increment: a buyer should see
                // what they will have, which no competitor's pack picker shows.
                summary: mockData.purchase.storagePacks.find((pack) => pack.id === selectedPack)?.resultingTotalLabel,
                labels: { checkout: t('cloud.storage.action.buy.now'), close: t('cloud.storage.action.close') },
                leadingAction: (
                  <button
                    type="button"
                    className={styles.backToPlans}
                    data-testid="pack-back-to-plans"
                    onClick={() => setPurchasePath('subscription')}
                    aria-label={t('cloud.storage.purchase.back')}
                  >
                    ‹
                  </button>
                ),
              })}
        />
        </div>
      )}
    </div>
  );
}
