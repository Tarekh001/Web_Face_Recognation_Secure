/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        navy: {
          900: '#0F172A',
          950: '#0B1120',
        },
        gov: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#0B1120',
        },
        asn: {
          light: '#EFF6FF',
          border: '#93C5FD',
          text: '#1D4ED8',
        },
        nonasn: {
          light: '#FFFBEB',
          border: '#FCD34D',
          text: '#92400E',
        },
      },
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgba(11, 17, 32, 0.04)',
        'soft-sm': '0 1px 3px 0 rgba(11, 17, 32, 0.06), 0 4px 12px -4px rgba(11, 17, 32, 0.04)',
        'card': '0 1px 3px 0 rgba(11, 17, 32, 0.05), 0 6px 16px -6px rgba(11, 17, 32, 0.05)',
        'btn-primary': '0 1px 2px 0 rgba(11, 17, 32, 0.16), inset 0 1px 0 0 rgba(255, 255, 255, 0.18)',
        'btn-primary-hover': '0 4px 12px -2px rgba(29, 78, 216, 0.28), inset 0 1px 0 0 rgba(255, 255, 255, 0.22)',
        'modal': '0 24px 48px -12px rgba(11, 17, 32, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        'md': '6px',
        'lg': '10px',
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
