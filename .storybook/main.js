const config = {
  stories: ['../platform/ui/**/*.stories.@(js|jsx)', '../app/src/surfaces/*.stories.jsx'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', 'storybook-addon-pseudo-states'],
  framework: { name: '@storybook/react-vite', options: {} },
  async viteFinal(config) {
    const { default: surfaceIndexPlugin } = await import('../tools/design-library/surface-vite-plugin.mjs');
    return { ...config, plugins: [...(config.plugins ?? []), surfaceIndexPlugin()] };
  },
};

export default config;
