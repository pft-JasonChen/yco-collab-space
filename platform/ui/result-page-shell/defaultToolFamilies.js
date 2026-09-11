import homeIcon from '../../../design-library/assets/icon/yco-result-page-shell/home.svg';
import agentIcon from '../../../design-library/assets/icon/yco-result-page-shell/ai-agent.svg';

// Split out of ResultPageShell.jsx (2026-09-11): that file exporting both React
// components and this plain data array tripped Vite's react-refresh
// "consistent-components-exports" rule on every edit ("defaultToolFamilies"
// export is incompatible) — Fast Refresh couldn't hot-update the module and
// fell back to a full invalidate, which is why edits appeared to "partially"
// apply. A data-only file has nothing for react-refresh to be inconsistent
// about, so ResultPageShell.jsx now only exports components.
export const defaultToolFamilies = [
  { id: 'home', label: 'Home', image: homeIcon },
  { id: 'ai-agent', label: 'AI Agent', image: agentIcon },
  { id: 'ai-photo-editing', label: 'AI Photo Editing', glyph: '' },
  { id: 'basic-editing', label: 'Basic Editing', glyph: '' },
  { id: 'ai-video', label: 'AI Video', glyph: '' },
  { id: 'ai-image', label: 'AI Image', glyph: '' },
  { id: 'ai-portrait', label: 'AI Portrait', glyph: '' },
  { id: 'batch-editing', label: 'Batch Editing', glyph: '' },
  { id: 'template', label: 'Template', glyph: '' },
];
