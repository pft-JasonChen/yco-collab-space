import { memo, useMemo } from 'react';
import styles from './index.module.scss';
import autoScrollUtils from '@/components/utils/autoScrollUtils';
import { useSelector } from 'react-redux';
import { getTranslationFunction } from '@/i18n';
import InteractionToolsBar from '../interaction-tools-bar';
import useWindowDevice from '@/hooks/use-window-device';
import ModuleName from './components/module-name/module-name';
import {
  featureLayoutContainerId,
  mobileHeaderVariantTypes,
  resultsVariantTypes,
  resultVariantTypes,
  settingsFlexDirectionInMobileTypes,
  settingsPositionTypes,
  settingsVariantTypes,
} from './utils/featureLayoutTypes';

/* ---------------------- 子元件（用 memo 包，不加 React.） ---------------------- */

const MOBILE_HEADER_ID = 'feature-layout-mobile-header';
const EMPTY_ARRAY = [];

const Title = memo(function Title(props) {
  const {
    showTitle,
    settingTitle,
    settingDescription,
    settingStylesTitle,
    customSettingDescriptionStyles,
    settingsBlockTitleContainerId,
    t,
    settingsBlockTitleContainerDisabled,
  } = props;

  if (!showTitle) return null;

  return (
    <div
      className={styles.settingsBlockTitleContainer}
      id={settingsBlockTitleContainerId}
      data-disabled={settingsBlockTitleContainerDisabled}
    >
      {settingTitle && (
        <div className={styles.settingsBlockTitle}>{t(settingTitle)}</div>
      )}
      {settingDescription && (
        <div
          className={styles.settingsBlockDescription}
          style={customSettingDescriptionStyles || undefined}
        >
          {t(settingDescription)}
        </div>
      )}
      {settingStylesTitle && (
        <div className={styles.settingsBlockStylesTitle}>
          {t(settingStylesTitle)}
        </div>
      )}
    </div>
  );
});

const ResultBlock = memo(function ResultBlock({
  children,
  removeMinHeight,
  customResultStyles,
  resultsVariant,
  breakpointVariant,
}) {
  // 支援 resultsVariant 為 array，可以套用多個 styles
  const variantClasses = Array.isArray(resultsVariant)
    ? resultsVariant.map((v) => styles[v]).join(' ')
    : styles[resultsVariant];

  return (
    <div
      className={`${styles.resultsBlock} ${
        removeMinHeight ? styles.minHeightUnset : ''
      } ${variantClasses}`}
      style={customResultStyles || undefined}
      id="featureLayoutResultBlockContainer"
      data-breakpoint={breakpointVariant}
    >
      {children}
    </div>
  );
});

const SettingsBlock = memo(function SettingsBlock(props) {
  const {
    hasContent,
    desktopContainerId,
    applyPadding0,
    settingsClass,
    settingsVariant,
    customSettingsStyles,
    titleOnTop,
    titleElement,
    thumbnails,
    settingsElement,
    settingsHeader,
    breakpointVariant,
  } = props;

  if (!hasContent) return null;

  return (
    <div
      id={desktopContainerId}
      className={`${styles.settingsBlock} ${
        applyPadding0 ? styles.padding0 : ''
      } ${settingsClass ? settingsClass : ''} ${styles[settingsVariant]}`}
      style={customSettingsStyles || undefined}
      data-breakpoint={breakpointVariant}
    >
      {settingsHeader}
      {titleOnTop && titleElement}
      {thumbnails}
      {!titleOnTop && titleElement}
      {settingsElement}
    </div>
  );
});

const MobileHeader = memo(function MobileHeader(props) {
  const {
    isDesktop,
    showMobileHeader,
    mobileHeaderVisible,
    showModuleName,
    hiddenTools,
    showLeftTool,
    showCenterTool,
    showRightTool,
    isToolDisabled,
    onUndo,
    onRedo,
    onReset,
    onCompareDown,
    onCompareUp,
    customCanvasCompareLogic,
    centerCustomToolComponent,
    containerWidth100,
    mobileHeaderVariant = mobileHeaderVariantTypes.DEFAULT,
  } = props;

  if (isDesktop || !showMobileHeader) return null;

  return (
    <div
      className={`${styles.mobileHeader} ${styles[mobileHeaderVariant]}`}
      id={MOBILE_HEADER_ID}
      style={{
        opacity: mobileHeaderVisible ? 1 : 0,
        pointerEvents: mobileHeaderVisible ? 'auto' : 'none',
      }}
    >
      {showModuleName && <ModuleName variant={mobileHeaderVariant} />}
      <InteractionToolsBar
        hiddenTools={hiddenTools}
        showLeftTool={showLeftTool}
        showCenterTool={showCenterTool}
        showRightTool={showRightTool}
        isToolDisabled={isToolDisabled}
        onUndo={onUndo}
        onRedo={onRedo}
        onReset={onReset}
        onCompareDown={onCompareDown}
        onCompareUp={onCompareUp}
        customCanvasCompareLogic={customCanvasCompareLogic}
        centerCustomToolComponent={centerCustomToolComponent}
        containerWidth100={containerWidth100}
        isDesktop={isDesktop}
        variant={mobileHeaderVariant}
      />
    </div>
  );
});

/* -------------------------------- 主元件 -------------------------------- */

function FeatureLayout({
  results,
  settings,
  settingTitle,
  settingDescription,
  settingStylesTitle,

  customSettingDescriptionStyles = null,

  thumbnails = null,

  settingsHeader = null,

  hiddenTools = EMPTY_ARRAY,
  isToolDisabled = () => true,
  onUndo,
  onRedo,
  onReset,
  onCompareDown,
  onCompareUp,
  centerCustomToolComponent = null,

  // result 區域
  resultVariant = resultVariantTypes.DEFAULT,

  // results 區域
  resultsVariant = resultsVariantTypes.DEFAULT,

  // settings 區域
  settingsPosition = settingsPositionTypes.LEFT,
  settingsFlexDirectionInMobile = settingsFlexDirectionInMobileTypes.COLUMN_REVERSE,
  settingsVariant = settingsVariantTypes.DEFAULT,

  // mobile header
  showMobileHeader = true,
  mobileHeaderVisible = true,
  showLeftTool = false,
  showCenterTool = true,
  showRightTool = false,

  // figma
  titleOnTop = true,
  showTitle = true,
  showModuleName = true,
  containerWidth100 = false, // for single-tool-page (edit result page)

  // canvas
  applyPadding0 = false,
  removeMinHeight = false,
  customResultStyles = null,
  customCanvasCompareLogic = null,

  // settings overflow auto / hidden scrollbar
  settingsClass = null,
  customSettingsStyles = null,

  //
  isDesktop: propIsDesktop = null,

  breakpointVariant = 'lg',
  settingsBlockTitleContainerDisabled = false,
}) {
  const moduleType = useSelector((state) => state.info.moduleType);

  const {
    desktopSettingsContainerId: desktopContainerId,
    settingsBlockTitleContainerId,
  } = autoScrollUtils.createDomIdsByModule(moduleType);

  const { t } = getTranslationFunction();

  const { isDesktop } = useWindowDevice();

  const isDesktopFinal = propIsDesktop !== null ? propIsDesktop : isDesktop;

  // 支援 resultVariant 為 array，可以套用多個 styles
  const resultVariantClasses = useMemo(() => {
    return Array.isArray(resultVariant)
      ? resultVariant.map((v) => styles[v]).join(' ')
      : styles[resultVariant];
  }, [resultVariant]);

  // edit lobby: let .result shrink so a tall result can't push the mobile
  // feature bar off-screen (see .editFitViewport, YCO260703P0019)
  const editFitClass = (
    Array.isArray(resultsVariant)
      ? resultsVariant.includes(resultsVariantTypes.EDIT)
      : resultsVariant === resultsVariantTypes.EDIT
  )
    ? styles.editFitViewport
    : '';

  // 穩定 Title 相關 props
  const titleProps = useMemo(
    () => ({
      showTitle,
      settingTitle,
      settingDescription,
      settingStylesTitle,
      customSettingDescriptionStyles,
      settingsBlockTitleContainerId,
      t,
      settingsBlockTitleContainerDisabled,
    }),
    [
      showTitle,
      settingTitle,
      settingDescription,
      settingStylesTitle,
      customSettingDescriptionStyles,
      settingsBlockTitleContainerId,
      t,
      settingsBlockTitleContainerDisabled,
    ]
  );

  // Settings 區塊是否有內容
  const hasSettingsContent = Boolean(settings || thumbnails);

  // 預先組合 Title element
  const titleElement = useMemo(() => <Title {...titleProps} />, [titleProps]);

  return (
    <>
      <MobileHeader
        isDesktop={isDesktopFinal}
        showMobileHeader={showMobileHeader}
        mobileHeaderVisible={mobileHeaderVisible}
        showModuleName={showModuleName}
        hiddenTools={hiddenTools}
        showLeftTool={showLeftTool}
        showCenterTool={showCenterTool}
        showRightTool={showRightTool}
        isToolDisabled={isToolDisabled}
        onUndo={onUndo}
        onRedo={onRedo}
        onReset={onReset}
        onCompareDown={onCompareDown}
        onCompareUp={onCompareUp}
        customCanvasCompareLogic={customCanvasCompareLogic}
        centerCustomToolComponent={centerCustomToolComponent}
        containerWidth100={containerWidth100}
      />

      <div
        className={`${styles.result} ${styles[settingsPosition]} ${styles[settingsFlexDirectionInMobile]} ${resultVariantClasses} ${editFitClass}`}
        onContextMenu={(e) => e.preventDefault()}
        id={featureLayoutContainerId}
        data-breakpoint={breakpointVariant}
      >
        {[settingsPositionTypes.LEFT].includes(settingsPosition) ? (
          <>
            <SettingsBlock
              hasContent={hasSettingsContent}
              desktopContainerId={desktopContainerId}
              applyPadding0={applyPadding0}
              settingsClass={settingsClass}
              settingsVariant={settingsVariant}
              customSettingsStyles={customSettingsStyles}
              titleOnTop={titleOnTop}
              titleElement={titleElement}
              thumbnails={thumbnails}
              settingsElement={settings}
              settingsHeader={settingsHeader}
              breakpointVariant={breakpointVariant}
            />
            <ResultBlock
              removeMinHeight={removeMinHeight}
              customResultStyles={customResultStyles}
              resultsVariant={resultsVariant}
              breakpointVariant={breakpointVariant}
            >
              {results}
            </ResultBlock>
          </>
        ) : (
          <>
            <ResultBlock
              removeMinHeight={removeMinHeight}
              customResultStyles={customResultStyles}
              resultsVariant={resultsVariant}
              breakpointVariant={breakpointVariant}
            >
              {results}
            </ResultBlock>
            <SettingsBlock
              hasContent={hasSettingsContent}
              desktopContainerId={desktopContainerId}
              applyPadding0={applyPadding0}
              settingsClass={settingsClass}
              settingsVariant={settingsVariant}
              customSettingsStyles={customSettingsStyles}
              titleOnTop={titleOnTop}
              titleElement={titleElement}
              thumbnails={thumbnails}
              settingsElement={settings}
              settingsHeader={settingsHeader}
              breakpointVariant={breakpointVariant}
            />
          </>
        )}
      </div>
    </>
  );
}

export { MobileHeader };
export default memo(FeatureLayout);
