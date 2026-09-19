import type { Preview } from '@storybook/react-vite';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'shelf-dark',
      values: [{ name: 'shelf-dark', value: '#100e0c' }],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      //
      // OpenShelf's whole premise is accessibility rigor, so violations fail
      // the Storybook test run instead of being merely logged.
      test: 'error',
    },
  },
};

export default preview;