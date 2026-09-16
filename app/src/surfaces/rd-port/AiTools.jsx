import styles from './AiTools.module.scss';
import { getTranslationFunction } from './gallery-adapters.jsx';
import { domPurifyUtils } from './gallery-adapters.jsx';
import { useCombinedAiToolsPack } from './gallery-adapters.jsx';
import { Avatar } from './gallery-adapters.jsx';
import { AiHeadshot } from './gallery-adapters.jsx';
import { useWindowDevice } from './gallery-adapters.jsx';
import { setShowHistoryConfirmDeletion } from './gallery-adapters.jsx';
import { useDispatch, useSelector } from './gallery-adapters.jsx';
import { AiStudioSuccessPack } from './gallery-adapters.jsx';
import { AiStudioRunningPack } from './gallery-adapters.jsx';
import { useBeforeUnload } from './gallery-adapters.jsx';
import { aiToolsTab, historyTab } from './gallery-adapters.jsx';
import { useAiToolsUiControl } from './gallery-adapters.jsx';
import EmptyContent from './EmptyContent.jsx';
import SelectAllHeader from './SelectAllHeader.jsx';
import EditingToolbar from './EditingToolbar.jsx';
import { useAccountRedDotsContext } from './gallery-adapters.jsx';

export default function AiTools() {
  const {
    showAvatarRedDot: showAvatarRedDotOrderIds,
    setShowAvatarRedDot: setShowAvatarRedDotOrderIds,
    showAiHeadshotRedDot: showAiHeadshotRedDotOrderIds,
    setShowAiHeadshotRedDot: setShowAiHeadshotRedDotOrderIds,
    showAiStudioRedDot,
    setShowAiStudioRedDot,
    showAvatarCreditRedDot,
    setShowAvatarCreditRedDot,
    showAiHeadshotCreditRedDot,
    setShowAiHeadshotCreditRedDot,
  } = useAccountRedDotsContext();

  const aiStudio = useSelector((state) => state.aiStudio);
  const { pollingList: aiStudioPollingList } = aiStudio;

  const { t } = getTranslationFunction();

  const { isMd } = useWindowDevice();

  const dispatch = useDispatch();

  const {
    combinedAIToolsPack,
    isLoading,
    filteredData4AiStudio,
    aiStudioDataInitialized,
    diffLengthForAiStudio,
    showAvatarLoadingSkeleton,
    showAiHeadshotLoadingSkeleton,
  } = useCombinedAiToolsPack();

  useBeforeUnload({
    setShowAiStudioRedDot,
  });

  const {
    isEditing,
    selectedAiToolsIds,

    isSelectAll,
    isItemSelected,

    handleToggleEditing,
    handleToggleSelectAll,
    toggleSelectAiTool,

    handleNoticeClick,
  } = useAiToolsUiControl({
    combinedAIToolsPack,
  });

  const renderTipsOrSelectAll = () => (
    <SelectAllHeader
      styles={styles}
      isEditing={isEditing}
      isSelectAll={isSelectAll}
      onToggleSelectAll={handleToggleSelectAll}
      onNoticeClick={handleNoticeClick}
    >
      <div>
        <div
          dangerouslySetInnerHTML={{
            __html: domPurifyUtils.sanitize(
              t('my.account.history.aitools.tip', {
                dtl: `<span style="color: #03ADE2;">${30}</span>`,
              }),
              'span'
            ),
          }}
        />
      </div>
    </SelectAllHeader>
  );

  const handleDeleteButtonClick = () => {
    dispatch(setShowHistoryConfirmDeletion(true));
    setTimeout(() => dispatch(setShowHistoryConfirmDeletion(false)), 100);
  };

  const renderSelectOrCancel = () => {
    const deleteDisabled =
      selectedAiToolsIds.avatarOrderIds.length === 0 &&
      selectedAiToolsIds.avatarCreditIds.length === 0 &&
      selectedAiToolsIds.aiHeadshotOrderIds.length === 0 &&
      selectedAiToolsIds.aiHeadshotCreditIds.length === 0 &&
      selectedAiToolsIds.aiStudioIds.length === 0;

    return (
      <EditingToolbar
        styles={styles}
        isEditing={isEditing}
        isMd={isMd}
        selectDisabled={combinedAIToolsPack.length === 0}
        deleteDisabled={deleteDisabled}
        onToggleEditing={handleToggleEditing}
        onDelete={handleDeleteButtonClick}
      />
    );
  };

  let aiStudioIndex = -1;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {renderTipsOrSelectAll()}
        <div className={styles.headerBottoms}>{renderSelectOrCancel()}</div>
      </div>
      {!isLoading &&
        combinedAIToolsPack?.length === 0 &&
        aiStudioPollingList?.length === 0 && (
          <EmptyContent currentTab={historyTab.aiTools} />
        )}
      <div className={styles.cellsContainer}>
        <div className={styles.cells}>
          {aiStudioPollingList.length > 0 && (
            <AiStudioRunningPack initialized={aiStudioDataInitialized} />
          )}
          {combinedAIToolsPack.map((item, index) => {
            if (item.type === aiToolsTab.avatar) {
              return (
                <Avatar
                  key={index}
                  showLoadingSkeleton={showAvatarLoadingSkeleton}
                  avatarLoadedData={[item]}
                  setShowAvatarRedDotOrderIds={setShowAvatarRedDotOrderIds}
                  showAvatarRedDotOrderIds={showAvatarRedDotOrderIds}
                  showAvatarCreditRedDot={showAvatarCreditRedDot}
                  setShowAvatarCreditRedDot={setShowAvatarCreditRedDot}
                  isEditing={isEditing}
                  selectedAiToolsIds={selectedAiToolsIds}
                  isItemSelected={isItemSelected}
                  toggleSelectAiTool={toggleSelectAiTool}
                />
              );
            }
            if (item.type === aiToolsTab.aiHeadshot) {
              return (
                <AiHeadshot
                  key={index}
                  showLoadingSkeleton={showAiHeadshotLoadingSkeleton}
                  aiHeadshotLoadedData={[item]}
                  showAiHeadshotRedDotOrderIds={showAiHeadshotRedDotOrderIds}
                  setShowAiHeadshotRedDotOrderIds={
                    setShowAiHeadshotRedDotOrderIds
                  }
                  showAiHeadshotCreditRedDot={showAiHeadshotCreditRedDot}
                  setShowAiHeadshotCreditRedDot={setShowAiHeadshotCreditRedDot}
                  isEditing={isEditing}
                  selectedAiToolsIds={selectedAiToolsIds}
                  isItemSelected={isItemSelected}
                  toggleSelectAiTool={toggleSelectAiTool}
                />
              );
            }
            if (item.type === aiToolsTab.aiStudio) {
              return (
                <AiStudioSuccessPack
                  key={index}
                  data={[item]}
                  aiStudioLength={filteredData4AiStudio.length}
                  aiStudioIndex={++aiStudioIndex}
                  showAiStudioRedDot={showAiStudioRedDot}
                  setShowAiStudioRedDot={setShowAiStudioRedDot}
                  initialized={aiStudioDataInitialized}
                  diffLength={diffLengthForAiStudio}
                  isEditing={isEditing}
                  isItemSelected={isItemSelected}
                  toggleSelectAiTool={toggleSelectAiTool}
                />
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
