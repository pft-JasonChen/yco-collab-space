import { useEffect, useMemo, useRef, useState } from 'react';
import NavigationHeader from '../../../platform/ui/navigation-header/index.js';
import CategoryRail from '../../../platform/ui/category-rail/index.js';
import GalleryTabs from '../../../platform/ui/gallery-tabs/index.js';
import GalleryGrid, { bucketRatio } from '../../../platform/ui/gallery-grid/index.js';
import GalleryCell from '../../../platform/ui/gallery-cell/index.js';
import SelectionToolbar, { SelectAllHeader } from '../../../platform/ui/selection-toolbar/index.js';
import ConfirmDialog, { Modal } from '../../../platform/ui/confirm-dialog/index.js';
import PricingOverlay from '../../../platform/ui/pricing-overlay/index.js';
import DropdownSelect from '../../../platform/ui/dropdown-select/index.js';
import CellActions from '../../../platform/ui/cell-actions/index.js';
import DataTable, {
  TableActionsCell,
  TableCell,
  TableIconButton,
  TableMediaCell,
  TableRow,
} from '../../../platform/ui/data-table/index.js';
import EmptyImage from '../../../platform/ui/empty-image/index.js';
import Button from '../../../platform/ui/button/index.js';
import { createTranslator } from '../../../platform/runtime/i18n.js';
import dictionary from '../product/i18n.json';
import mockData from '../product/mocks/cloud-storage.json';
import {
  DemoWidget,
  StorageFullDialog,
  StorageMeter,
  StorageStateBanner,
  resolveStorageState,
} from './storage.jsx';
import styles from './index.module.scss';
import downloadGlyph from '../../../design-library/assets/icon/yco-home-gallery/images__icon_download_w.svg';

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
  'item-agent-hero-still': landscapeColorize,
  'item-agent-hero-cut': videoPoster,
  'item-agent-portrait-set': portraitHairstyle,
};

const FOLDER_COVERS = {
  'folder-campaign': squareReshape,
  'folder-reels': tallClothes,
};

const VIDEO_TABS = new Set(['videos']);

// The rail collapses into the header drawer at the width the shared header
// switches to its own mobile row, so category navigation is never absent.
const NARROW_QUERY = '(max-width: 768px)';

// Literal lookups rather than interpolated keys. The handoff validator extracts
// only single-quoted literal keys, so a key built by interpolation would travel
// to RD undeclared while reading as an unused entry in this feature's own
// dictionary — the two failures that check exists to catch.
const TAB_LABELS = {
  projects: t('cloud.storage.tab.projects'),
  images: t('cloud.storage.tab.images'),
  videos: t('cloud.storage.tab.videos'),
  agent: t('cloud.storage.tab.agent'),
  uploads: t('cloud.storage.tab.uploads'),
  trash: t('cloud.storage.tab.trash'),
};

const EMPTY_COPY = {
  projects: t('cloud.storage.empty.projects'),
  images: t('cloud.storage.empty.images'),
  videos: t('cloud.storage.empty.videos'),
  agent: t('cloud.storage.empty.agent'),
  uploads: t('cloud.storage.empty.uploads'),
  // Trash could not be emptied before, so it never had one.
  trash: t('cloud.storage.empty.trash'),
};

// Both tables are the shared data-table now, so their difference is a column
// list rather than a second stylesheet. `narrowHidden` replaces the hand-written
// `:nth-child()` hiding the Trash table used below the tablet breakpoint.
const LIST_COLUMNS = [
  { key: 'name', label: t('cloud.storage.column.name') },
  { key: 'type', label: t('cloud.storage.column.type'), width: '112px' },
  { key: 'size', label: t('cloud.storage.column.size'), width: '96px', narrowHidden: true },
  { key: 'modified', label: t('cloud.storage.column.modified'), width: '148px' },
  { key: 'actions', label: '', srLabel: t('cloud.storage.column.actions'), width: '120px', align: 'end' },
];

const TRASH_COLUMNS = [
  { key: 'name', label: t('cloud.storage.column.name') },
  { key: 'type', label: t('cloud.storage.column.type'), width: '112px', narrowHidden: true },
  { key: 'deleted', label: t('cloud.storage.column.deleted'), width: '148px', narrowHidden: true },
  { key: 'remaining', label: t('cloud.storage.column.remaining'), width: '148px' },
  { key: 'actions', label: '', srLabel: t('cloud.storage.column.actions'), width: '120px', align: 'end' },
];

const MEDIA_LABELS = {
  all: t('cloud.storage.filter.media.all'),
  image: t('cloud.storage.filter.media.image'),
  video: t('cloud.storage.filter.media.video'),
};

const SORT_LABELS = {
  modified: t('cloud.storage.sort.modified'),
  created: t('cloud.storage.sort.created'),
};

const ORDER_LABELS = {
  desc: t('cloud.storage.sort.newest'),
  asc: t('cloud.storage.sort.oldest'),
};

const SORT_GROUP_FIELD = t('cloud.storage.sort.group.field');
const SORT_GROUP_ORDER = t('cloud.storage.sort.group.order');
const ORDER_KEYS = new Set(['desc', 'asc']);

const CREATE_LABELS = {
  'upload-file': t('cloud.storage.action.upload.file'),
  'upload-folder': t('cloud.storage.action.upload.folder'),
  'new-folder': t('cloud.storage.action.create.folder'),
  'new-project': t('cloud.storage.action.new.project'),
};

const ITEM_MENU_LABELS = {
  open: t('cloud.storage.action.open'),
  continue: t('cloud.storage.action.continue.editor'),
  rename: t('cloud.storage.action.rename'),
  move: t('cloud.storage.action.move'),
  duplicate: t('cloud.storage.action.duplicate'),
  trash: t('cloud.storage.action.trash'),
};

const MENU_GROUP_LABELS = {
  open: t('cloud.storage.menu.group.open'),
  organise: t('cloud.storage.menu.group.organise'),
  remove: t('cloud.storage.menu.group.remove'),
};

// Three labelled groups, destructive last. Download used to be a fourth group
// here; it is a button on the action pill now, which is where RD puts it.
const ITEM_MENU_ITEMS = mockData.itemMenu.map((entry, index) => ({
  key: entry.id,
  label: ITEM_MENU_LABELS[entry.id],
  icon: entry.icon,
  groupLabel: entry.group
    ? MENU_GROUP_LABELS[entry.group]
    : entry.destructive
      ? MENU_GROUP_LABELS.remove
      : undefined,
  dividerBefore: index > 0 && Boolean(entry.group || entry.destructive),
  danger: entry.destructive,
}));

// The create control is per tab: a menu where a tab has more than one way to
// create, a plain button where only one is left, nothing at all in Trash.
const CREATE_CONTROLS = Object.fromEntries(
  Object.entries(mockData.createControls).map(([tab, control]) => [
    tab,
    control.kind === 'menu'
      ? {
          ...control,
          items: control.items.map((entry) => ({
            key: entry.id,
            label: CREATE_LABELS[entry.id],
            dividerBefore: entry.dividerBefore,
          })),
        }
      : control,
  ]),
);

const MEDIA_ITEMS = mockData.mediaFilters.map((entry) => ({
  key: entry.id,
  label: MEDIA_LABELS[entry.id],
}));

const SORT_ITEMS = [
  ...mockData.sortOptions.map((entry, index) => ({
    key: entry.id,
    label: SORT_LABELS[entry.id],
    groupLabel: index === 0 ? SORT_GROUP_FIELD : undefined,
  })),
  ...mockData.sortOrders.map((entry, index) => ({
    key: entry.id,
    label: ORDER_LABELS[entry.id],
    groupLabel: index === 0 ? SORT_GROUP_ORDER : undefined,
    dividerBefore: index === 0,
  })),
];

// Level two is the PM's feature-type sheet: nineteen features under two type
// headers. The group header is the Type column, the row is the Feature column.
const TYPE_LABELS = {
  image: t('cloud.storage.filter.type.image'),
  video: t('cloud.storage.filter.type.video'),
};

const TOOL_FAMILY_ITEMS = mockData.toolFamilies.map((entry) => ({
  key: entry.id,
  label: entry.id === 'all' ? t('cloud.storage.filter.all') : entry.label,
  groupLabel: entry.groupFirst ? TYPE_LABELS[entry.group] : undefined,
  dividerBefore: entry.groupFirst,
}));

// A tab that is already one medium does not need the other medium's features in
// its Type menu: on Images the eleven video features can never match a row, and
// picking one only empties the grid. Those two tabs therefore carry their own
// half of the sheet, without a group header — the header would name the tab you
// are standing on. The mixed tabs (Projects, AI Agent, Uploads) keep all
// nineteen under both headers, because there a video feature is a real filter.
const TAB_TOOL_FAMILY_GROUP = { images: 'image', videos: 'video' };

const ALL_TOOL_FAMILY_ITEM = TOOL_FAMILY_ITEMS[0];

const TOOL_FAMILY_ITEMS_BY_GROUP = Object.fromEntries(
  ['image', 'video'].map((group) => [
    group,
    [
      ALL_TOOL_FAMILY_ITEM,
      ...mockData.toolFamilies
        .filter((entry) => entry.group === group)
        .map((entry) => ({ key: entry.id, label: entry.label })),
    ],
  ]),
);

function toolFamilyItemsFor(tabId) {
  const group = TAB_TOOL_FAMILY_GROUP[tabId];
  return group ? TOOL_FAMILY_ITEMS_BY_GROUP[group] : TOOL_FAMILY_ITEMS;
}

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

const MEDIA_FILTER_TABS = new Set(mockData.mediaFilterTabs);
const ACCEPTED_FORMATS = new Set(mockData.upload.acceptedFormats);

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

let uploadSeq = 0;

export default function CloudStorage() {
  const [activeTab, setActiveTab] = useState('images');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [toolFamily, setToolFamily] = useState('all');
  const [sortField, setSortField] = useState('modified');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [reviewState, setReviewState] = useState(mockData.capacity.defaultReviewState);
  const [planTier, setPlanTier] = useState('free');
  // Starts expanded: a reviewer should see straight away that the capacity
  // states can be changed, and the PM's brief was that it can be minimised to a
  // Demo pill, not that it starts minimised.
  const [demoOpen, setDemoOpen] = useState(true);
  const [openFolderId, setOpenFolderId] = useState(null);
  const [createdFolders, setCreatedFolders] = useState([]);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [selection, setSelection] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [fullDialogOpen, setFullDialogOpen] = useState(false);
  const [trashConfirmId, setTrashConfirmId] = useState(null);
  const [purchasePath, setPurchasePath] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [railKey, setRailKey] = useState('gallery');
  const [planTab, setPlanTab] = useState('pro');
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [selectedPack, setSelectedPack] = useState('pack-100');
  const [packCycle, setPackCycle] = useState('monthly');
  const [uploads, setUploads] = useState([]);
  // Items are local state now: rename, duplicate and move all change them, and a
  // prototype that offered those actions without them taking effect would be
  // showing a menu that does nothing.
  const [library, setLibrary] = useState(mockData.items);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveId, setMoveId] = useState(null);
  const [lastRename, setLastRename] = useState(null);
  const [handoff, setHandoff] = useState(null);
  // Trash is local state for the same reason the library is: restore, delete
  // forever and Empty Trash all change it, and a Trash that offered those and
  // then kept every row would be showing controls that do nothing.
  const [trashItems, setTrashItems] = useState(mockData.trash.items);
  const [deleteForeverIds, setDeleteForeverIds] = useState(null);
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);
  const [restoreToast, setRestoreToast] = useState(false);
  const projectInputRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const fileInputRef = useRef(null);

  // matchMedia rather than CSS alone: the page has to know which element is
  // carrying the category-navigation zone, and a stylesheet cannot tell it.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia(NARROW_QUERY);
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!narrow) setDrawerOpen(false);
  }, [narrow]);

  const usage = useMemo(
    () =>
      mockData.capacity.reviewStates.find((entry) => entry.id === reviewState) ??
      mockData.capacity.reviewStates[0],
    [reviewState],
  );

  // The Pro switch is a review affordance: the same synthetic usage against the
  // paid quota, so a reviewer can see the page without a warning on it.
  const isPro = planTier === 'pro';
  const quotaBytes = isPro
    ? mockData.plan.quotaBytes * 20
    : mockData.plan.quotaBytes;
  const quotaLabel = isPro ? mockData.purchase.subscription.quotaLabel : mockData.plan.quotaLabel;
  const storageState = resolveStorageState(usage.usedBytes, quotaBytes);
  const usageForMeter = { ...usage, quotaBytes, quotaLabel };

  const showMediaFilter = MEDIA_FILTER_TABS.has(activeTab);
  const isTrash = activeTab === 'trash';
  const createControl = CREATE_CONTROLS[activeTab] ?? { kind: 'none' };
  const showFilters = !isTrash;

  const allFolders = useMemo(() => [...createdFolders, ...mockData.folders], [createdFolders]);

  const folders = useMemo(
    () => (openFolderId ? [] : allFolders.filter((folder) => folder.tab === activeTab)),
    [activeTab, openFolderId, allFolders],
  );

  const items = useMemo(() => {
    let rows = library.filter((item) => item.tab === activeTab);
    if (openFolderId) rows = rows.filter((item) => item.folderId === openFolderId);
    if (showMediaFilter && mediaFilter !== 'all') {
      rows = rows.filter((item) => item.media === mediaFilter);
    }
    if (toolFamily !== 'all') rows = rows.filter((item) => item.toolFamily === toolFamily);

    const direction = sortDirection === 'asc' ? 1 : -1;
    const compare = {
      modified: (a, b) => (a.modifiedAt - b.modifiedAt) * direction,
      created: (a, b) => (a.createdAt - b.createdAt) * direction,
    }[sortField];

    return [...rows].sort(compare);
  }, [library, activeTab, openFolderId, mediaFilter, showMediaFilter, toolFamily, sortField, sortDirection]);

  // Selection is cleared on every tab change, so whichever tab is open owns the
  // whole of it. That lets Trash share one selection model with the library
  // tabs — the rows differ, the count and the selected size do not.
  const selectableRows = isTrash ? trashItems : items;

  const selectedBytes = useMemo(
    () =>
      selectableRows
        .filter((row) => selection.includes(row.id))
        .reduce((total, row) => total + row.sizeBytes, 0),
    [selectableRows, selection],
  );

  const openFolder = allFolders.find((folder) => folder.id === openFolderId) ?? null;
  const allSelected =
    selectableRows.length > 0 && selectableRows.every((row) => selection.includes(row.id));
  const uploading = uploads.some((entry) => entry.state === 'uploading');

  // Uploads still in flight tick forward on one interval rather than a timer
  // each, and the interval exists only while something is uploading.
  useEffect(() => {
    if (!uploading) return undefined;
    const handle = window.setInterval(() => {
      setUploads((current) =>
        current
          .map((entry) =>
            entry.state === 'uploading'
              ? { ...entry, percent: Math.min(100, entry.percent + 10) }
              : entry,
          )
          .filter((entry) => !(entry.state === 'uploading' && entry.percent >= 100)),
      );
    }, 400);
    return () => window.clearInterval(handle);
  }, [uploading]);

  function toggleSelected(id) {
    setIsEditing(true);
    setSelection((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function cancelSelection() {
    setIsEditing(false);
    setSelection([]);
  }

  // Select-all is reached from two places — the table header's own box and the
  // batch bar — and both have to mean the same thing, including in Trash.
  function selectAllRows() {
    setIsEditing(true);
    setSelection(allSelected ? [] : selectableRows.map((row) => row.id));
  }

  function changeTab(tabId) {
    setActiveTab(tabId);
    setOpenFolderId(null);
    setSelection([]);
    setIsEditing(false);
    setToolFamily('all');
    setMediaFilter('all');
  }

  function openPurchase(path) {
    setFullDialogOpen(false);
    setPurchaseSuccess(false);
    setPurchasePath(path);
  }

  // The file input is the only upload entry; the create menu opens it.
  function onCreateSelect(key) {
    if (key === 'new-folder') {
      setFolderName(t('cloud.storage.folder.name.default'));
      setFolderDialogOpen(true);
      return;
    }
    // Creating a project is a handoff, not a save, so it is not gated on space.
    if (key === 'new-project') {
      projectInputRef.current?.click();
      return;
    }
    if (storageState === 'full') {
      setFullDialogOpen(true);
      return;
    }
    fileInputRef.current?.click();
  }

  // The editor lives at another route entirely, so the prototype names the
  // boundary rather than pretending to open it.
  function onProjectSource(event) {
    if ((event.target.files ?? []).length === 0) return;
    event.target.value = '';
    setHandoff(mockData.projectHandoff.route);
  }

  // Format is judged before quota, so an unsupported file reports a format
  // failure even when the library is also full — buying storage would not help
  // it, which is the distinction CS-010 and CS-011 assert.
  function onFilesChosen(event) {
    const chosen = Array.from(event.target.files ?? []);
    if (chosen.length === 0) return;

    const queued = chosen.map((file) => {
      uploadSeq += 1;
      const base = {
        id: `upload-${uploadSeq}`,
        name: file.name,
        sizeLabel: formatMb(file.size || 0),
        percent: 0,
      };
      if (!ACCEPTED_FORMATS.has(file.type)) return { ...base, state: 'failed-format' };
      if (storageState === 'critical' || storageState === 'full') {
        return { ...base, state: 'failed-quota' };
      }
      return { ...base, state: 'uploading' };
    });

    setUploads((current) => [...queued, ...current]);
    event.target.value = '';
  }

  function completePurchase() {
    setPurchasePath(null);
    setPurchaseSuccess(true);
    setReviewState('normal');
    setUploads((current) =>
      current.map((entry) =>
        entry.state === 'failed-quota' ? { ...entry, state: 'uploading', percent: 0 } : entry,
      ),
    );
  }

  function renameItem() {
    const name = renameValue.trim();
    if (!name) return;
    setLibrary((current) =>
      current.map((item) => (item.id === renameId ? { ...item, name } : item)),
    );
    setLastRename(name);
    setRenameId(null);
  }

  function duplicateItem(id) {
    setLibrary((current) => {
      const source = current.find((item) => item.id === id);
      if (!source) return current;
      const copy = {
        ...source,
        id: `${source.id}-copy-${current.length}`,
        name: t('cloud.storage.duplicate.suffix', { name: source.name }),
      };
      const at = current.findIndex((item) => item.id === id);
      return [...current.slice(0, at + 1), copy, ...current.slice(at + 1)];
    });
  }

  function moveItemTo(folderId) {
    setLibrary((current) =>
      current.map((item) => (item.id === moveId ? { ...item, folderId } : item)),
    );
    setMoveId(null);
  }

  // Moving needs somewhere to move to. Where the tab has no folders yet the
  // create dialog opens instead of an empty picker, and confirming it both
  // creates the folder and moves the item into it.
  function startMove(id) {
    setMoveId(id);
    if (folders.length === 0) {
      setFolderName(t('cloud.storage.folder.name.default'));
      setFolderDialogOpen(true);
    }
  }

  // Restoring puts the row back where it came from. The mock carries the tab and
  // folder it was deleted out of, so this is a real move rather than a row that
  // simply disappears — otherwise Restore and Delete forever would look the same
  // from the grid.
  function restoreFromTrash(ids) {
    const restoring = trashItems.filter((entry) => ids.includes(entry.id));
    if (restoring.length === 0) return;
    setLibrary((current) => [
      ...restoring.map((entry) => ({
        id: `restored-${entry.id}`,
        tab: entry.restoreTab,
        folderId: entry.restoreFolderId,
        name: entry.name,
        type: entry.type,
        toolFamily: 'all',
        sizeBytes: entry.sizeBytes,
        sizeLabel: entry.sizeLabel,
        ratio: 1.5,
        media: entry.type === 'Video' ? 'video' : 'image',
        createdLabel: entry.deletedLabel,
        modifiedLabel: entry.deletedLabel,
        createdAt: 20260916,
        modifiedAt: 20260916,
      })),
      ...current,
    ]);
    setTrashItems((current) => current.filter((entry) => !ids.includes(entry.id)));
    setSelection((current) => current.filter((id) => !ids.includes(id)));
    setRestoreToast(true);
  }

  function deleteForever(ids) {
    setTrashItems((current) => current.filter((entry) => !ids.includes(entry.id)));
    setSelection((current) => current.filter((id) => !ids.includes(id)));
    setDeleteForeverIds(null);
  }

  function emptyTrash() {
    setTrashItems([]);
    setSelection([]);
    setIsEditing(false);
    setEmptyTrashOpen(false);
  }

  function confirmFolder() {
    const name = folderName.trim() || t('cloud.storage.folder.name.default');
    const id = `folder-local-${createdFolders.length + 1}`;
    setCreatedFolders((current) => [
      {
        id,
        tab: activeTab,
        name,
        itemCount: moveId ? 1 : 0,
        createdLabel: mockData.trash.items[0]?.deletedLabel ?? '',
      },
      ...current,
    ]);
    if (moveId) moveItemTo(id);
    setFolderDialogOpen(false);
  }

  const subscription = mockData.purchase.subscription;
  const packs = mockData.purchase.storagePacks;
  const activePack = packs.find((pack) => pack.id === selectedPack) ?? packs[0];
  const cycleLabel = packCycle === 'yearly' ? activePack.yearlyLabel : activePack.monthlyLabel;

  // RD's own on-photo cluster: Download is a button on a translucent pill and
  // More opens the dark menu. A borderless toolbar trigger was used here before
  // and disappeared against light thumbnails.
  const itemMenu = (item) => (
    <CellActions
      onDownload={() => {}}
      downloadLabel={t('cloud.storage.action.download')}
      moreLabel={t('cloud.storage.action.more')}
      testId="item-menu-trigger"
      menuTestId="item-menu"
      menuItems={ITEM_MENU_ITEMS.map((entry) => ({
        ...entry,
        onSelect: () => onRowMenuSelect(item, entry.key),
      }))}
    />
  );

  function renderCell(item) {
    const isVideo = VIDEO_TABS.has(item.tab) || item.type === 'Video';
    return (
      <div className={styles.cellWrap} key={item.id}>
        <GalleryCell
          aspectRatio={bucketRatio(ratioOf(item))}
          thumbnail={THUMBNAILS[item.id]}
          alt={item.name}
          isVideo={isVideo}
          videoSrc={isVideo ? sampleClip : undefined}
          domId={`cloud-storage-${item.id}`}
          checkboxPosition="top-left"
          checkboxOnHover
          isSelected={selection.includes(item.id)}
          onToggleSelect={() => toggleSelected(item.id)}
          selectLabel={t('cloud.storage.select.item')}
          onClick={() => {
            if (isEditing) toggleSelected(item.id);
          }}
          actions={itemMenu(item)}
        />
        <div className={styles.cellMeta}>
          <span className={styles.cellName} data-testid="cell-name">
            {item.name}
          </span>
          {/* Type, size, date — the same three facts, in the same order, that
              the list view's columns carry. Size returned on 2026-09-16: a cell
              that states what a file is and when it was made but not how big it
              is cannot support any decision about space, which is the one thing
              this page's meter keeps asking the user to make. */}
          <span className={styles.cellFacts}>
            <span data-testid="cell-type">{item.type}</span>
            <span data-testid="cell-size">{item.sizeLabel}</span>
            <span data-testid="cell-date">{item.modifiedLabel}</span>
          </span>
          {/* A flat list of agent results would otherwise lose which ones came
              out of the same conversation. */}
          {item.sessionName && (
            <span className={styles.cellSession} data-testid="cell-session">
              {t('cloud.storage.cell.session', { session: item.sessionName })}
            </span>
          )}
        </div>
      </div>
    );
  }

  function renderUploadCell(entry) {
    const failed = entry.state !== 'uploading';
    return (
      <div className={styles.cellWrap} key={entry.id}>
        <div
          className={styles.uploadCell}
          data-testid={failed ? 'upload-cell-failed' : 'upload-cell'}
          data-component-role="upload-progress-cell"
          data-upload-state={entry.state}
        >
          <div className={`${styles.uploadMedia} ${failed ? '' : styles.uploadShimmer}`} />
          <div className={styles.uploadOverlay}>
            <span className={styles.uploadName} data-testid="upload-cell-name">
              {entry.name}
            </span>

            {entry.state === 'uploading' && (
              <>
                <span className={styles.uploadTrack} data-testid="upload-progress-bar">
                  <span className={styles.uploadFill} style={{ width: `${entry.percent}%` }} />
                </span>
                <span className={styles.uploadPercent}>
                  {t('cloud.storage.upload.progress', { percent: entry.percent })}
                </span>
                <button
                  type="button"
                  className={styles.uploadLink}
                  data-testid="upload-cancel"
                  onClick={() =>
                    setUploads((current) => current.filter((row) => row.id !== entry.id))
                  }
                >
                  {t('cloud.storage.upload.cancel')}
                </button>
              </>
            )}

            {entry.state === 'failed-quota' && (
              <>
                <span className={styles.uploadFailQuota}>
                  {t('cloud.storage.upload.failed.quota')}
                </span>
                <span className={styles.uploadSize}>{entry.sizeLabel}</span>
                {/* Remove clears the blocked file, Upgrade buys the space it
                    needs. No retry: retrying cannot succeed until space exists,
                    which is what CS-010 asserts. */}
                <span className={styles.uploadActions}>
                  <button
                    type="button"
                    className={styles.uploadLink}
                    data-testid="quota-failure-remove"
                    onClick={() =>
                      setUploads((current) => current.filter((row) => row.id !== entry.id))
                    }
                  >
                    {t('cloud.storage.action.remove')}
                  </button>
                  <button
                    type="button"
                    className={styles.uploadLink}
                    data-testid="quota-failure-expand"
                    onClick={() => openPurchase('packs')}
                  >
                    {t('cloud.storage.action.expand')}
                  </button>
                </span>
              </>
            )}

            {entry.state === 'failed-format' && (
              <>
                <span className={styles.uploadFailFormat}>
                  {t('cloud.storage.upload.failed.format')}
                </span>
                <button
                  type="button"
                  className={styles.uploadLink}
                  data-testid="format-failure-choose-another"
                  onClick={() => {
                    setUploads((current) => current.filter((row) => row.id !== entry.id));
                    fileInputRef.current?.click();
                  }}
                >
                  {t('cloud.storage.upload.choose.another')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // The row menu on a table is the same list of intents the on-photo pill
  // carries, without the pill: CellActions exists to stay legible over a
  // photograph, and on a white table its translucent dark ground is the one
  // thing on the page that does not belong to the table. Trash's row menu was
  // already this control, which is why the two tables can now share it.
  const rowMenu = (item, items) => (
    <DropdownSelect
      items={items}
      mode="menu"
      variant="plain"
      align="end"
      menuFixed
      ariaLabel={t('cloud.storage.action.more')}
      testId="row-menu"
      trigger={<span aria-hidden="true">···</span>}
      onSelect={(key) => onRowMenuSelect(item, key)}
    />
  );

  function onRowMenuSelect(item, key) {
    if (key === 'trash') setTrashConfirmId(item.id);
    if (key === 'duplicate') duplicateItem(item.id);
    if (key === 'move') startMove(item.id);
    if (key === 'rename') {
      setRenameValue(item.name);
      setRenameId(item.id);
    }
  }

  function renderRow(item) {
    return (
      <TableRow
        key={item.id}
        data-testid="item-row"
        selectable
        selected={selection.includes(item.id)}
        onToggleSelect={() => toggleSelected(item.id)}
        selectLabel={t('cloud.storage.select.item')}
        selectTestId="row-select"
      >
        <TableMediaCell
          thumbnail={THUMBNAILS[item.id]}
          primary={item.name}
          secondary={
            item.sessionName
              ? t('cloud.storage.cell.session', { session: item.sessionName })
              : undefined
          }
          secondaryTestId={item.sessionName ? 'cell-session' : undefined}
        />
        <TableCell>{item.type}</TableCell>
        <TableCell data-narrow-hidden="true">{item.sizeLabel}</TableCell>
        <TableCell data-testid="row-modified">{item.modifiedLabel}</TableCell>
        <TableActionsCell>
          <TableIconButton
            icon={downloadGlyph}
            label={t('cloud.storage.action.download')}
            testId="row-download"
          />
          {rowMenu(item, ITEM_MENU_ITEMS)}
        </TableActionsCell>
      </TableRow>
    );
  }

  function renderTrashRow(entry) {
    return (
      <TableRow
        key={entry.id}
        data-testid="trash-row"
        selectable
        selected={selection.includes(entry.id)}
        onToggleSelect={() => toggleSelected(entry.id)}
        selectLabel={t('cloud.storage.select.item')}
        selectTestId="trash-row-select"
      >
        <TableMediaCell
          thumbnail={THUMBNAILS[entry.sourceId] ?? wideEnhance}
          primary={entry.name}
          secondary={entry.sizeLabel}
        />
        <TableCell data-narrow-hidden="true">{entry.type}</TableCell>
        <TableCell data-narrow-hidden="true">{entry.deletedLabel}</TableCell>
        <TableCell
          className={
            entry.daysRemaining <= 1 ? styles.trashCountdownFinal : styles.trashCountdown
          }
          data-testid="trash-countdown"
          data-component-role="trash-countdown"
        >
          {entry.daysRemaining <= 1
            ? t('cloud.storage.trash.countdown.last')
            : t('cloud.storage.trash.countdown', { days: entry.daysRemaining })}
        </TableCell>
        <TableActionsCell>
          <DropdownSelect
            items={[
              { key: 'restore', label: t('cloud.storage.action.restore') },
              {
                key: 'delete-forever',
                label: t('cloud.storage.action.delete.forever'),
                destructive: true,
                dividerBefore: true,
              },
            ]}
            mode="menu"
            variant="plain"
            align="end"
            menuFixed
            ariaLabel={t('cloud.storage.action.more')}
            testId="trash-row-menu"
            trigger={<span aria-hidden="true">···</span>}
            onSelect={(key) => {
              if (key === 'restore') restoreFromTrash([entry.id]);
              if (key === 'delete-forever') setDeleteForeverIds([entry.id]);
            }}
          />
        </TableActionsCell>
      </TableRow>
    );
  }

  const railNode = (
    <CategoryRail
      className={styles.rail}
      items={RAIL_ITEMS}
      activeKey={railKey}
      onSelect={(key) => {
        setRailKey(key);
        setDrawerOpen(false);
      }}
      ariaLabel={t('cloud.storage.rail.label')}
    />
  );

  return (
    <div className={styles.page} data-testid="cloud-storage-page" data-horizontal-overflow="false">
      {/* The category-navigation zone travels: above the breakpoint it is the
          rail, below it the header drawer. Marking it on whichever element
          actually carries category navigation is what keeps the surface
          structure honest at every width, rather than asserting a hidden
          element is present. */}
      <div data-surface-zone="global-header">
        <div
          className={styles.headerZone}
          data-surface-zone={narrow ? 'category-navigation' : undefined}
          data-component-role={narrow ? 'category-entry' : undefined}
          data-testid={narrow ? 'category-entry' : undefined}
        >
          <NavigationHeader
            userType={isPro ? 'pro' : 'free'}
            showCredits
            creditBalance={320}
            showFeatureName={false}
            showFeatureInfo={false}
            onMenuToggle={() => setDrawerOpen(true)}
            onUpgrade={() => openPurchase('subscription')}
          />
        </div>
      </div>

      <div className={styles.body}>
        <div
          className={styles.railZone}
          data-surface-zone={narrow ? undefined : 'category-navigation'}
          data-component-role={narrow ? undefined : 'category-entry'}
          data-testid={narrow ? undefined : 'category-entry'}
        >
          {!narrow && railNode}
        </div>

        <main
          className={styles.main}
          data-surface-zone="gallery-content"
          data-component-role="page-shell"
        >
          {/* Inside a folder the header states where you are rather than where
              you could go: the breadcrumb takes the title's place and the tab
              row and capacity meter are hidden, following Fotor's own folder
              view. The breadcrumb root is the tab you came from, and it is the
              way back. */}
          <header
            className={styles.heading}
            data-surface-zone="gallery-heading"
            data-testid="gallery-heading"
            data-meter-adjacent={openFolder ? undefined : 'true'}
            data-scope={openFolder ? 'folder' : 'root'}
          >
            {openFolder ? (
              <nav
                className={styles.breadcrumb}
                data-surface-zone="folder-navigation"
                data-component-role="folder-breadcrumb"
                data-testid="folder-breadcrumb"
                aria-label={t('cloud.storage.section.folders')}
              >
                <button
                  type="button"
                  className={styles.breadcrumbRoot}
                  data-testid="breadcrumb-root"
                  onClick={() => setOpenFolderId(null)}
                >
                  {TAB_LABELS[activeTab]}
                </button>
                <span className={styles.breadcrumbSeparator} aria-hidden="true">
                  ›
                </span>
                <span className={styles.breadcrumbCurrent} aria-current="page">
                  {openFolder.name}
                </span>
              </nav>
            ) : (
              <>
                <h1 className={styles.title} data-testid="page-title">
                  {t('cloud.storage.page.title')}
                </h1>
                <div data-surface-zone="capacity-summary" className={styles.meterZone}>
                  <StorageMeter
                    t={t}
                    usage={usageForMeter}
                    state={storageState}
                    isPro={isPro}
                    onUpgrade={() => openPurchase('subscription')}
                    onExpand={() => openPurchase('packs')}
                  />
                </div>
              </>
            )}
          </header>

          {(storageState === 'critical' || storageState === 'full') && (
            <StorageStateBanner
              t={t}
              usage={usageForMeter}
              state={storageState}
              onExpand={() => openPurchase('packs')}
            />
          )}

          {!openFolder && (
          <GalleryTabs
            className={styles.tabRow}
            tabs={mockData.tabs.map((tab) => ({ key: tab.id, label: TAB_LABELS[tab.id] }))}
            activeKey={activeTab}
            onTabChange={changeTab}
            ariaLabel={t('cloud.storage.tabs.label')}
          />
          )}

          <div className={styles.toolbar} data-surface-zone="gallery-actions">
            <div className={styles.toolbarLeft}>
              {showFilters && showMediaFilter && (
                <span data-testid="media-filter" data-level="2">
                  <DropdownSelect
                    items={MEDIA_ITEMS}
                    selectedKey={mediaFilter}
                    onSelect={setMediaFilter}
                    label={t('cloud.storage.filter.media')}
                    ariaLabel={t('cloud.storage.filter.media')}
                  />
                </span>
              )}
              {showFilters && (
                <span
                  data-testid="tool-family-filter"
                  data-component-role="tool-family-filter"
                  data-level="2"
                >
                  <DropdownSelect
                    items={toolFamilyItemsFor(activeTab)}
                    selectedKey={toolFamily}
                    onSelect={setToolFamily}
                    label={t('cloud.storage.filter.tool')}
                    ariaLabel={t('cloud.storage.filter.tool')}
                  />
                </span>
              )}
            </div>

            <div className={styles.toolbarRight}>
              {showFilters && (
                <span data-testid="sort-control" data-component-role="sort-control">
                  {/* Field and order are two groups in one menu. The separate
                      direction icon it replaces cost a toolbar slot and said
                      nothing until you already knew what it did. */}
                  <DropdownSelect
                    items={SORT_ITEMS}
                    selectedKeys={[sortField, sortDirection]}
                    onSelect={(key) =>
                      ORDER_KEYS.has(key) ? setSortDirection(key) : setSortField(key)
                    }
                    align="end"
                    ariaLabel={t('cloud.storage.sort.label')}
                  />
                </span>
              )}
              <button
                type="button"
                className={styles.iconControl}
                data-testid="view-toggle"
                data-component-role="view-control"
                data-view={viewMode}
                aria-label={
                  viewMode === 'grid' ? t('cloud.storage.view.list') : t('cloud.storage.view.grid')
                }
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? '▤' : '▦'}
              </button>
              {createControl.kind === 'menu' && (
                <span
                  data-testid="create-entry"
                  data-component-role="create-menu"
                  className={styles.createEntry}
                >
                  <DropdownSelect
                    items={createControl.items}
                    mode="menu"
                    variant="primary"
                    align="end"
                    ariaLabel={t('cloud.storage.action.new')}
                    trigger={
                      <span className={styles.createLabel}>
                        {t('cloud.storage.action.new')}
                        <span aria-hidden="true">＋</span>
                      </span>
                    }
                    onSelect={onCreateSelect}
                  />
                </span>
              )}
              {/* One action left, so it is a button rather than a menu of one. */}
              {createControl.kind === 'button' && (
                <Button
                  variant="secondary"
                  size="small"
                  data-testid="create-folder-entry"
                  data-component-role="create-menu"
                  onClick={() => onCreateSelect(createControl.action)}
                >
                  {t('cloud.storage.action.create.folder')}
                </Button>
              )}
              {isTrash && (
                <Button
                  variant="secondary"
                  tone="destructive"
                  size="small"
                  data-testid="trash-empty-all"
                  data-component-role="create-menu"
                  disabled={trashItems.length === 0}
                  onClick={() => setEmptyTrashOpen(true)}
                >
                  {t('cloud.storage.action.empty.trash')}
                </Button>
              )}
            </div>
          </div>

          {isEditing && (
            <div
              className={styles.batchToolbar}
              data-testid="batch-toolbar"
              data-component-role="batch-toolbar"
            >
              <SelectionToolbar
                isEditing={isEditing}
                variant="ghost"
                onExit={cancelSelection}
                onToggleEditing={cancelSelection}
                deleteDisabled={selection.length === 0}
                downloadDisabled={selection.length === 0}
                onDelete={() =>
                  isTrash
                    ? setDeleteForeverIds(selection)
                    : setTrashConfirmId(selection[0] ?? null)
                }
                /* Exporting out of Trash would be a way to keep a file you have
                   already thrown away, so the bar there offers only the two
                   things Trash is for. */
                onDownload={isTrash ? undefined : () => {}}
                labels={{
                  exit: t('cloud.storage.action.exit.selection'),
                  cancel: t('cloud.storage.action.cancel'),
                  select: t('cloud.storage.action.select.all'),
                  delete: isTrash
                    ? t('cloud.storage.action.delete.forever')
                    : t('cloud.storage.action.trash'),
                  download: t('cloud.storage.action.export'),
                }}
                extraActions={
                  /* Neither Move nor Restore has an RD counterpart — its editing
                     toolbar has no batch move at all — so the feature supplies
                     them through the ghost slot, which keeps delete last. */
                  isTrash ? (
                    <button
                      type="button"
                      className={styles.batchGhost}
                      data-testid="batch-restore"
                      disabled={selection.length === 0}
                      onClick={() => restoreFromTrash(selection)}
                    >
                      {t('cloud.storage.action.restore')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.batchGhost}
                      data-testid="batch-move"
                      disabled={selection.length === 0}
                    >
                      {t('cloud.storage.action.move')}
                    </button>
                  )
                }
              >
                {/* The translator has no plural rules, so the singular is its
                    own key — the same shape the trash countdown's final day
                    uses. Emptying the selection keeps the bar, because select-all
                    is still useful there, but the actions are disabled. */}
                <span data-testid="selected-count" className={styles.batchCount}>
                  {selection.length === 1
                    ? t('cloud.storage.batch.items.one')
                    : t('cloud.storage.batch.items', { count: selection.length })}
                </span>
                <span className={styles.batchSize} data-testid="selected-size">
                  {formatMb(selectedBytes)}
                </span>
                <SelectAllHeader
                  isEditing={isEditing}
                  isSelectAll={allSelected}
                  onToggleSelectAll={selectAllRows}
                  labels={{ selectAll: t('cloud.storage.action.select.all') }}
                />
              </SelectionToolbar>
            </div>
          )}

          <section
            className={styles.section}
            data-testid="gallery-grid-section"
            data-sort={sortField}
            data-direction={sortDirection}
            data-view={viewMode}
            data-media={mediaFilter}
            data-last-rename={lastRename ?? undefined}
            data-scope={openFolderId ? 'folder' : 'root'}
          >
            {!isTrash && viewMode === 'grid' && folders.length > 0 && (
              <>
              <h2 className={styles.sectionTitle} data-testid="section-folders">
                {t('cloud.storage.section.folders')}
              </h2>
              <div className={styles.folderRow}>
                {folders.map((folder) => (
                  <button
                    type="button"
                    className={styles.folderCard}
                    data-testid="folder-card"
                    data-component-role="folder-card"
                    data-item-count={String(folder.itemCount)}
                    key={folder.id}
                    onClick={() => setOpenFolderId(folder.id)}
                  >
                    <span
                      className={styles.folderCover}
                      style={
                        FOLDER_COVERS[folder.id]
                          ? { backgroundImage: `url(${FOLDER_COVERS[folder.id]})` }
                          : undefined
                      }
                    >
                      <span className={styles.folderCount} data-testid="folder-count">
                        {folder.itemCount}
                      </span>
                    </span>
                    <span className={styles.folderName}>{folder.name}</span>
                    {/* CapCut's shape: the count is a badge on the cover and the
                        caption is when it was made. File size left the product
                        with the cleanup path, so it does not belong here either. */}
                    <span className={styles.folderMeta} data-testid="folder-created">
                      {t('cloud.storage.folder.created', { date: folder.createdLabel })}
                    </span>
                  </button>
                ))}
              </div>
              </>
            )}

            {!isTrash && (
              <h2 className={styles.sectionTitle} data-testid="section-files">
                {t('cloud.storage.section.files')}
              </h2>
            )}

            {/* Upload feedback appears in the grid itself rather than a queue
                panel, so the zone is the grid region. */}
            <div data-surface-zone="upload-feedback" className={styles.gridZone}>
              {isTrash ? (
                <div className={styles.trashList} data-surface-zone="trash-management">
                  <p
                    className={styles.trashBanner}
                    data-testid="trash-policy-banner"
                    data-component-role="trash-policy-banner"
                    data-counts-against-quota="true"
                  >
                    {t('cloud.storage.trash.policy', { days: mockData.trash.retentionDays })}
                  </p>
                  <span className={styles.trashSort} data-testid="trash-grid" data-sort="date-moved">
                    {t('cloud.storage.trash.sort')}
                  </span>

                  {/* The shared table, same as the list view: name, type, when it
                      was deleted and how long is left. There is no People column
                      because sharing is out of scope for v1. */}
                  {trashItems.length === 0 ? (
                    <div
                      className={styles.empty}
                      data-testid="empty-state"
                      data-component-role="empty-state"
                    >
                      <EmptyImage type="general" />
                      <p className={styles.emptyTitle}>{EMPTY_COPY.trash}</p>
                    </div>
                  ) : (
                    <DataTable
                      columns={TRASH_COLUMNS}
                      testId="trash-table"
                      selectable
                      allSelected={allSelected}
                      onToggleAll={selectAllRows}
                      labels={{ selectAll: t('cloud.storage.action.select.all') }}
                    >
                      {trashItems.map(renderTrashRow)}
                    </DataTable>
                  )}
                </div>
              ) : viewMode === 'list' ? (
                <div className={styles.list}>
                  {uploads.length > 0 && (
                    <div className={styles.listUploads}>{uploads.map(renderUploadCell)}</div>
                  )}
                  <DataTable
                    columns={LIST_COLUMNS}
                    testId="item-table"
                    selectable
                    allSelected={allSelected}
                    onToggleAll={selectAllRows}
                    labels={{ selectAll: t('cloud.storage.action.select.all') }}
                  >
                    {items.map(renderRow)}
                  </DataTable>
                </div>
              ) : items.length === 0 && uploads.length === 0 ? (
                <div
                  className={styles.empty}
                  data-testid="empty-state"
                  data-component-role="empty-state"
                >
                  <EmptyImage type={emptyTypeFor(activeTab)} />
                  <p className={styles.emptyTitle}>{EMPTY_COPY[activeTab]}</p>
                </div>
              ) : (
                <GalleryGrid
                  items={[...uploads, ...items]}
                  getKey={(entry) => entry.id}
                  getRatio={(entry) => (entry.state ? 1.5 : bucketRatio(ratioOf(entry)))}
                  renderCell={(entry) => (entry.state ? renderUploadCell(entry) : renderCell(entry))}
                />
              )}
            </div>
          </section>
        </main>
      </div>

      {/* One hidden input behind the create menu: the only upload entry. */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className={styles.fileInput}
        data-testid="upload-input"
        accept={mockData.upload.acceptedFormats.join(',')}
        onChange={onFilesChosen}
      />

      {/* Creating a project picks a source and then hands off; it never saves
          into this library, so it has its own input. */}
      <input
        ref={projectInputRef}
        type="file"
        className={styles.fileInput}
        data-testid="project-input"
        accept={mockData.upload.acceptedFormats.join(',')}
        onChange={onProjectSource}
      />

      {handoff && (
        <p
          className={styles.successToast}
          data-testid="editor-handoff"
          data-route={handoff}
          role="status"
          onClick={() => setHandoff(null)}
        >
          {t('cloud.storage.handoff.editor', { route: handoff })}
        </p>
      )}

      {/* One dialog for one row and for a selection: deleting permanently is the
          same promise either way, and the body names what is going rather than
          leaving the count to the bar behind the dialog. */}
      {deleteForeverIds && deleteForeverIds.length > 0 && (
        <ConfirmDialog
          opened
          title={t('cloud.storage.trash.confirm.forever.title')}
          description={
            deleteForeverIds.length === 1
              ? t('cloud.storage.trash.confirm.forever.body', {
                  name: trashItems.find((entry) => entry.id === deleteForeverIds[0])?.name ?? '',
                })
              : t('cloud.storage.trash.confirm.forever.body.many', {
                  count: deleteForeverIds.length,
                })
          }
          confirmLabel={t('cloud.storage.action.delete.forever')}
          cancelLabel={t('cloud.storage.action.cancel')}
          tone="destructive"
          closeLabel={t('cloud.storage.action.close')}
          onConfirm={() => deleteForever(deleteForeverIds)}
          onCancel={() => setDeleteForeverIds(null)}
          testId="delete-forever-dialog"
        />
      )}

      {emptyTrashOpen && (
        <ConfirmDialog
          opened
          title={t('cloud.storage.trash.empty.title')}
          description={
            trashItems.length === 1
              ? t('cloud.storage.trash.empty.body.one')
              : t('cloud.storage.trash.empty.body', { count: trashItems.length })
          }
          confirmLabel={t('cloud.storage.action.empty.trash')}
          cancelLabel={t('cloud.storage.action.cancel')}
          tone="destructive"
          closeLabel={t('cloud.storage.action.close')}
          onConfirm={emptyTrash}
          onCancel={() => setEmptyTrashOpen(false)}
          testId="empty-trash-dialog"
        />
      )}

      {/* Restoring moves a row to another tab, so without this the only visible
          effect is that it vanished — the same thing deleting it looks like. */}
      {restoreToast && (
        <p
          className={styles.successToast}
          data-testid="trash-restore-toast"
          role="status"
          onClick={() => setRestoreToast(false)}
        >
          {t('cloud.storage.trash.restore.done')}
        </p>
      )}

      {narrow && drawerOpen && (
        <Modal
          opened
          handleClose={() => setDrawerOpen(false)}
          ariaLabel={t('cloud.storage.drawer.title')}
          modalClassName={styles.drawerModal}
        >
          <div className={styles.drawer}>{railNode}</div>
        </Modal>
      )}

      {renameId && (
        <ConfirmDialog
          opened
          title={t('cloud.storage.rename.title')}
          description={
            <label className={styles.folderField}>
              <span>{t('cloud.storage.rename.label')}</span>
              <input
                className={styles.folderInput}
                data-testid="rename-input"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
              />
            </label>
          }
          confirmLabel={t('cloud.storage.rename.title')}
          cancelLabel={t('cloud.storage.action.cancel')}
          tone="brand"
          closeLabel={t('cloud.storage.action.close')}
          onConfirm={renameItem}
          onCancel={() => setRenameId(null)}
          testId="rename-dialog"
        />
      )}

      {/* A picker only exists once there is something to pick. With no folders
          in the tab the create dialog opens instead and doubles as the move. */}
      {moveId && !folderDialogOpen && folders.length > 0 && (
        <ConfirmDialog
          opened
          title={t('cloud.storage.move.title')}
          description={
            <div className={styles.moveList}>
              <p className={styles.moveHint}>
                {t('cloud.storage.move.hint', {
                  name: library.find((item) => item.id === moveId)?.name ?? '',
                })}
              </p>
              {folders.map((folder) => (
                <button
                  type="button"
                  key={folder.id}
                  className={styles.moveOption}
                  data-testid="move-folder-option"
                  data-folder-key={folder.id}
                  onClick={() => moveItemTo(folder.id)}
                >
                  {folder.name}
                </button>
              ))}
            </div>
          }
          confirmLabel={t('cloud.storage.action.create.folder')}
          cancelLabel={t('cloud.storage.action.cancel')}
          tone="brand"
          closeLabel={t('cloud.storage.action.close')}
          onConfirm={() => {
            setFolderName(t('cloud.storage.folder.name.default'));
            setFolderDialogOpen(true);
          }}
          onCancel={() => setMoveId(null)}
          testId="move-dialog"
        />
      )}

      {folderDialogOpen && (
        <ConfirmDialog
          opened
          title={t('cloud.storage.folder.create.title')}
          description={
            <label className={styles.folderField}>
              <span>{t('cloud.storage.folder.name.label')}</span>
              <input
                className={styles.folderInput}
                data-testid="folder-name-input"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
              />
            </label>
          }
          confirmLabel={t('cloud.storage.action.create')}
          cancelLabel={t('cloud.storage.action.cancel')}
          tone="brand"
          closeLabel={t('cloud.storage.action.close')}
          onConfirm={confirmFolder}
          onCancel={() => {
            setFolderDialogOpen(false);
            setMoveId(null);
          }}
          testId="folder-dialog"
        />
      )}

      {trashConfirmId && (
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

      {fullDialogOpen && (
        <StorageFullDialog
          t={t}
          usage={usageForMeter}
          onUpgrade={() => openPurchase(isPro ? 'packs' : 'subscription')}
          onClose={() => setFullDialogOpen(false)}
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
          onCheckout={completePurchase}
          aside={
            <p className={styles.purchaseUsage}>
              {t('cloud.storage.meter.usage', { used: usage.usedLabel, quota: quotaLabel })}
            </p>
          }
          {...(purchasePath === 'subscription'
            ? {
                title: t('cloud.storage.purchase.plan.title'),
                tabs: [{ key: 'pro', label: subscription.planLabel, tone: 'pro' }],
                activeTabKey: planTab,
                onTabChange: setPlanTab,
                plans: [
                  {
                    key: 'monthly',
                    name: t('cloud.storage.purchase.monthly'),
                    price: subscription.monthlyLabel,
                  },
                  {
                    key: 'yearly',
                    name: t('cloud.storage.purchase.yearly'),
                    price: subscription.yearlyLabel,
                    savePercent: subscription.yearlySavingLabel,
                  },
                ],
                selectedPlanKey: selectedPlan,
                onSelectPlan: setSelectedPlan,
                features: {
                  title: t('cloud.storage.purchase.benefits'),
                  items: subscription.benefits,
                },
                summary: t('cloud.storage.purchase.renewal', {
                  date: mockData.purchase.summary.renewalLabel,
                }),
                labels: {
                  checkout: t('cloud.storage.action.upgrade.pro'),
                  close: t('cloud.storage.action.close'),
                },
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
                // No tabs: with one offer the shared overlay falls back to RD's
                // single-offer pill, which here just repeated the dialog's own
                // title as a blue badge directly beneath it.
                activeTabKey: 'packs',
                plans: packs.map((pack) => ({
                  key: pack.id,
                  name: pack.label,
                  price: packCycle === 'yearly' ? pack.yearlyLabel : pack.monthlyLabel,
                })),
                selectedPlanKey: selectedPack,
                onSelectPlan: setSelectedPack,
                features: {
                  title: t('cloud.storage.purchase.pack.benefits'),
                  items: [
                    t('cloud.storage.purchase.pack.stacks'),
                    t('cloud.storage.purchase.pack.cancel'),
                  ],
                },
                summary: (
                  <span className={styles.packSummary} data-component-role="purchase-summary">
                    {/* The capacity path's own controls: RD's pricing modal has
                        no pack selector, billing cycle or resulting total, so
                        these sit beside the borrowed pack rather than inside it. */}
                    <span
                      className={styles.packCycle}
                      data-testid="pack-billing-cycle"
                      data-component-role="storage-pack-selector"
                      role="group"
                      aria-label={t('cloud.storage.pack.cycle.label')}
                    >
                      {mockData.purchase.billingCycles.map((cycle) => (
                        <button
                          type="button"
                          key={cycle.id}
                          className={styles.packCycleOption}
                          aria-pressed={packCycle === cycle.id}
                          onClick={() => setPackCycle(cycle.id)}
                        >
                          {cycle.label}
                        </button>
                      ))}
                    </span>
                    <span className={styles.packTotal} data-testid="pack-total">
                      {t('cloud.storage.pack.total', { total: activePack.resultingTotalLabel })}
                    </span>
                    <span className={styles.packDue}>
                      {t('cloud.storage.pack.due', { amount: cycleLabel })}
                    </span>
                  </span>
                ),
                labels: {
                  checkout: t('cloud.storage.action.buy.now'),
                  close: t('cloud.storage.action.close'),
                },
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

      {purchaseSuccess && (
        <p className={styles.successToast} data-testid="purchase-success" role="status">
          {t('cloud.storage.purchase.success')}
        </p>
      )}

      <DemoWidget
        t={t}
        open={demoOpen}
        onOpenChange={setDemoOpen}
        review={{
          value: reviewState,
          options: mockData.capacity.reviewStates,
          onChange: setReviewState,
        }}
        plan={{ value: planTier, onChange: setPlanTier }}
      />
    </div>
  );
}
