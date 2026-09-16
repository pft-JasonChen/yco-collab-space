// Gallery-tab empty state — keyed on `currentTab` (+ supports upload via HiddenFileInput).
// Sibling (same name, different contract): tabs/ai-tools/common/empty-content keys on
// `moduleType`. Intentionally separate — NOT a duplicate to merge.
import styles from './EmptyContent.module.scss';
import emptyAssets from './empty-assets.js';
import { useMemo, useRef } from 'react';
import { useRouter } from './gallery-adapters.jsx';
import { routerUtils } from './gallery-adapters.jsx';
import { getTranslationFunction } from './gallery-adapters.jsx';
import { historyTab } from './gallery-adapters.jsx';
import { validImageExtensions } from './gallery-adapters.jsx';
import { validVideoExtensions } from './gallery-adapters.jsx';
import { useHandleFile } from './gallery-adapters.jsx';
import HiddenFileInput from './HiddenFileInput.jsx';
import { setAIGenerateEntrySource } from './gallery-adapters.jsx';

export default function EmptyContent(props) {
  const { currentTab, moduleTypeForPromote } = props;
  const router = useRouter();
  const { t } = getTranslationFunction();
  const inputRef = useRef(null);
  const { handleInputClick, handleInputFileChange } = useHandleFile({
    moduleType: moduleTypeForPromote,
  });

  const emptyImageUrl = useMemo(() => {
    if (currentTab === historyTab.photoEditor) {
      return '/assets/images/account/gallery/emptyContent/1.27.1/general.svg';
    } else if (
      currentTab === historyTab.aiArtGenerator ||
      currentTab === historyTab.faceAi ||
      currentTab === historyTab.imageGeneration
    ) {
      return '/assets/images/account/gallery/emptyContent/1.27.1/t2i.svg';
    } else if (currentTab === historyTab.videoEditor) {
      return '/assets/images/account/gallery/emptyContent/1.27.1/video.svg';
    } else if (currentTab === historyTab.aiTools) {
      return '/assets/images/account/gallery/emptyContent/1.27.1/i2v.svg';
    } else {
      return '';
    }
  }, [currentTab]);

  const emptyText = useMemo(() => {
    if (currentTab === historyTab.photoEditor) {
      return t('my.account.gallery.empty.photos');
    } else if (
      currentTab === historyTab.aiArtGenerator ||
      currentTab === historyTab.faceAi ||
      currentTab === historyTab.imageGeneration
    ) {
      return t('my.account.gallery.empty.ai.image.generator');
    } else if (currentTab === historyTab.videoEditor) {
      return t('my.account.gallery.empty.videos');
    } else if (currentTab === historyTab.aiTools) {
      return t('my.account.gallery.empty.ai.tools');
    } else {
      return '';
    }
  }, [currentTab, t]);

  const createUrl = useMemo(() => {
    if (
      currentTab === historyTab.aiArtGenerator ||
      currentTab === historyTab.imageGeneration
    ) {
      return '/ai-art-generator/result-photo';
    } else if (currentTab === historyTab.videoEditor) {
      return '/ai-video-generator/result-photo';
    } else if (currentTab === historyTab.aiTools) {
      return '/ai-headshot-generator/create';
    } else {
      return '';
    }
  }, [currentTab]);

  const createUrlQuery = useMemo(() => {
    if (currentTab === historyTab.imageGeneration) {
      return { tab: 'txt2Img' };
    }
    return {};
  }, [currentTab]);

  const onClick = () => {
    if (isNeedHiddenFileInput) {
      handleInputClick(inputRef);
    } else {
      if (currentTab === historyTab.videoEditor) {
        setAIGenerateEntrySource('gallery');
      }
      routerUtils.push(router, createUrl, createUrlQuery);
    }
  };

  const isNeedHiddenFileInput = useMemo(() => {
    return (
      currentTab === historyTab.photoEditor
      //|| currentTab === historyTab.videoEditor
    );
  }, [currentTab]);

  const buttonText = useMemo(() => {
    if (currentTab === historyTab.photoEditor) {
      return t('my.account.gallery.empty.cta.button.photos');
    } else if (
      currentTab === historyTab.aiArtGenerator ||
      currentTab === historyTab.faceAi ||
      currentTab === historyTab.imageGeneration
    ) {
      return t('my.account.gallery.empty.cta.button.ai.image.generator');
    } else if (currentTab === historyTab.videoEditor) {
      return t('my.account.gallery.empty.cta.button.videos');
    } else if (currentTab === historyTab.aiTools) {
      return t('my.account.gallery.empty.cta.button.ai.tools');
    } else {
      return '';
    }
  }, [currentTab, t]);

  return (
    <div className={styles.container}>
      <div className={styles.flex}>
        <img src={emptyAssets[emptyImageUrl]} className={styles.emptyImg} />
        <div className={styles.emptyText}>{emptyText}</div>
        <button className={styles.createButton} onClick={onClick}>
          {buttonText}
        </button>
      </div>
      {isNeedHiddenFileInput && (
        <HiddenFileInput
          inputRef={inputRef}
          handleInputFileChange={handleInputFileChange}
          customAccept={
            currentTab === historyTab.videoEditor
              ? validVideoExtensions.join(',')
              : validImageExtensions.join(',')
          }
        />
      )}
    </div>
  );
}
