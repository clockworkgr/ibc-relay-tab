/** @type {import('tailwindcss').Config} */
export const content = ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'];
export const darkMode = 'media';
export const theme = {
  extend: {
    colors: {
      INFO: 'white',
      WARN: 'yellow',
      ERROR: 'red',
      VERBOSE: 'magenta',
      DEBUG: 'cyan'
    },
    padding: {
      '1/3': '33%',
      full: '100%'
    },
    width: {
      '1/3': '33%'
    }
  }
};
export const safelist = ['text-INFO', 'text-WARN', 'text-ERROR', 'text-VERBOSE', 'text-DEBUG'];
export const variants = {
  extend: {}
};
export const plugins = [];