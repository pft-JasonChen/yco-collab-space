import { moduleTypes } from './moduleTypes.js';
import { supportedTranslationsV2 } from '@/components/aiTools/utils/aiToolsType';

export const categorytype = {
  [moduleTypes.txt2Img]: 'AI_Text2Image',
  [moduleTypes.hairStyle]: 'AI_Hair',
  [moduleTypes.avatar]: 'aiavatar',
  [moduleTypes.headshot]: 'AI_Headshot',
  [moduleTypes.avtV3Img]: 'AI_studioV3',
  [moduleTypes.avtV3Art]: 'AI_ArtisticAvatarV3',
  [moduleTypes.aiVideoFilters]: 'AI_VideoStyleTransfer',
  [moduleTypes.faceSwapVid]: 'AI_FaceSwap_Video',
  [moduleTypes.img2Vid]: 'AI_Image2Video',

  [moduleTypes.aiClothes]: 'AI_ClothesV2',
  [moduleTypes.aiFabric]: 'AI_Fabric',
  [moduleTypes.beardFilter]: 'AI_Beard',

  [moduleTypes.textToVideo]: 'AI_Text2Video',

  [moduleTypes.aiVideoEditor]: 'AI_Video2Video',
  [moduleTypes.characterMotionSwap]: 'AI_Video2Video',

  // Image Template / Video Template share one catalog (FR-004) — both
  // moduleTypes point at the same MultipleMix category, filtered client-side
  // by capability (use-template-catalog.js), not by a separate categorytype.
  [moduleTypes.imageTemplate]: 'AI_MultipleMix',
  [moduleTypes.videoTemplate]: 'AI_MultipleMix',
};

export const contenttype = {
  [moduleTypes.txt2Img]: 'Text2Image',
  [moduleTypes.hairStyle]: 'Hair',
  [moduleTypes.avatar]: 'Avatar',
  [moduleTypes.headshot]: 'Headshot',
  [moduleTypes.avtV3Img]: 'studioV3',
  [moduleTypes.avtV3Art]: 'ArtisticAvatarV3',
  [moduleTypes.aiVideoFilters]: 'VideoStyleTransfer',
  [moduleTypes.faceSwapVid]: 'FaceSwapVideo',
  [moduleTypes.img2Vid]: 'Image2Video',

  [moduleTypes.aiClothes]: 'ClothesV2',
  [moduleTypes.aiFabric]: 'Fabric',
  [moduleTypes.beardFilter]: 'Beard',

  [moduleTypes.textToVideo]: 'Text2Video',

  [moduleTypes.aiVideoEditor]: 'Video2Video',
  [moduleTypes.characterMotionSwap]: 'Video2Video',

  [moduleTypes.imageTemplate]: 'MultipleMix',
  [moduleTypes.videoTemplate]: 'MultipleMix',
};

export const contentsubtypes = {
  hairstyle: 'hairstyle', // need to split to hairStyle and hairColor
  hairTransfer: 'hairTransfer',
  hairExt: 'hairExt',
  hairBang: 'hairBang',
  wig: 'wig', // not use ?
  hairVol: 'hairVol',
  wavy: 'hairCurl',
  combo: 'combo',
  img2Vid: 'img2Vid',
  viduVidTmpl: 'viduVidTmpl',

  mixV2: 'mixV2',
  kliVidEff: 'kliVidEff',
  img2VidV2: 'img2VidV2',
  viduImg2Vid: 'viduImg2Vid',
  viduRef2Vid: 'viduRef2Vid',
  pvImg2Vid: 'pvImg2Vid',
  pvVidTmpl: 'pvVidTmpl',
};

export const hairStyleUseContentSubType = [
  contentsubtypes.hairstyle,
  contentsubtypes.hairTransfer,
  contentsubtypes.hairExt,
  contentsubtypes.hairBang,
  contentsubtypes.hairVol,
  contentsubtypes.wavy,
];

export const img2VidUseContentSubType = [
  contentsubtypes.combo,
  contentsubtypes.img2Vid,
  contentsubtypes.viduVidTmpl,

  contentsubtypes.mixV2,
  contentsubtypes.kliVidEff,
  contentsubtypes.img2VidV2,
  contentsubtypes.viduImg2Vid,
  contentsubtypes.viduRef2Vid,
  contentsubtypes.pvImg2Vid,
  contentsubtypes.pvVidTmpl,
];

// 目的：回傳支援這些的效果的acms資料
export const supportPFengineSingleEffects = [
  'fashionV2',
  'hairCurl',
  'smile',
  'livePort',
  'hairVol',
  'txt2Img',
  'creaFusion',
  'avtV3Img',
  'avatarV3',
  'avtV3Art',
  'bgReplace',
  'hairBang',
  'headshot',
  'selfie',
  'fashion',
  'wig',
  'hairExt',
  'hairStyle',
  'enhance',
  'colorize',
  'scrRemoval',
  'selfie',
  'selfie',
  'avatarV3',
];

export const DEFAULT_GUID = '11533c6d-b162-11ef-b35c-0a79301afc03';
export const CUSTOM_CATEGORY = 'hot';

export const acmsLanguageType = supportedTranslationsV2;
