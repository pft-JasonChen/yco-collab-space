import { GenerateActionBar } from '../credit-controls/index.js';
import ToolPageLayout from './ToolPageLayout.jsx';

const meta = { title: 'UI/Tool Page Layout', component: ToolPageLayout, tags: ['autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
export const VideoTool = {
  args: {
    panel: <div><h2>Video</h2><p>Tool settings</p></div>,
    footer: <GenerateActionBar />,
    result: <div style={{ display: 'grid', height: '100%', placeItems: 'center' }}>Result surface</div>,
  },
};
