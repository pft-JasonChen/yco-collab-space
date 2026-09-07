import React, { useMemo } from 'react';
import Share from '../../share/async';
import PhotoEnhance from '@/components/result-page/photo-enhance/async';
import ObjectRemoval from '@/components/result-page/object-removal/async';
import BackgroundRemoval from '@/components/result-page/background-removal/async';
import Colorize from '@/components/result-page/colorize/async';
import Lighting from '@/components/result-page/lighting/async';
import TextToImage from '@/components/result-page/text-to-image/async';
import HairStyle from '@/components/result-page/hair-style/async';
import BasicEditing from '@/components/result-page/basic-editing/async';
import OutPaint from '@/components/result-page/out-paint/async';
import ObejctRepalce from '@/components/result-page/object-replace/async';
import MakeupTransfer from '@/components/result-page/makeup-transfer/async';
import ColorCorrection from '@/components/result-page/color-correction/async';
import VideoEnhancer from '@/components/result-page/video-enhance/async';
import VideoObjectRemover from '@/components/result-page/video-object-remover/async';
import FaceShapeDetector from '@/components/result-page/face-shape-detector/async';
import FaceSwap from '@/components/result-page/face-swap/async';
import AiVideoFilters from '@/components/result-page/ai-video-filters/async';
import FaceSwapVid from '@/components/result-page/face-swap-vid/async';
import ImageToVideo from '@/components/result-page/image-to-video/async';
import AiVideoEditor from '@/components/result-page/ai-video-editor/async';
import CharacterMotionSwap from '@/components/result-page/character-motion-swap/async';
import AiMakeup from '@/components/result-page/ai-makeup/async';
import ImageConverter from '@/components/result-page/image-converter/async';
import FaceReshape from '@/components/result-page/face-reshape/async';
import FaceRetouch from '@/components/result-page/face-retouch/async';
import AiClothes from '@/components/result-page/ai-clothes/async';
import BeardFilter from '@/components/result-page/beard-filter/async';
import HairColorChanger from '@/components/result-page/hair-color-changer/async';
import TextToVideo from '@/components/result-page/ai-text-to-video-generator/async';
import PhotoFilterEffect from '@/components/result-page/photo-filter-effect/async';
import BodyReshape from '@/components/result-page/body-reshape/async';
import Edit from '@/components/result-page/edit/async';
import AiPhotoRepair from '@/components/result-page/ai-photo-repair/async';
import ImageTemplate from '@/components/result-page/image-template/async';
import VideoTemplate from '@/components/result-page/video-template/async';
import { moduleTypes } from '@/utils/moduleTypes';
import { getResultPageFeatureDefinition } from '../../data/feature-registry';

// Memoized: ResultPage re-renders many times during its init dispatch chain,
// but this component's props (id / moduleType / initialized / cms*) change at
// most a couple times. Without memo, every ResultPage re-render reconciled the
// entire feature subtree (BodyReshape etc.), churning fiber into v8 old_space.
// The feature still updates from its own store subscriptions — it takes no
// changing props from here — so skipping the parent-driven re-render is safe.
function ModuleRenderer(props) {
  const {
    id,
    initialized,
    moduleType,
    isBottomBlockHidden,
    cmsContent,
    cmsAnalyzerPreview,
    cmsGridModule,
  } = props;

  const moduleRenderers = useMemo(
    () => ({
      [moduleTypes.enhance]: () => <PhotoEnhance />,
      [moduleTypes.objRemoval]: () => <ObjectRemoval />,
      [moduleTypes.sod]: () => <BackgroundRemoval />,
      [moduleTypes.colorize]: () => <Colorize />,
      [moduleTypes.lighting]: () => <Lighting />,
      [moduleTypes.txt2Img]: () => <TextToImage />,
      [moduleTypes.outPaint]: () => <OutPaint />,
      [moduleTypes.objReplace]: () => <ObejctRepalce />,
      [moduleTypes.muTransfer]: () => <MakeupTransfer />,
      [moduleTypes.colorCorrection]: () => <ColorCorrection />,
      [moduleTypes.videoSr]: () => <VideoEnhancer />,
      [moduleTypes.videoObjRemover]: () => <VideoObjectRemover />,
      [moduleTypes.faceShapeDetector]: () => (
        <FaceShapeDetector
          cmsContent={cmsContent}
          cmsAnalyzerPreview={cmsAnalyzerPreview}
        />
      ),
      [moduleTypes.faceSwap]: () => <FaceSwap id={id} />,
      [moduleTypes.faceSwapVid]: () => <FaceSwapVid />,
      [moduleTypes.makeup]: () => <AiMakeup />,
      [moduleTypes.imageConverter]: () => <ImageConverter />,
      [moduleTypes.faceReshape]: () => <FaceReshape />,
      [moduleTypes.faceRetouch]: () => <FaceRetouch />,
      [moduleTypes.beardFilter]: () => <BeardFilter />,
      [moduleTypes.hairColorChanger]: () => <HairColorChanger />,
      [moduleTypes.textToVideo]: () => <TextToVideo />,
      [moduleTypes.photoFilterEffect]: () => <PhotoFilterEffect />,
      [moduleTypes.bodyReshape]: () => <BodyReshape />,
      // [moduleTypes.aiClothes]: () => (
      //   <AiClothesSection moduleType={moduleType} />
      // ),
      // [moduleTypes.aiVideoFilters]: () => (
      //   <AiVideoFiltersSection moduleType={moduleType} />
      // ),
      // [moduleTypes.img2Vid]: () => <Img2VidSection moduleType={moduleType} />,
      [moduleTypes.aiVideoFilters]: () => <AiVideoFilters />,
      [moduleTypes.img2Vid]: () => <ImageToVideo />,
      [moduleTypes.aiVideoEditor]: () => <AiVideoEditor />,
      [moduleTypes.characterMotionSwap]: () => <CharacterMotionSwap />,
      [moduleTypes.aiClothes]: () => <AiClothes />,
      [moduleTypes.imageTemplate]: () => <ImageTemplate />,
      [moduleTypes.videoTemplate]: () => <VideoTemplate />,
      [moduleTypes.edit]: () => <Edit cmsGridModule={cmsGridModule} />,
      [moduleTypes.aiPhotoRepair]: () => <AiPhotoRepair />,
    }),
    [cmsContent, cmsAnalyzerPreview, cmsGridModule, id]
  );

  if (!initialized) return null;

  // Share 優先
  if (id && moduleType !== moduleTypes.faceSwap) {
    return <Share id={id} isBottomBlockHidden={isBottomBlockHidden} />;
  }

  const featureDefinition = getResultPageFeatureDefinition(moduleType);
  if (!featureDefinition) return null;

  // map 命中
  const factory = moduleRenderers[moduleType];
  if (typeof factory === 'function') return factory();

  if (featureDefinition?.rendererKind === 'hair-family') return <HairStyle />;
  if (featureDefinition?.rendererKind === 'basic-editing') {
    return <BasicEditing />;
  }

  return null;
}

export default React.memo(ModuleRenderer);
