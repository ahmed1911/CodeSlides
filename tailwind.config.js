/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './templates/**/*.html',
    './templates/**/*.js',
    './templates/**/*.ts',
    './templates/dist/*.js',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0f1115',
        sidebar: '#0f1115',
        border: '#30363d',
        active: '#21262d',
        accent: '#58a6ff',
        'text-primary': '#c9d1d9',
        'text-secondary': '#8b949e',
        'icon-folder': '#58a6ff',
        'icon-js': '#f1e05a',
        'icon-ts': '#3178c6',
        'icon-react': '#61dafb',
        'icon-json': '#f1e05a',
        'icon-html': '#e34c26',
        'icon-css': '#563d7c',
        'icon-md': '#083fa1',
        'icon-image': '#b07219',
      },
    },
  },
  plugins: [],
};
