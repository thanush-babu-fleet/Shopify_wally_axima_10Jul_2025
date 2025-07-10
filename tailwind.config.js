/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../**/*.liquid",
    "./assets/*.js",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: /grid-cols-(\d+)/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
    {
      pattern: /col-span-(\d+)/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    }
  ],
  theme: {
    extend: {
      borderRadius: {
        '4xl': '40px'
      },
      width: {
        '92': '340px'
      },
    },
  },
  plugins: [],
}