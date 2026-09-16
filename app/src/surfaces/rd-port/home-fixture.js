import rows from './home-cms-rows.json';
import media from './cms-assets.js';
// Public rendered CMS fields captured from /home, 2026-09-15.
// The shape is RD's CMS shape; private account/history data is never captured.
const asset = name => name ? { data: { attributes: { url: media[name] } } } : null;
export const sections = rows.map(([categoryName, cards], i) => ({
  id: String(2087 + i), categoryName,
  gridModule: cards.map(([title, link, image, icon, video, tabs], j) => ({
    id: `${i}-${j}`, title, alt: title, link, tabs: tabs === 'hot' ? 'Tab: Hot' : tabs === 'new' ? 'Tab: New' : '',
    image: asset(image), imageMobile: asset(image), icon: asset(icon),
    video: asset(video), videoMobile: asset(video),
  })),
}));
const find = name => sections.flatMap(s => s.gridModule).find(c => c.title === name);
export const homepageLayoutConfig = { sections: [{ panels: [
  { panel_id: 'photo', name: 'AI Photo', items: ['Photo Enhancer','AI Image Generator','AI Hairstyle Generator','Photo Repair'].map(name => ({ tool_id: name, link: find(name).link })) },
  { panel_id: 'video', name: 'AI Video', items: ['Image to Video','Video Enhancer','Video Object Removal','AI Video Editor'].map(name => ({ tool_id: name, link: find(name).link })) },
] }], translations: [] };
export const tabHot = asset('yce_web_index_grid_modules_icon_hot_02_2e43524a4f.png');
export const tabNew = asset('yce_web_index_grid_modules_icon_new_02_c724cb0de9.png');
