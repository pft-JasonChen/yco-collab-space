// Empty, synthetic AI Tools/Agent account. Never query order/chat history APIs.
import { useContext, useState } from 'react';
import { AccountRedDotsContext, getTranslationFunction, useSelector as selectRuntime } from './adapters.jsx';
export { getTranslationFunction, useRouter, useDispatch, routerUtils, useWindowDevice, useHandleFile, setAIGenerateEntrySource } from './adapters.jsx';
export { domPurifyUtils } from './pricing-adapters.jsx';
export const historyTab = { photoEditor: 'photoEditor', videoEditor: 'videoEditor', imageGeneration: 'imageGeneration', aiArtGenerator: 'aiArtGenerator', faceAi: 'faceAi', aiTools: 'aiTools', aiAgent: 'aiAgent' };
export const aiToolsTab = { avatar: 'avatar', aiHeadshot: 'aiHeadshot', aiStudio: 'aiStudio' };
const empty = [];
export const useSelector = selector => selectRuntime(state => selector({ ...state, aiStudio: { pollingList: empty } }));
export const useAccountRedDotsContext = () => useContext(AccountRedDotsContext);
export const useCombinedAiToolsPack = () => ({ combinedAIToolsPack: empty, isLoading: false, filteredData4AiStudio: empty, aiStudioDataInitialized: true, diffLengthForAiStudio: 0, showAvatarLoadingSkeleton: false, showAiHeadshotLoadingSkeleton: false });
export const useAiAgentGallery = () => ({ items: empty, status: 'loaded', isLoadingMore: false, loadMore() {} });
export const setShowHistoryConfirmDeletion = value => ({ type: 'fixture-delete', value });
export const setMessageDialog = value => ({ type: 'fixture-notice', value });
export const useBeforeUnload = () => {};
export const useScrollTrigger = () => {};
export function useAiToolsUiControl() {
  const [isEditing, setIsEditing] = useState(false);
  return { isEditing, selectedAiToolsIds: { avatarOrderIds: empty, avatarCreditIds: empty, aiHeadshotOrderIds: empty, aiHeadshotCreditIds: empty, aiStudioIds: empty }, isSelectAll: false, isItemSelected: () => false, handleToggleEditing: () => setIsEditing(v => !v), handleToggleSelectAll() {}, toggleSelectAiTool() {}, handleNoticeClick() {} };
}
export function useHistoryTips() {
  const { t } = getTranslationFunction();
  return { tipsText1: t('my.account.history.agent.tip.1'), tipsText2: t('my.account.history.agent.tip.2', { dtl: 30 }) };
}
const unavailablePack = () => { throw new Error('This Surface only supplies an empty AI Tools/Agent fixture. Populated order/chat data is not connected.'); };
export const Avatar = unavailablePack;
export const AiHeadshot = unavailablePack;
export const AiStudioSuccessPack = unavailablePack;
export const AiStudioRunningPack = unavailablePack;
export const LoadingSkeleton = unavailablePack;
export const downloadUtils = { downloadBlobs: unavailablePack, zipBlobs: unavailablePack };
export const generateDownloadFileName = () => 'surface-fixture';
export const useDownloadObjectUrls = () => unavailablePack;
export const validImageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
export const validVideoExtensions = ['.mp4', '.mov', '.webm'];
