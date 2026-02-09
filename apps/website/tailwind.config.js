/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        borderRadius: {
            'none': '0',
            'sm': '0',
            DEFAULT: '0',
            'md': '0',
            'lg': '0',
            'xl': '0',
            '2xl': '0',
            '3xl': '0',
            'full': '0',
        },
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                brand: {
                    red: "#890304",
                    "red-dark": "#4a0002", // Darker shade for gradient edge
                    navy: "#00113A",
                    blue: "#002263",
                    beige: "#E8E5C3",
                    highlight: "#F8F2BF",
                },
            },
            backgroundImage: {
                'radial-red': 'radial-gradient(circle at center, #890304 0%, #2b0001 100%)',
            },
            fontFamily: {
                serif: ['var(--font-playfair)', 'serif'],
                sans: ['var(--font-inter)', 'sans-serif'],
            },
            animation: {
                'spin-slow': 'spin 20s linear infinite',
            }
        },
    },
    plugins: [],
};
