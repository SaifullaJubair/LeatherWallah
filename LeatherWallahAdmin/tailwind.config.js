/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blueColor: {
          100: '#cce6ff',
          200: '#99cdff',
          300: '#66b4ff',
          400: '#339bff',
          500: '#0082ff',
          600: '#0068cc',
          700: '#004e99',
          750: '#11406ffd',
          800: '#003466',
          900: '#001a33',
        },
        successColor: '#236e4c',
        primaryColor: '#339bff',
        yellowColor: '#FEB60D',
        purpleColor: '#9771FF',
        btnInactiveColor: ' #F86624',
        btnActiveColor: '#1A9882',
        bgBtnInactive: '#FFF0EA',
        bgBtnActive: '#E9FAF7',
        bgDelete: 'red',
        bgMiniSidebarColor: '#D0E7FD',
        miniSidebarColor: '#F2F8FD',
        miniSidebarTextColor: '#0F3A62',
        tableRowBGColor: '#fffdf0',
        textColor: '#222222',
        primary: {
          DEFAULT: '#000F24',
          light: '#eaf1ff',
          'dark-light': 'rgba(67,97,238,.15)',
        },
        secondary: {
          DEFAULT: '#00ac9b',
          light: '#ebe4f7',
          'dark-light': 'rgb(128 93 202 / 15%)',
        },
      },
    },
  },
  plugins: [require('tailwind-scrollbar'), require('tailwindcss-motion')],
}
