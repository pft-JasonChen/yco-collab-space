/**
 * A mapping of module types.
 * @typedef {{ [key: string]: string }} ModuleTypes
 */

export const moduleTypes = {
  enhance: 'enhance',
  enhanceBatch: 'enhanceBatch', // TODO: update moduleType to be same as API effect
  objRemoval: 'objRemoval',
  genFill: 'genFill',
  sod: 'sod',
  colorize: 'colorize',
  lighting: 'lighting',
  avatar: 'avatar',
  avatarPet: 'avatarPet',
  txt2Img: 'txt2Img',
  hairStyle: 'hairStyle',
  hairTransfer: 'hairTransfer',
  hairBang: 'hairBang',
  hairExt: 'hairExt',
  hairVol: 'hairVol',
  objReplace: 'objReplace',
  avtV3Img: 'avtV3Img',
  avtV3Art: 'avtV3Art',
  aiApi: 'aiApi',
  profilePictureMaker: 'profilePictureMaker',
  aiFaceGenerator: 'aiFaceGenerator',
  headshot: 'headshot',
  muTransfer: 'muTransfer',
  aiCharacterGenerator: 'aiCharacterGenerator',
  oldPhotoRestoration: 'oldPhotoRestoration',
  home: 'home',
  removeBackground: 'removeBackground',
  changeBackground: 'changeBackground',
  blurBackground: 'blurBackground',
  banner: 'banner',
  flipAndRotateImage: 'flipAndRotateImage',
  resizeImage: 'resizeImage',
  cropPhoto: 'cropPhoto',
  aiGirlGenerator: 'aiGirlGenerator',
  passportPhotoMaker: 'passportPhotoMaker',
  outPaint: 'outPaint',
  flipPhoto: 'flipPhoto',
  rotatePhoto: 'rotatePhoto',
  aiArtWorkGenerator: 'aiArtWorkGenerator',
  photoToCartoon: 'photoToCartoon',
  gridModule: 'gridModule',
  useCaseMenu: 'useCaseMenu',
  animeAiArtGenerator: 'animeAiArtGenerator',
  colorCorrection: 'colorCorrection',
  videoSr: 'videoSr',
  videoObjRemover: 'objRemVidV2',
  aiPhotoRepair: 'aiPhotoRepair',
  faceShapeDetector: 'faceShapeDetector',
  faceAnalyzerPreview: 'faceShapeDetectorPreview',
  faceSwap: 'faceSwap',
  faceSwapVid: 'faceSwapVid',
  affiliateEventGift: 'affiliateEventGift',
  affiliateEventGiftv2: 'affiliateEventGiftv2',
  categoryEditing: 'categoryEditing',
  categoryGenAi: 'categoryGenAi',
  categoryFaceAi: 'categoryFaceAi',
  categoryAiPortrait: 'categoryAiPortrait',
  categoryAiVidEditing: 'categoryAiVidEditing',
  dehazePhoto: 'dehazePhoto',
  shaprenImage: 'shaprenImage',
  unblurImage: 'unblurImage',
  watermarkRemover: 'watermarkRemover',
  aiVideoFilters: 'videoTrans',
  aiPortrait: 'aiPortrait',
  img2Vid: 'img2Vid',
  img2VidStd: 'img2VidStd',
  img2VidPro: 'img2VidPro',
  combo: 'combo',
  viduVidTmpl: 'viduVidTmpl',
  mixV2: 'mixV2',
  kliVidEff: 'kliVidEff',
  img2VidV2: 'img2VidV2',
  viduImg2Vid: 'viduImg2Vid',
  viduRef2Vid: 'viduRef2Vid',
  pvImg2Vid: 'pvImg2Vid',
  pvVidTmpl: 'pvVidTmpl',
  aiVideoEditor: 'kliVidEdt',
  characterMotionSwap: 'motionTransfer',
  makeup: 'makeup',
  imageConverterBatch: 'imageConverterBatch',
  imageConverter: 'imageConverter',
  aiSelfieGenerator: 'aiSelfieGenerator',
  transparentBackground: 'transparentBackground',
  adjustLightColor: 'adjustLightColor',
  productPageForNewCMS: 'productPageForNewCMS',
  useCaseProductPageForNewCMS: 'useCaseProductPageForNewCMS',
  categoryPageForCMS: 'categoryPageForCMS',
  hairWavy: 'hairCurl',
  skinAnalysis: 'skinAnalysis',
  batchEditing: 'batchEditing',
  commercialUseAllowed: 'commercialUseAllowed',
  faceReshape: 'faceReshape',
  faceRetouch: 'retouch',
  aiClothes: 'clothV3',
  aiFabric: 'fabric',
  aiIllustrationGenerator: 'aiIllustrationGenerator',
  aiGhibliFilter: 'aiGhibliFilter',
  aiImageUpscaler: 'aiImageUpscaler',
  unpixelateImage: 'unpixelateImage',
  aiImageEnlarger: 'aiImageEnlarger',
  recolorImage: 'recolorImage',
  removePeopleFromPhoto: 'removePeopleFromPhoto',
  aiAnimateIllustration: 'aiAnimateIllustration',
  unblurVideo: 'unblurVideo',
  aiActionFigureGenerator: 'aiActionFigureGenerator',
  hairColor: 'hairColor', // 1.21 API
  removeGlareFromPhoto: 'removeGlareFromPhoto',
  edit: 'edit',
  skinToneAnalyzer: 'skinToneAnalyzer',
  avatarV3: 'avatarV3',
  livePort: 'livePort',
  livePortVid: 'livePortVid',
  fashion: 'fashion',
  fashionV2: 'fashionV2',
  wig: 'wig',
  beardFilter: 'beardStyle',
  hairColorChanger: 'hairColorChanger',
  bodyReshape: 'bodyReshape',
  hairType: 'hairType', // 1.3 API
  hairLength: 'hairLength', // 1.3 API
  hairFrizziness: 'hairFrizziness', // 1.3 API
  facialRatio: 'facialRatio', // 1.3 API
  skinToneAPI: 'skinToneAPI', // 1.3 API
  beardStyleAPI: 'beardStyleAPI', // 1.3 API
  faceAttributeAPI: 'faceAttributeAPI', // 1.3 API
  aiAgingAPI: 'aiAgingAPI', // 1.4 API
  affiliates: 'affiliates', // affiliate program
  aiClothV2: 'aiClothV2', // 1.6 API
  textToVideo: 'txt2Vid',
  photoFilterEffect: 'photoFilterEffect',
  aiMakeup: 'aiMakeup', // 1.5 API
  aiLook: 'aiLook', // 1.5 API
  contest: 'contest',
  arRing: 'arRing', // 1.7 API
  arWatch: 'arWatch', // 1.7 API
  arBracelet: 'arBracelet', // 1.7 API
  arEarrings: 'arEarrings', // 1.7 API
  arNecklace: 'arNecklace', // 1.7 API
  aiBag: 'aiBag', // 1.7 API
  aiShoes: 'aiShoes', // 1.7 API
  aiScarves: 'aiScarves', // 1.7 API
  aiHat: 'aiHat', // 1.7 API
  aiNail: 'aiNail', // 1.8 API
  hairDensity: 'hairDensity', // 1.10 API
  teethWhitening: 'teethWhitening', // 1.10 API
  eyeColor: 'eyeColor', // 1.10 API
  txt2ImgV2: 'txt2ImgV2', // 1.10 API
  img2VidV2API: 'img2VidV2API', // 1.10 API
  hairStyleV1API: 'hairStyleV1API', // 1.9 API
  hairStyleV2API: 'hairStyleV2API', // 1.9 API
  skinSimulationAPI: 'skinSimulationAPI', // 1.9 API
  breastSimulatorAPI: 'breastSimulatorAPI', // 1.9 API
  bodyReshapeAPI: 'bodyReshapeAPI', // 1.8 API
  aiAgent: 'aiAgent',
  aiAgentConnector: 'aiAgentConnector',
  aiAgentGeneralChat: 'aiAgentGeneralChat',
  aiAgentMultiImage: 'aiAgentMultiImage',
  aiAgentAdvanced: 'aiAgentAdvanced',
  aiAgentVideo: 'aiAgentVideo',
  supportChatbot: 'supportChatbot',
  imageTemplate: 'imageTemplate',
  videoTemplate: 'videoTemplate',
};

export const crossPromoteTypes = {
  [moduleTypes.enhance]: 'photo.enhance',
  [moduleTypes.enhanceBatch]: 'photo.enhance.batch',
  [moduleTypes.objRemoval]: 'object.removal',
  [moduleTypes.genFill]: 'gen.fill',
  [moduleTypes.removeBackground]: 'remove.background',
  [moduleTypes.changeBackground]: 'change.background',
  [moduleTypes.blurBackground]: 'blur.background',
  [moduleTypes.colorize]: 'colorize',
  [moduleTypes.lighting]: 'lighting',
  [moduleTypes.avatar]: 'avatar',
  [moduleTypes.txt2Img]: 'ai.art.generator',
  [moduleTypes.hairStyle]: 'ai.hairstyle.generator',
  [moduleTypes.hairBang]: 'bangs.filter',
  [moduleTypes.hairExt]: 'before.and.after.hair.extensions',
  [moduleTypes.hairVol]: 'add.hair.to.photo.with.ai',
  [moduleTypes.aiApi]: 'ai.api',
  [moduleTypes.resizeImage]: 'resize.photo',
  [moduleTypes.cropPhoto]: 'crop.photo',
  [moduleTypes.flipAndRotateImage]: 'flip.and.rotate.photo',
  [moduleTypes.outPaint]: 'out.paint',
  [moduleTypes.objReplace]: 'obj.replace',
  [moduleTypes.avtV3Img]: 'ai.portrait.generator',
  [moduleTypes.avtV3Art]: 'avatar.v3.art',
  [moduleTypes.muTransfer]: 'makeup.transfer',
  [moduleTypes.headshot]: 'ai.headshot.generator',
  [moduleTypes.colorCorrection]: 'color.correction',
  [moduleTypes.videoSr]: 'video.enhancer',
  [moduleTypes.faceSwap]: 'face.swap',
  [moduleTypes.faceSwapVid]: 'video.face.swap',
  [moduleTypes.faceShapeDetector]: 'face.shape.detector',
  [moduleTypes.aiVideoFilters]: 'ai.video.filters',
  [moduleTypes.aiPortrait]: 'ai.portrait.generator.fake',
  [moduleTypes.img2Vid]: 'img.to.video',
  [moduleTypes.img2VidStd]: 'img.to.video.std',
  [moduleTypes.img2VidPro]: 'img.to.video.pro',
  [moduleTypes.makeup]: 'ai.makeup',
  [moduleTypes.imageConverter]: 'image.converter',
  [moduleTypes.imageConverterBatch]: 'image.converter.batch',
  [moduleTypes.adjustLightColor]: 'adjust.light.n.color',
  [moduleTypes.hairWavy]: 'ai.hair.wavy',
  [moduleTypes.skinAnalysis]: 'ai.skin.analysis',
  [moduleTypes.batchEditing]: 'photo.enhance.batch',
  [moduleTypes.commercialUseAllowed]: 'commercial.use.allowed',
  [moduleTypes.faceReshape]: 'face.reshape',
  [moduleTypes.faceRetouch]: 'face.retouch',
  [moduleTypes.aiClothes]: 'ai.clothes',
  [moduleTypes.aiFabric]: 'ai.fabric',
  [moduleTypes.aiIllustrationGenerator]: 'ai.illustration.generator',
  [moduleTypes.aiGhibliFilter]: 'ai.ghibli.filter',
  [moduleTypes.aiImageUpscaler]: 'ai.image.upscaler',
  [moduleTypes.unpixelateImage]: 'unpixelate.image',
  [moduleTypes.aiImageEnlarger]: 'ai.image.enlarger',
  [moduleTypes.recolorImage]: 'recolor.image',
  [moduleTypes.removePeopleFromPhoto]: 'remove.people.from.photo',
  [moduleTypes.aiAnimateIllustration]: 'ai.animate.illustration',
  [moduleTypes.unblurVideo]: 'unblur.video',
  [moduleTypes.aiActionFigureGenerator]: 'ai.action.figure.generator',
  [moduleTypes.hairColor]: 'hair.color',
  [moduleTypes.removeGlareFromPhoto]: 'remove.glare.from.photo',
  [moduleTypes.skinToneAnalyzer]: 'skin.tone.analyzer',
  [moduleTypes.edit]: 'edit',
  [moduleTypes.viduVidTmpl]: 'vidu.vid.tmpl',
  [moduleTypes.beardFilter]: 'beard.filter',
  [moduleTypes.hairColorChanger]: 'hair.color.changer',
  [moduleTypes.hairType]: 'hair.type',
  [moduleTypes.hairLength]: 'hair.length',
  [moduleTypes.hairFrizziness]: 'hair.frizziness',
  [moduleTypes.facialRatio]: 'facial.ratio',
  [moduleTypes.skinToneAPI]: 'skin.tone',
  [moduleTypes.beardStyleAPI]: 'beard.style',
  [moduleTypes.faceAttributeAPI]: 'face.attribute',
  [moduleTypes.aiAgingAPI]: 'ai.aging',
  [moduleTypes.aiClothV2]: 'ai.cloth.v2',
  [moduleTypes.textToVideo]: 'text.to.video',
  [moduleTypes.photoFilterEffect]: 'photo.filter.effect',
  [moduleTypes.aiMakeup]: 'makeup.virtual.try.ons',
  [moduleTypes.aiLook]: 'makeup.complete.looks.try.ons',
  [moduleTypes.bodyReshape]: 'body.reshape',
  [moduleTypes.videoObjRemover]: 'video.object.remover',
  [moduleTypes.aiPhotoRepair]: 'ai.photo.repair',
  [moduleTypes.aiVideoEditor]: 'ai.video.editor',
  [moduleTypes.characterMotionSwap]: 'ai.motion.transfer',
  [moduleTypes.arRing]: 'makeup.ar.ring',
  [moduleTypes.arWatch]: 'makeup.ar.watch',
  [moduleTypes.arBracelet]: 'makeup.ar.bracelet',
  [moduleTypes.arEarrings]: 'makeup.ar.earrings',
  [moduleTypes.arNecklace]: 'makeup.ar.necklace',
  [moduleTypes.aiBag]: 'makeup.ai.bag',
  [moduleTypes.aiShoes]: 'makeup.ai.shoes',
  [moduleTypes.aiScarves]: 'makeup.ai.scarves',
  [moduleTypes.aiHat]: 'makeup.ai.hat',
  [moduleTypes.aiNail]: 'makeup.nail.try.ons',
  [moduleTypes.hairDensity]: 'hair.density',
  [moduleTypes.teethWhitening]: 'teeth.whitening',
  [moduleTypes.eyeColor]: 'eye.color',
  [moduleTypes.txt2ImgV2]: 'text.to.image.v2',
  [moduleTypes.img2VidV2API]: 'image.to.video.v2',
  [moduleTypes.hairStyleV1API]: 'ai.hairstyle.generator.v1.api',
  [moduleTypes.hairStyleV2API]: 'ai.hairstyle.generator.v2.api',
  [moduleTypes.skinSimulationAPI]: 'skin.simulation.api',
  [moduleTypes.breastSimulatorAPI]: 'breast.simulator.api',
  [moduleTypes.bodyReshapeAPI]: 'body.reshape.api',
  [moduleTypes.aiAgent]: 'ai.agent',
  [moduleTypes.aiAgentConnector]: 'ai.agent.connector',
  [moduleTypes.aiAgentGeneralChat]: 'ai.agent.general.chat',
  [moduleTypes.aiAgentMultiImage]: 'ai.agent.multi.image',
  [moduleTypes.aiAgentAdvanced]: 'ai.agent.advanced',
  [moduleTypes.aiAgentVideo]: 'ai.agent.video',
  [moduleTypes.imageTemplate]: 'image.template',
  [moduleTypes.videoTemplate]: 'video.template',
};

export const sodTypes = {
  remove: 'remove',
  blur: 'blur',
  change: 'change',
};

export const productCategories = {
  photoEditing: 'photoEditing',
  basicEditing: 'basicEditing',
  generativeAI: 'generativeAI',
  faceAI: 'faceAI',
  portraitAi: 'portraitAi',
  videoEditing: 'videoEditing',
  batchEditing: 'batchEditing',
  hairAi: 'hairAi',
  others: 'others',
  aiAgent: 'aiAgent',
  skinAnalysis: 'skinAnalysis',
  faceAnalysis: 'faceAnalysis',
  fashionTryOn: 'fashionTryOn',
  jewelryAndWatchTryOn: 'jewelryAndWatchTryOn',
  imageEditing: 'imageEditing',
  hairAndBeard: 'hairAndBeard',
  faceAttributeAndRatio: 'faceAttributeAndRatio',
  faceToneAnalysis: 'faceToneAnalysis',
  faceAttribute: 'faceAttribute',
  facialRatio: 'facialRatio',
  aiAging: 'aiAging',
  makeup: 'makeup',
  faceAndBody: 'faceAndBody',
  beauty: 'beauty',
  skinSimulation: 'skinSimulation',
};

export const hairStyleTypes = [
  moduleTypes.hairStyle,
  moduleTypes.hairTransfer,
  moduleTypes.hairBang,
  moduleTypes.hairExt,
  moduleTypes.hairVol,
  moduleTypes.hairWavy,
];

export const basicEditingTypes = [
  moduleTypes.resizeImage,
  moduleTypes.cropPhoto,
  moduleTypes.flipAndRotateImage,
  moduleTypes.adjustLightColor,
];

// Upload rejects these outright, so their files are stored as `makeup` instead.
export const makeupUploadEffectTypes = [
  moduleTypes.adjustLightColor,
  moduleTypes.cropPhoto,
  moduleTypes.flipAndRotateImage,
  moduleTypes.resizeImage,
  moduleTypes.hairColorChanger,
  moduleTypes.photoFilterEffect,
  moduleTypes.bodyReshape,
];

export const img2VidSubTypes = [
  moduleTypes.img2Vid,
  moduleTypes.img2VidStd,
  moduleTypes.img2VidPro,
  moduleTypes.combo,
  moduleTypes.viduVidTmpl,
  moduleTypes.mixV2,
  moduleTypes.kliVidEff,
  moduleTypes.img2VidV2,
  moduleTypes.viduImg2Vid,
  moduleTypes.viduRef2Vid,
  moduleTypes.pvImg2Vid,
  moduleTypes.pvVidTmpl,
];

// 在 module banner 上是上傳影片的module types (input是影片的module types)
export const videoTypes4ModuleBanner = [
  moduleTypes.videoSr,
  moduleTypes.aiVideoFilters,
  moduleTypes.faceSwapVid,
  moduleTypes.videoObjRemover,
  moduleTypes.aiVideoEditor,
  moduleTypes.characterMotionSwap,
];

export const nonBlockingVideoTypes = [
  moduleTypes.videoSr,
  moduleTypes.aiVideoFilters,
  moduleTypes.faceSwapVid,
  moduleTypes.img2Vid,
  moduleTypes.textToVideo,
  moduleTypes.videoObjRemover,
  moduleTypes.aiVideoEditor,
  moduleTypes.characterMotionSwap,
];

//是結果是影片的module types (且在這邊是為了方便cross-promote的流程)
export const videoTypes4CrossPromote = [
  moduleTypes.videoSr,
  moduleTypes.aiVideoFilters,
  moduleTypes.faceSwapVid,
  moduleTypes.img2Vid,
  moduleTypes.textToVideo,
  moduleTypes.videoObjRemover,
  moduleTypes.aiVideoEditor,
  moduleTypes.characterMotionSwap,
  moduleTypes.videoTemplate,
];

export const batchTypes = [
  moduleTypes.enhanceBatch,
  moduleTypes.imageConverterBatch,
];

export const withoutGeneralToolPageSet = new Set([
  moduleTypes.avatar,
  moduleTypes.avtV3Art,
  moduleTypes.avtV3Img,
  moduleTypes.avtV3Art,
  moduleTypes.headshot,
]);

export const copyHistoryResultModules = [
  moduleTypes.faceSwapVid,
  moduleTypes.img2Vid,
  moduleTypes.enhance,
  moduleTypes.makeup,
  moduleTypes.lighting,
  moduleTypes.objRemoval,
  moduleTypes.colorize,
  moduleTypes.colorCorrection,
  moduleTypes.aiClothes,
  moduleTypes.faceReshape,
  moduleTypes.faceRetouch,
  moduleTypes.beardFilter,
  moduleTypes.textToVideo,
  moduleTypes.photoFilterEffect,
  moduleTypes.txt2Img,
  ...hairStyleTypes,
  moduleTypes.aiVideoFilters,
  moduleTypes.videoSr,
  moduleTypes.videoObjRemover,
  moduleTypes.aiVideoEditor,
  moduleTypes.characterMotionSwap,
  moduleTypes.imageTemplate,
  moduleTypes.videoTemplate,
];

// 圖片是必須依靠 sketch 來呈現結果的 module types
// 像是sod我們要自己合成
// WCM的則是從WCM拿canvas
export const sketchImageTypes = [
  moduleTypes.sod,
  moduleTypes.lighting,
  moduleTypes.makeup,
  moduleTypes.faceReshape,
  moduleTypes.faceRetouch,
  moduleTypes.hairColorChanger,
  moduleTypes.photoFilterEffect,
  moduleTypes.bodyReshape,
  ...basicEditingTypes,
];

export const skipGuidelineTypes = [
  ...hairStyleTypes,
  moduleTypes.muTransfer,
  moduleTypes.aiClothes,
  moduleTypes.beardFilter,
  // moduleTypes.faceSwapVid
];

// 有guideline的 module types
export const hasGuidelineSet = new Set([
  moduleTypes.aiClothes,
  moduleTypes.beardFilter,
  moduleTypes.faceSwapVid,
  ...hairStyleTypes,
  moduleTypes.muTransfer,
]);

// 沒有使用次數限制的 module types
export const noLimitTypes = [
  moduleTypes.makeup,
  moduleTypes.faceReshape,
  moduleTypes.faceRetouch,
  moduleTypes.hairColorChanger,
  moduleTypes.photoFilterEffect,
  moduleTypes.bodyReshape,
];

// MD5-based consumed tracking modules
// These modules track download history by MD5 hash of config instead of URL
export const md5BasedModulesSet = new Set([
  moduleTypes.sod,
  moduleTypes.lighting,
  moduleTypes.makeup,
  moduleTypes.faceReshape,
  moduleTypes.faceRetouch,
  moduleTypes.hairColorChanger,
  moduleTypes.photoFilterEffect,
  moduleTypes.bodyReshape,
  moduleTypes.adjustLightColor,
]);

// 用來跳過handleFeatureClick的module types
// 因為現在拿掉loading，user可以自由的點選cross-promote or cancel
// 在 processing 時仍允許操作
export const processingAllowedSet = new Set([
  moduleTypes.enhance,
  moduleTypes.objRemoval,
  moduleTypes.colorCorrection,
  moduleTypes.colorize,
  moduleTypes.objReplace,
  moduleTypes.outPaint,
  ...videoTypes4CrossPromote,
  moduleTypes.lighting,
  moduleTypes.cropPhoto,
  moduleTypes.resizeImage,
  moduleTypes.flipAndRotateImage,
  moduleTypes.aiPhotoRepair,
]);

// 在 processing 時切換功能需要顯示離開警告的模块
// objReplace 不在此列表中，因為他必須user選到那張正在processing的才要跳
export const processingWarnOnLeaveSet = new Set([
  moduleTypes.enhance,
  moduleTypes.objRemoval,
  moduleTypes.colorCorrection,
  moduleTypes.colorize,
  moduleTypes.lighting,
  moduleTypes.cropPhoto,
  moduleTypes.resizeImage,
  moduleTypes.flipAndRotateImage,
]);

export const singleToolPageModuleTypes = [
  moduleTypes.enhance,
  moduleTypes.sod,
  moduleTypes.colorCorrection,
  moduleTypes.colorize,
  moduleTypes.lighting,
  moduleTypes.makeup,
  moduleTypes.faceReshape,
  moduleTypes.faceRetouch,
  moduleTypes.objReplace,
  moduleTypes.objRemoval,
  ...hairStyleTypes,
  moduleTypes.muTransfer,
  moduleTypes.outPaint,
  moduleTypes.aiClothes,
  ...basicEditingTypes,
  moduleTypes.beardFilter,
  moduleTypes.hairColorChanger,
  moduleTypes.photoFilterEffect,
  moduleTypes.bodyReshape,
  moduleTypes.aiPhotoRepair,
];

// Non-auto-run 功能：上傳/進入頁面時不擋額度，改在點 Generate 時才檢查 (YCO260401P0020)
export const skipUsageCheckSet = new Set([
  moduleTypes.objReplace,
  moduleTypes.objRemoval,
  moduleTypes.outPaint,
  moduleTypes.aiPhotoRepair,
]);

// 多結果 module：用 productConfig[moduleType].currentResultLoading 取代 global state.task.processing 來
// 決定 DownloadModal 的 isButtonBusy；避免 polling 走 _BY_TASK variant 時 processing 卡 true 的舊問題。
export const currentResultLoadingModuleSet = new Set([
  moduleTypes.aiPhotoRepair,
  moduleTypes.aiClothes,
  moduleTypes.objReplace,
  moduleTypes.outPaint,
]);

// 沒有登入的user，要檢查previewLeft的moduleType類型
export const userUserCheckPreviewLeftSet = new Set([
  moduleTypes.enhance,
  moduleTypes.sod,
  moduleTypes.colorize,
  moduleTypes.colorCorrection,
  moduleTypes.lighting,
  moduleTypes.videoSr,
]);

// 登入了但沒有訂閱的user，要檢查previewLeft的moduleType類型
export const freeUserCheckPreviewLeftModuleTypes = [
  moduleTypes.enhance,
  moduleTypes.sod,
  moduleTypes.colorize,
  moduleTypes.colorCorrection,
  moduleTypes.lighting,
  //  moduleTypes.objRemoval, // https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YCE250729P0006
  // moduleTypes.objReplace, // YCO260401P0020: non-auto-run features should not block on enter tool page
  // moduleTypes.outPaint, // YCO260401P0020: non-auto-run features should not block on enter tool page
  moduleTypes.hairColorChanger,
];

// plus的user，要檢查previewLeft的moduleType類型
export const plusUserCheckPreviewLeftModuleTypes = [
  moduleTypes.enhance,
  moduleTypes.sod,
  //  moduleTypes.objRemoval, // https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YCE250729P0006
];

// pro的user，要檢查previewLeft的moduleType類型
export const proUserCheckPreviewLeftModuleTypes = [moduleTypes.objRemoval];
