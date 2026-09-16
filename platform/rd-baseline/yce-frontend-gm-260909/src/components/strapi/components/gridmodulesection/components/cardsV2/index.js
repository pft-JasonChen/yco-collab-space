import styles from './index.module.scss';
import LinkWithLocale from '@/components/utils/link-with-locale';
import ButtonWrapper from '@/components/common/button-wrapper';
import HiddenFileInput from '@/components/result-page/common/hidden-file-input';
import useWindowDevice from '@/hooks/use-window-device';
import _get from 'lodash/get';
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { setCrossPageState } from '@/store/actions/uiAction';
import { ProcessingTypes, TaskTypes } from '@/store/actions/pages/resultAction';
import routerUtils from '@/utils/routerUtils';
import Dotdotdot from 'react-dotdotdot';
import { getTranslationFunction } from '@/i18n';
import useEditProject from '@/components/result-page/hooks/project/use-edit-project';
import useHandleRecentFiles from '@/components/result-page/hooks/use-handle-recent-files';
import useHandleInput from '@/components/result-page/hooks/use-handle-input';
import useUpdateResultRedux from '@/components/result-page/hooks/use-update-result-redux';
import { getHotNewFlagsFromTabs } from '../../utils/hot-new-tag-utils';
import { setAIGenerateEntrySource } from '@/utils/countly/aiGenerateEntrySource';
import { isAIGenerateVideoModuleType } from '@/utils/countly/countlyAIGenerateUtils';
import moduleTypeUtils from '@/utils/moduleTypes';

export default function Card(props) {
  const { card, tabHot, tabNew, isHomePage } = props;
  const isLobby = card?.tabs === 'lobby';
  const { isHot, isNew } = getHotNewFlagsFromTabs(card?.tabs);
  const isVideo =
    card?.video?.data?.attributes?.url ||
    card?.videoMobile?.data?.attributes?.url;
  const hasTitleIcon = card?.icon?.data?.attributes?.url;
  const isAIGenerateVideoCard = isAIGenerateVideoModuleType(
    moduleTypeUtils.pageKeyOrFunctionKeyToModuleType(card?.link)
  );

  const videoBlockRef = useRef(null);
  const [isCardBlockHover, setCardBlockHover] = useState(false);
  const { isDesktop } = useWindowDevice();
  const { t } = getTranslationFunction();
  const dispatch = useDispatch();

  const { initProject } = useEditProject();
  const { deleteRecentFile } = useHandleRecentFiles();

  const inputRef = useRef(null);
  const { handleInputClick, handleInputFileChange } = useHandleInput({
    inputRef,
  });
  const { setTaskProcessType, setNewTask } = useUpdateResultRedux();

  const yceData = useSelector((state) => state.yceData);
  const router = useRouter();

  // handle file upload, then go to edit page
  useEffect(() => {
    if (yceData.base64) {
      setTaskProcessType(ProcessingTypes.processing);
      setNewTask(TaskTypes.new, 'yceData');
      routerUtils.push(router, '/edit/result-photo', { userUpload: true });
    }
  }, [yceData.base64]);

  const handleEnd = () => {
    setCardBlockHover(false);
  };

  const handleMove = (e) => {
    e.preventDefault();
    setCardBlockHover(true);
  };

  const getVideoSrc = () => {
    if (!isDesktop) {
      return card?.videoMobile?.data?.attributes?.url
        ? _get(card, 'videoMobile.data.attributes.url')
        : '';
    } else {
      return card?.video?.data?.attributes?.url
        ? _get(card, 'video.data.attributes.url')
        : '';
    }
  };

  const getImageSrc = () => {
    const defaultImage = card?.image?.data?.attributes?.url
      ? _get(card, 'image.data.attributes.url')
      : '';
    if (!isDesktop) {
      return card?.imageMobile?.data?.attributes?.url
        ? _get(card, 'imageMobile.data.attributes.url')
        : defaultImage;
    } else {
      return defaultImage;
    }
  };

  const handleOnClick = async (e) => {
    handleInputClick();
    await deleteRecentFile();
    initProject();

    await dispatch(setCrossPageState({ newProject: false, showEmpty: false }));
  };

  const getIconImageSrc = () => {
    return card?.icon?.data?.attributes?.url
      ? _get(card, 'icon.data.attributes.url')
      : '/assets/images/header/start_editing_icon_black.svg'; // use default image if icon.data is null
  };

  if (isLobby) {
    return (
      <>
        <ButtonWrapper
          href={card.link}
          className={styles.link}
          onClick={handleOnClick}
        >
          <div className={styles.card}>
            <div className={styles.imageBox}>
              {!isVideo && (
                <div
                  className={styles.videoBlock}
                  ref={videoBlockRef}
                  onPointerMove={handleMove}
                  onPointerLeave={handleEnd}
                >
                  <img
                    alt={card.alt || card.title}
                    className={styles.image}
                    src="/assets/images/strapi/grid-module/start_editing.png"
                    loading="lazy"
                  />
                  <div className={styles.hoverBlock}>
                    <img
                      className={styles.typeIcon}
                      src="/assets/images/strapi/grid-module/start_editing_icon.svg"
                      loading="lazy"
                    />
                    <img
                      className={styles.video}
                      src="/assets/images/strapi/grid-module/start_editing.png"
                      loading="lazy"
                    ></img>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.titleContainer}>
              <div className={styles.title}>
                <Dotdotdot clamp={1}>{t(card.title)}</Dotdotdot>
              </div>
            </div>
          </div>
        </ButtonWrapper>
        <HiddenFileInput
          inputRef={inputRef}
          handleInputFileChange={handleInputFileChange}
        />
      </>
    );
  } else {
    return (
      <LinkWithLocale
        href={card.link}
        className={styles.link}
        onClick={
          isHomePage && isAIGenerateVideoCard
            ? () => setAIGenerateEntrySource('login_homepage')
            : undefined
        }
      >
        <div className={styles.card}>
          <div className={styles.imageBox}>
            {!isVideo && (
              <div
                className={styles.videoBlock}
                ref={videoBlockRef}
                onPointerMove={handleMove}
                onPointerLeave={handleEnd}
              >
                <img
                  alt={card.alt || card.title}
                  className={styles.image}
                  src={getImageSrc()}
                  loading="lazy"
                />
                <div className={styles.hoverBlock}>
                  <img
                    className={styles.typeIcon}
                    src={getIconImageSrc()}
                    loading="lazy"
                  />
                  <img
                    className={styles.video}
                    src={getImageSrc()}
                    loading="lazy"
                  ></img>
                </div>
              </div>
            )}
            {isHot && tabHot && (
              <img
                className={styles.hot}
                src={tabHot.data.attributes.url}
                alt="Hot"
                loading="lazy"
                style={{ opacity: isCardBlockHover ? 0 : 1 }}
              />
            )}
            {isNew && tabNew && (
              <img
                className={styles.new}
                src={tabNew.data.attributes.url}
                alt="New"
                loading="lazy"
                style={{ opacity: isCardBlockHover ? 0 : 1 }}
              />
            )}
            {isVideo && isDesktop && (
              <div
                className={styles.videoBlock}
                ref={videoBlockRef}
                onPointerMove={handleMove}
                onPointerLeave={handleEnd}
              >
                <img
                  alt={card.alt}
                  className={styles.image}
                  src={getImageSrc()}
                  loading="lazy"
                />
                <div className={styles.hoverBlock}>
                  <img
                    className={styles.typeIcon}
                    src={getIconImageSrc()}
                    loading="lazy"
                  />
                  <video
                    key={getVideoSrc()}
                    className={styles.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                  >
                    <source src={getVideoSrc()} />
                  </video>
                </div>
              </div>
            )}
            {isVideo && !isDesktop && (
              <div className={styles.videoBlock}>
                <img
                  alt={card.alt}
                  className={styles.image}
                  src={getImageSrc()}
                  loading="lazy"
                />
                <video
                  key={getVideoSrc()}
                  className={styles.video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  data-mobile="true"
                >
                  <source src={getVideoSrc()} />
                </video>
              </div>
            )}
          </div>
          <div className={styles.titleContainer}>
            <div className={styles.title}>
              <Dotdotdot clamp={1}>{card.title}</Dotdotdot>
            </div>
          </div>
        </div>
      </LinkWithLocale>
    );
  }
}
