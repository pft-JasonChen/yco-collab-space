const config = {
  stories: ['../platform/ui/**/*.stories.@(js|jsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: { name: '@storybook/react-vite', options: {} },
};

export default config;
