import assetMap from './rd-assets.js';
const categoryNameUtils = {
  getCategoryNameMappingKey: (categoryName) => {
    switch (categoryName) {
      case 'AI Editing':
        return 'strapi.section.grid.module.category.name.ai.editing';
      case 'Generative AI':
        return 'header.items.product.group.ai.generator';
      case 'Face AI':
        return 'header.items.product.group.face.ai';
      case 'Video Editing':
        return 'post.featured.topic.CT_VIDEO_EDITING';
      case 'General Tools':
      case 'Basic Editing':
        return 'side.bar.menu.category.basic.editing';
      case 'Crop':
        return 'header.items.product.crop.photo';
      case 'Flip & Rotate':
        return 'header.items.product.flip.and.rotate.image';
      case 'Resize':
        return 'header.items.product.resize.image';
      case 'AI Editing & Enhance':
        return 'header.items.product.group.ai.editing.and.enhance';
      case 'AI Photo Editing':
        return 'header.items.product.group.ai.photo.editing';
      case 'AI Portrait':
        return 'header.items.product.group.ai.portrait';
      case 'AI Video Editing':
      case 'AI Video':
        return 'header.items.product.group.ai.video.editing';
      case 'Batch Editing':
        return 'header.items.product.group.batch.editing';
      case 'Recent Used Features':
        return 'header.items.product.group.recent.used.features';
      case 'Home':
        return 'header.items.product.group.home';
      case 'My Gallery':
        return 'my.account.tabs.gallery';
      case 'Contest':
        return 'header.items.product.contest';
      case 'AI Image':
        return 'side.bar.menu.category.ai.image';
      case 'AI Agent':
        return 'header.items.product.ai.agent';
      case 'Video Template':
        return 'header.items.product.video.template';
      case 'Image Template':
        return 'header.items.product.image.template';
      case 'API':
        return 'header.items.product.ai.api';
      default:
        return '';
    }
  },
  getCategoryNameMappingIcon: (categoryName) => {
    switch (categoryName) {
      case 'AI Photo Editing':
        return assetMap["/assets/images/header/icon_ai-photo-editing.svg"];
      case 'AI Portrait':
        return assetMap["/assets/images/header/icon_ai-portrait.svg"];
      case 'AI Video Editing':
      case 'AI Video':
        return assetMap["/assets/images/header/icon_ai-video-editing.svg"];
      case 'Batch Editing':
        return assetMap["/assets/images/header/icon_batch-editing.svg"];
      case 'AI Agent':
        return assetMap["/assets/images/aiAgent/icon_agent.svg"];
      case 'Video Template':
        return assetMap["/assets/images/header/icon_ai-video-editing.svg"];
      case 'Image Template':
        return assetMap["/assets/images/header/icon_ai-photo-editing.svg"];
      default:
        return assetMap["/assets/images/header/icon_ai-photo-editing.svg"];
    }
  },
  getCategoryNameMappingIconFont: (categoryName) => {
    switch (categoryName) {
      case 'AI Photo Editing':
        return 'ic-photo-editing';
      case 'AI Portrait':
        return 'ic-user-sparkle';
      case 'AI Video Editing':
      case 'AI Video':
        return 'ic-ai-video';
      case 'Batch Editing':
        return 'ic-layers';
      case 'General Tools':
      case 'Basic Editing':
        return 'ic-filter';
      case 'Gallery':
        return 'ic-image';
      case 'AI Image':
        return 'ic-ai-image';
      case 'AI Agent':
        return 'ic-ai-agent';
      case 'Video Template':
        return 'ic-ai-video';
      case 'Image Template':
        return 'ic-ai-image';
      default:
        return 'ic-photo-editing';
    }
  },
};

export default categoryNameUtils;
