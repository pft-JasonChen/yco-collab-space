import {
  crossPromoteTypes,
  moduleTypes,
  productUrls,
} from '@/utils/moduleTypes';

const sideBarMenuUtils = {
  getCategoryNameMappingKey: (categoryName) => {
    switch (categoryName) {
      case 'Home':
        return 'header.items.product.group.home';
      case 'AI Photo Editing':
        return 'side.bar.menu.category.ai.photo.editing';
      case 'AI Video Editing':
      case 'AI Video':
        return 'side.bar.menu.category.ai.video.editing';
      case 'AI Fashion':
        return 'side.bar.menu.category.ai.fashion';
      case 'AI Beauty':
        return 'side.bar.menu.category.ai.beauty';
      case 'AI Generator':
        return 'side.bar.menu.category.ai.generator';
      case 'Basic Editing':
        return 'side.bar.menu.category.basic.editing';
      case 'Batch Editing':
        return 'side.bar.menu.category.subcategory.batch.editing';
      case 'My Gallery':
        return 'my.account.tabs.gallery';
      case 'Contest':
        return 'header.items.product.contest';
      case 'AI Image':
        return 'side.bar.menu.category.ai.image';
      case 'AI Agent':
        return 'header.items.product.ai.agent';
      default:
        return '';
    }
  },
  getCategoryNameMappingIcon: (categoryGroup) => {
    switch (categoryGroup) {
      case crossPromoteCategoryGroups.photoEditing:
        return '/assets/images/header/icon_ai-photo-editing.svg';
      case crossPromoteCategoryGroups.videoEditing:
        return '/assets/images/header/icon_ai-video-editing.svg';
      case crossPromoteCategoryGroups.aiFashion:
        return '/assets/images/header/icon_ai-fashion.svg';
      case crossPromoteCategoryGroups.aiBeauty:
        return '/assets/images/header/icon_ai-beauty.svg';
      case crossPromoteCategoryGroups.aiGenerator:
        return '/assets/images/header/icon_generative-ai.svg';
      case crossPromoteCategoryGroups.basicEditing:
        return '/assets/images/header/icon_ai-photo-editing.svg';
      // No dedicated template icon asset exists yet — reuses generative-ai's icon.
      case crossPromoteCategoryGroups.template:
        return '/assets/images/header/icon_generative-ai.svg';
      default:
        return '/assets/images/header/icon_ai-photo-editing.svg';
    }
  },
  getCategoryNameMappingIconFont: (categoryGroup) => {
    switch (categoryGroup) {
      case crossPromoteCategoryGroups.photoEditing:
        return 'ic-photo-editing';
      case crossPromoteCategoryGroups.videoEditing:
        return 'ic-ai-video';
      case crossPromoteCategoryGroups.aiFashion:
        return 'ic-hair';
      case crossPromoteCategoryGroups.aiBeauty:
        return 'ic-retouch';
      case crossPromoteCategoryGroups.aiGenerator:
        return 'ic-start-editing';
      case crossPromoteCategoryGroups.basicEditing:
        return 'ic-filter';
      case crossPromoteCategoryGroups.aiPortrait:
        return 'ic-user-sparkle';
      case crossPromoteCategoryGroups.batchEditing:
        return 'ic-layers';
      case crossPromoteCategoryGroups.aiImage:
        return 'ic-ai-image';
      case crossPromoteCategoryGroups.template:
        return 'ic-start-editing';
      case 'Gallery':
        return 'ic-image';
      default:
        return 'ic-photo-editing';
    }
  },

  convertUrlToKey: (url) => {
    if (!url) return null;

    const path = url.startsWith('/') ? url.slice(1) : url;
    const [first, ...rest] = path.split('/');
    const [second, ...others] = rest;
    const base =
      first === 'products'
        ? second.replace(/-/g, '.')
        : first.replace(/-/g, '.');

    if (rest[rest.length - 1] === 'batch') {
      return `${base}.batch`;
    }

    switch (base) {
      case 'ai.replace':
        return crossPromoteTypes[[moduleTypes.objReplace]];
      case 'ai.image.extender':
        return crossPromoteTypes[[moduleTypes.outPaint]];
      case 'ai.lighting':
        return crossPromoteTypes[[moduleTypes.lighting]];
      case 'resize.image':
        return crossPromoteTypes[[moduleTypes.resizeImage]];
      case 'flip.and.rotate.image':
        return crossPromoteTypes[[moduleTypes.flipAndRotateImage]];
      case 'video.enhancer.ai':
        return crossPromoteTypes[[moduleTypes.videoSr]];
      case 'ai.video.generator':
        return crossPromoteTypes[[moduleTypes.img2Vid]];
      case 'ai.text.to.video.generator':
        return crossPromoteTypes[[moduleTypes.textToVideo]];
      case 'facial.makeup.transfer.filter':
        return crossPromoteTypes[[moduleTypes.muTransfer]];
      default:
        return base;
    }
  },

  findCategoryContentGrouped: (category) => {
    const matchedItems = crossPromoteMenuMapping.filter(
      (item) => item.category === category
    );

    const withOrder = matchedItems.map((item) => {
      const subMeta = crossPromoteSubCategories.find(
        (sub) => sub.subCategoryGroup === item.subCategory
      );
      return {
        ...item,
        displayOrder: subMeta ? subMeta.displayOrder : 999,
      };
    });

    withOrder.sort((a, b) => a.displayOrder - b.displayOrder);

    const grouped = withOrder.reduce((acc, item) => {
      const key = item.subCategory || 'noSubCategory';
      acc[key] = item.products;
      return acc;
    }, {});

    return grouped;
  },

  findCategoryNameByGroup: (categoryGroup) => {
    const category = crossPromoteCategories.find(
      (cat) => cat.categoryGroup === categoryGroup
    );
    return category ? category.categoryName : '';
  },

  findSubCategoryNameByGroup: (subCategoryGroup) => {
    const subCategory = crossPromoteSubCategories.find(
      (subCat) => subCat.subCategoryGroup === subCategoryGroup
    );
    return subCategory ? subCategory.subCategoryName : '';
  },
};

const crossPromoteCategoryGroups = {
  photoEditing: 'photoEditing',
  videoEditing: 'videoEditing',
  aiGenerator: 'aiGenerator',
  basicEditing: 'basicEditing',
  batchEditing: 'batchEditing',
  aiPortrait: 'aiPortrait',
  aiImage: 'aiImage',
  template: 'template',
};

const crossPromoteSubCategoryGroups = {
  aiPhotoRestoration: 'aiPhotoRestoration',
  aiEdit: 'aiEdit',
  backgroundTools: 'backgroundTools',
  basicEdits: 'basicEdits',
  batchEditing: 'batchEditing',
  aiFashion: 'aiFashion',
  aiBeauty: 'aiBeauty',
  aiGenerator: 'aiGenerator',
};

const crossPromoteCategories = [
  {
    categoryGroup: crossPromoteCategoryGroups.photoEditing,
    categoryName: 'side.bar.menu.category.ai.photo.editing',
    displayOrder: 1,
  },
  {
    categoryGroup: crossPromoteCategoryGroups.basicEditing,
    categoryName: 'side.bar.menu.category.basic.editing',
    displayOrder: 2,
  },
  {
    categoryGroup: crossPromoteCategoryGroups.videoEditing,
    categoryName: 'side.bar.menu.category.ai.video.editing',
    displayOrder: 3,
  },
  {
    categoryGroup: crossPromoteCategoryGroups.aiImage,
    categoryName: 'side.bar.menu.category.ai.image',
    displayOrder: 4,
  },
  {
    categoryGroup: crossPromoteCategoryGroups.aiPortrait,
    categoryName: 'header.items.product.group.ai.portrait',
    displayOrder: 5,
  },
  {
    categoryGroup: crossPromoteCategoryGroups.batchEditing,
    categoryName: 'side.bar.menu.category.subcategory.batch.editing',
    displayOrder: 6,
  },
  {
    categoryGroup: crossPromoteCategoryGroups.template,
    categoryName: 'side.bar.menu.category.template',
    displayOrder: 7,
  },
];

const crossPromoteSubCategories = [
  {
    subCategoryGroup: crossPromoteSubCategoryGroups.aiPhotoRestoration,
    subCategoryName: 'side.bar.menu.category.subcategory.ai.photo.restoration',
    displayOrder: 1,
  },
  {
    subCategoryGroup: crossPromoteSubCategoryGroups.aiEdit,
    subCategoryName: 'side.bar.menu.category.subcategory.ai.edit',
    displayOrder: 2,
  },
  {
    subCategoryGroup: crossPromoteSubCategoryGroups.backgroundTools,
    subCategoryName: 'side.bar.menu.category.subcategory.background.tools',
    displayOrder: 3,
  },
  {
    subCategoryGroup: crossPromoteSubCategoryGroups.aiFashion,
    subCategoryName: 'side.bar.menu.category.ai.fashion',
    displayOrder: 4,
  },
  {
    subCategoryGroup: crossPromoteSubCategoryGroups.aiBeauty,
    subCategoryName: 'side.bar.menu.category.ai.beauty',
    displayOrder: 5,
  },
  {
    subCategoryGroup: crossPromoteSubCategoryGroups.aiGenerator,
    subCategoryName: 'side.bar.menu.category.ai.generator',
    displayOrder: 6,
  },
];

const crossPromoteMenuMapping = [
  {
    category: crossPromoteCategoryGroups.photoEditing,
    subCategory: crossPromoteSubCategoryGroups.aiPhotoRestoration,
    productNames: [
      'Photo Enhance',
      'AI Colorize',
      'AI Lighting',
      'AI Color Correction',
    ],
    products: [
      {
        moduleType: moduleTypes.enhance,
        crossPromoteType: crossPromoteTypes[[moduleTypes.enhance]],
        targetUrl: productUrls[[moduleTypes.enhance]],
      },
      {
        moduleType: moduleTypes.aiPhotoRepair,
        crossPromoteType: crossPromoteTypes[[moduleTypes.aiPhotoRepair]],
        targetUrl: productUrls[[moduleTypes.aiPhotoRepair]],
      },
      {
        moduleType: moduleTypes.colorize,
        crossPromoteType: crossPromoteTypes[[moduleTypes.colorize]],
        targetUrl: productUrls[[moduleTypes.colorize]],
      },
      {
        moduleType: moduleTypes.lighting,
        crossPromoteType: crossPromoteTypes[[moduleTypes.lighting]],
        targetUrl: productUrls[[moduleTypes.lighting]],
      },
      {
        moduleType: moduleTypes.colorCorrection,
        crossPromoteType: crossPromoteTypes[[moduleTypes.colorCorrection]],
        targetUrl: productUrls[[moduleTypes.colorCorrection]],
      },
    ],
  },
  {
    category: crossPromoteCategoryGroups.photoEditing,
    subCategory: crossPromoteSubCategoryGroups.aiEdit,
    productNames: ['Object Removal', 'AI Image Extender', 'AI Replace'],
    products: [
      {
        moduleType: moduleTypes.objRemoval,
        crossPromoteType: crossPromoteTypes[[moduleTypes.objRemoval]],
        targetUrl: productUrls[[moduleTypes.objRemoval]],
      },
      {
        moduleType: moduleTypes.outPaint,
        crossPromoteType: crossPromoteTypes[[moduleTypes.outPaint]],
        targetUrl: productUrls[[moduleTypes.outPaint]],
      },
      {
        moduleType: moduleTypes.objReplace,
        crossPromoteType: crossPromoteTypes[[moduleTypes.objReplace]],
        targetUrl: productUrls[[moduleTypes.objReplace]],
      },
    ],
  },
  {
    category: crossPromoteCategoryGroups.photoEditing,
    subCategory: crossPromoteSubCategoryGroups.backgroundTools,
    productNames: ['Remove Background', 'Change Background'],
    products: [
      {
        moduleType: moduleTypes.removeBackground,
        crossPromoteType: crossPromoteTypes[[moduleTypes.removeBackground]],
        targetUrl: productUrls[[moduleTypes.sod]].remove,
      },
      {
        moduleType: moduleTypes.changeBackground,
        crossPromoteType: crossPromoteTypes[[moduleTypes.changeBackground]],
        targetUrl: productUrls[[moduleTypes.sod]].change,
      },
    ],
  },
  {
    category: crossPromoteCategoryGroups.basicEditing,
    subCategory: null,
    productNames: [
      'Effect',
      'Adjust Light & Color',
      'Crop',
      'Resize',
      'Flip & Rotate',
      'Image Converter',
    ],
    products: [
      {
        moduleType: moduleTypes.photoFilterEffect,
        crossPromoteType: crossPromoteTypes[[moduleTypes.photoFilterEffect]],
        targetUrl: productUrls[[moduleTypes.photoFilterEffect]],
      },
      {
        moduleType: moduleTypes.adjustLightColor,
        crossPromoteType: crossPromoteTypes[[moduleTypes.adjustLightColor]],
        targetUrl: productUrls[[moduleTypes.adjustLightColor]],
      },
      {
        moduleType: moduleTypes.cropPhoto,
        crossPromoteType: crossPromoteTypes[[moduleTypes.cropPhoto]],
        targetUrl: productUrls[[moduleTypes.cropPhoto]],
      },
      {
        moduleType: moduleTypes.resizeImage,
        crossPromoteType: crossPromoteTypes[[moduleTypes.resizeImage]],
        targetUrl: productUrls[[moduleTypes.resizeImage]],
      },
      {
        moduleType: moduleTypes.flipAndRotateImage,
        crossPromoteType: crossPromoteTypes[[moduleTypes.flipAndRotateImage]],
        targetUrl: productUrls[[moduleTypes.flipAndRotateImage]],
      },
      {
        moduleType: moduleTypes.imageConverter,
        crossPromoteType: crossPromoteTypes[[moduleTypes.imageConverter]],
        targetUrl: productUrls[[moduleTypes.imageConverter]],
      },
    ],
  },
  {
    category: crossPromoteCategoryGroups.videoEditing,
    subCategory: null,
    productNames: [
      'Video Enhance',
      'Image to Video',
      'Video Face Swap',
      'Text to Video',
      'Video Style Transfer',
    ],
    products: [
      {
        moduleType: moduleTypes.videoSr,
        crossPromoteType: crossPromoteTypes[[moduleTypes.videoSr]],
        targetUrl: productUrls[[moduleTypes.videoSr]],
      },
      {
        moduleType: moduleTypes.img2Vid,
        crossPromoteType: crossPromoteTypes[[moduleTypes.img2Vid]],
        targetUrl: productUrls[[moduleTypes.img2Vid]],
      },
      {
        moduleType: moduleTypes.faceSwapVid,
        crossPromoteType: crossPromoteTypes[[moduleTypes.faceSwapVid]],
        targetUrl: productUrls[[moduleTypes.faceSwapVid]],
      },
      {
        moduleType: moduleTypes.textToVideo,
        crossPromoteType: crossPromoteTypes[[moduleTypes.textToVideo]],
        targetUrl: productUrls[[moduleTypes.textToVideo]],
      },
      {
        moduleType: moduleTypes.aiVideoFilters,
        crossPromoteType: crossPromoteTypes[[moduleTypes.aiVideoFilters]],
        targetUrl: productUrls[[moduleTypes.aiVideoFilters]],
      },
      {
        moduleType: moduleTypes.videoObjRemover,
        crossPromoteType: crossPromoteTypes[[moduleTypes.videoObjRemover]],
        targetUrl: productUrls[[moduleTypes.videoObjRemover]],
      },
      {
        moduleType: moduleTypes.aiVideoEditor,
        crossPromoteType: crossPromoteTypes[[moduleTypes.aiVideoEditor]],
        targetUrl: productUrls[[moduleTypes.aiVideoEditor]],
      },
      {
        moduleType: moduleTypes.characterMotionSwap,
        crossPromoteType: crossPromoteTypes[[moduleTypes.characterMotionSwap]],
        targetUrl: productUrls[[moduleTypes.characterMotionSwap]],
      },
    ],
  },
  {
    category: crossPromoteCategoryGroups.aiPortrait,
    subCategory: crossPromoteSubCategoryGroups.aiFashion,
    productNames: [
      'AI Hairstyle Generator',
      'AI Hair Color',
      'AI Beard Style',
      'AI Clothes',
    ],
    products: [
      {
        moduleType: moduleTypes.hairStyle,
        crossPromoteType: crossPromoteTypes[[moduleTypes.hairStyle]],
        targetUrl: productUrls[[moduleTypes.hairStyle]],
      },
      {
        moduleType: moduleTypes.hairColorChanger,
        crossPromoteType: crossPromoteTypes[[moduleTypes.hairColorChanger]],
        targetUrl: productUrls[[moduleTypes.hairColorChanger]],
      },
      {
        moduleType: moduleTypes.beardFilter,
        crossPromoteType: crossPromoteTypes[[moduleTypes.beardFilter]],
        targetUrl: productUrls[[moduleTypes.beardFilter]],
      },
      {
        moduleType: moduleTypes.aiClothes,
        crossPromoteType: crossPromoteTypes[[moduleTypes.aiClothes]],
        targetUrl: productUrls[[moduleTypes.aiClothes]],
      },
    ],
  },
  {
    category: crossPromoteCategoryGroups.aiPortrait,
    subCategory: crossPromoteSubCategoryGroups.aiBeauty,
    productNames: [
      'Body Reshape',
      'AI Face Swap',
      'AI Face Reshape',
      'AI Face Shape Detector',
      'AI Face Retouch',
      'AI Makeup Virtual Try On',
      'AI Makeup Transfer',
    ],
    products: [
      {
        moduleType: moduleTypes.bodyReshape,
        crossPromoteType: crossPromoteTypes[[moduleTypes.bodyReshape]],
        targetUrl: productUrls[[moduleTypes.bodyReshape]],
      },
      {
        moduleType: moduleTypes.faceSwap,
        crossPromoteType: crossPromoteTypes[[moduleTypes.faceSwap]],
        targetUrl: productUrls[[moduleTypes.faceSwap]],
      },
      {
        moduleType: moduleTypes.faceReshape,
        crossPromoteType: crossPromoteTypes[[moduleTypes.faceReshape]],
        targetUrl: productUrls[[moduleTypes.faceReshape]],
      },
      {
        moduleType: moduleTypes.faceShapeDetector,
        crossPromoteType: crossPromoteTypes[[moduleTypes.faceShapeDetector]],
        targetUrl: productUrls[[moduleTypes.faceShapeDetector]],
      },
      {
        moduleType: moduleTypes.faceRetouch,
        crossPromoteType: crossPromoteTypes[[moduleTypes.faceRetouch]],
        targetUrl: productUrls[[moduleTypes.faceRetouch]],
      },
      {
        moduleType: moduleTypes.makeup,
        crossPromoteType: crossPromoteTypes[[moduleTypes.makeup]],
        targetUrl: productUrls[[moduleTypes.makeup]],
      },
      {
        moduleType: moduleTypes.muTransfer,
        crossPromoteType: crossPromoteTypes[[moduleTypes.muTransfer]],
        targetUrl: productUrls[[moduleTypes.muTransfer]],
      },
    ],
  },
  {
    category: crossPromoteCategoryGroups.batchEditing,
    subCategory: null,
    productNames: ['Batch Photo Enhance', 'Batch Image Convert'],
    products: [
      {
        moduleType: moduleTypes.enhanceBatch,
        crossPromoteType: crossPromoteTypes[[moduleTypes.enhanceBatch]],
        targetUrl: productUrls[[moduleTypes.enhanceBatch]] + '/batch',
      },
      {
        moduleType: moduleTypes.imageConverterBatch,
        crossPromoteType: crossPromoteTypes[[moduleTypes.imageConverterBatch]],
        targetUrl: productUrls[[moduleTypes.imageConverterBatch]] + '/batch',
      },
    ],
  },
  {
    category: crossPromoteCategoryGroups.aiImage,
    subCategory: null,
    productNames: [
      'AI Image Generator',
      'AI Headshot Generator',
      'AI Avatar Generator',
      'AI Studio Generator',
    ],
    products: [
      {
        moduleType: moduleTypes.txt2Img,
        crossPromoteType: crossPromoteTypes[[moduleTypes.txt2Img]],
        targetUrl: productUrls[[moduleTypes.txt2Img]],
      },
      {
        moduleType: moduleTypes.headshot,
        crossPromoteType: crossPromoteTypes[[moduleTypes.headshot]],
        targetUrl: productUrls[[moduleTypes.headshot]],
      },
      {
        moduleType: moduleTypes.avatar,
        crossPromoteType: crossPromoteTypes[[moduleTypes.avatar]],
        targetUrl: productUrls[[moduleTypes.avatar]],
      },
      {
        moduleType: moduleTypes.avtV3Img,
        crossPromoteType: crossPromoteTypes[[moduleTypes.avtV3Img]],
        targetUrl: productUrls[[moduleTypes.avtV3Img]],
      },
    ],
  },
  {
    category: crossPromoteCategoryGroups.template,
    subCategory: null,
    productNames: ['Image Template', 'Video Template'],
    products: [
      {
        moduleType: moduleTypes.imageTemplate,
        crossPromoteType: crossPromoteTypes[[moduleTypes.imageTemplate]],
        targetUrl: productUrls[[moduleTypes.imageTemplate]],
      },
      {
        moduleType: moduleTypes.videoTemplate,
        crossPromoteType: crossPromoteTypes[[moduleTypes.videoTemplate]],
        targetUrl: productUrls[[moduleTypes.videoTemplate]],
      },
    ],
  },
];

export default sideBarMenuUtils;
export {
  crossPromoteCategoryGroups,
  crossPromoteCategories,
  crossPromoteMenuMapping,
  crossPromoteSubCategories,
  crossPromoteSubCategoryGroups,
};
