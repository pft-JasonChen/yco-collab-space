import '../platform/tokens/rd/yce-frontend-1.34.1/variables.css';
import '../platform/tokens/rd/yce-frontend-1.34.1/variables-custom.css';
import '../app/src/styles/global.scss';

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
  },
};

export default preview;
