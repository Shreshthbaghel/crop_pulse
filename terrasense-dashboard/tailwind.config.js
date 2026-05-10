/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Midnight Moss" Premium Palette
        'brand-green': '#1A2F23',         // Deep Moss (Main Dark)
        'brand-green-light': '#3D5648',   // Medium Moss
        'brand-green-surface': '#F2F5F2', // Very Soft Moss
        'brand-orange': '#B45F43',        // Burned Clay (Accent)
        'brand-orange-light': '#D28E75',  // Soft Clay
        'brand-orange-surface': '#FCF6F4', // Warm Clay Wash
        'brand-bg': '#FBF9F4',            // Organic Bone Background
        'brand-dark': '#1C1C1C',          // Deep Charcoal
        
        'semantic-success': '#5A7D6A',    // Muted Success
        'semantic-warning': '#D29D64',    // Muted Warning
        'semantic-danger': '#A66262',     // Muted Danger
        'semantic-info': '#6A8B9D',       // Muted Info
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 10px 40px -10px rgba(26, 47, 35, 0.05)',
        'card-hover': '0 20px 50px -12px rgba(26, 47, 35, 0.1)',
        'sidebar': '4px 0 24px rgba(0, 0, 0, 0.02)',
        'button': '0 8px 20px rgba(180, 95, 67, 0.15)',
      },
    },
  },
  plugins: [],
}
