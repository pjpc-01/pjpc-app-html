import type { Config } from "tailwindcss";

// all in fixtures is set to tailwind v3 as interims solutions

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
  		screens: {
  			'xs': '475px',
  			'sm': '640px',
  			'md': '768px',
  			'lg': '1024px',
  			'xl': '1280px',
  			'2xl': '1536px',
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			/* Variable-driven brand colors — change with theme */
  			amber: {
  				'50': 'hsl(var(--brand-50))',
  				'100': 'hsl(var(--brand-100))',
  				'200': 'hsl(var(--brand-200))',
  				'300': 'hsl(var(--brand-300))',
  				'400': 'hsl(var(--brand-400))',
  				'500': 'hsl(var(--brand-500))',
  				'600': 'hsl(var(--brand-600))',
  				'700': 'hsl(var(--brand-700))',
  				'800': 'hsl(var(--brand-800))',
  				'900': 'hsl(var(--brand-900))',
  				'950': 'hsl(var(--brand-950))',
  			},
  			orange: {
  				'50': 'hsl(var(--brand-secondary-50))',
  				'100': 'hsl(var(--brand-secondary-100))',
  				'200': 'hsl(var(--brand-secondary-200))',
  				'300': 'hsl(var(--brand-secondary-300))',
  				'400': 'hsl(var(--brand-secondary-400))',
  				'500': 'hsl(var(--brand-secondary-500))',
  				'600': 'hsl(var(--brand-secondary-600))',
  				'700': 'hsl(var(--brand-secondary-700))',
  				'800': 'hsl(var(--brand-secondary-800))',
  				'900': 'hsl(var(--brand-secondary-900))',
  				'950': 'hsl(var(--brand-secondary-950))',
  			},
  			/* =========================================
  			   OVERRIDE DEFAULT TAILWIND COLOR SCALES
  			   Each theme redefines these via CSS variables
  			   ========================================= */
  			gray: {
  				'50': 'hsl(var(--gray-50))',
  				'100': 'hsl(var(--gray-100))',
  				'200': 'hsl(var(--gray-200))',
  				'300': 'hsl(var(--gray-300))',
  				'400': 'hsl(var(--gray-400))',
  				'500': 'hsl(var(--gray-500))',
  				'600': 'hsl(var(--gray-600))',
  				'700': 'hsl(var(--gray-700))',
  				'800': 'hsl(var(--gray-800))',
  				'900': 'hsl(var(--gray-900))',
  				'950': 'hsl(var(--gray-950))',
  			},
  			slate: {
  				'50': 'hsl(var(--slate-50))',
  				'100': 'hsl(var(--slate-100))',
  				'200': 'hsl(var(--slate-200))',
  				'300': 'hsl(var(--slate-300))',
  				'400': 'hsl(var(--slate-400))',
  				'500': 'hsl(var(--slate-500))',
  				'600': 'hsl(var(--slate-600))',
  				'700': 'hsl(var(--slate-700))',
  				'800': 'hsl(var(--slate-800))',
  				'900': 'hsl(var(--slate-900))',
  				'950': 'hsl(var(--slate-950))',
  			},
  			blue: {
  				'50': 'hsl(var(--blue-50))',
  				'100': 'hsl(var(--blue-100))',
  				'200': 'hsl(var(--blue-200))',
  				'300': 'hsl(var(--blue-300))',
  				'400': 'hsl(var(--blue-400))',
  				'500': 'hsl(var(--blue-500))',
  				'600': 'hsl(var(--blue-600))',
  				'700': 'hsl(var(--blue-700))',
  				'800': 'hsl(var(--blue-800))',
  				'900': 'hsl(var(--blue-900))',
  				'950': 'hsl(var(--blue-950))',
  			},
  			green: {
  				'50': 'hsl(var(--green-50))',
  				'100': 'hsl(var(--green-100))',
  				'200': 'hsl(var(--green-200))',
  				'300': 'hsl(var(--green-300))',
  				'400': 'hsl(var(--green-400))',
  				'500': 'hsl(var(--green-500))',
  				'600': 'hsl(var(--green-600))',
  				'700': 'hsl(var(--green-700))',
  				'800': 'hsl(var(--green-800))',
  				'900': 'hsl(var(--green-900))',
  				'950': 'hsl(var(--green-950))',
  			},
  			red: {
  				'50': 'hsl(var(--red-50))',
  				'100': 'hsl(var(--red-100))',
  				'200': 'hsl(var(--red-200))',
  				'300': 'hsl(var(--red-300))',
  				'400': 'hsl(var(--red-400))',
  				'500': 'hsl(var(--red-500))',
  				'600': 'hsl(var(--red-600))',
  				'700': 'hsl(var(--red-700))',
  				'800': 'hsl(var(--red-800))',
  				'900': 'hsl(var(--red-900))',
  				'950': 'hsl(var(--red-950))',
  			},
  			yellow: {
  				'50': 'hsl(var(--yellow-50))',
  				'100': 'hsl(var(--yellow-100))',
  				'200': 'hsl(var(--yellow-200))',
  				'300': 'hsl(var(--yellow-300))',
  				'400': 'hsl(var(--yellow-400))',
  				'500': 'hsl(var(--yellow-500))',
  				'600': 'hsl(var(--yellow-600))',
  				'700': 'hsl(var(--yellow-700))',
  				'800': 'hsl(var(--yellow-800))',
  				'900': 'hsl(var(--yellow-900))',
  				'950': 'hsl(var(--yellow-950))',
  			},
  			purple: {
  				'50': 'hsl(var(--purple-50))',
  				'100': 'hsl(var(--purple-100))',
  				'200': 'hsl(var(--purple-200))',
  				'300': 'hsl(var(--purple-300))',
  				'400': 'hsl(var(--purple-400))',
  				'500': 'hsl(var(--purple-500))',
  				'600': 'hsl(var(--purple-600))',
  				'700': 'hsl(var(--purple-700))',
  				'800': 'hsl(var(--purple-800))',
  				'900': 'hsl(var(--purple-900))',
  				'950': 'hsl(var(--purple-950))',
  			},
  			indigo: {
  				'50': 'hsl(var(--indigo-50))',
  				'100': 'hsl(var(--indigo-100))',
  				'200': 'hsl(var(--indigo-200))',
  				'300': 'hsl(var(--indigo-300))',
  				'400': 'hsl(var(--indigo-400))',
  				'500': 'hsl(var(--indigo-500))',
  				'600': 'hsl(var(--indigo-600))',
  				'700': 'hsl(var(--indigo-700))',
  				'800': 'hsl(var(--indigo-800))',
  				'900': 'hsl(var(--indigo-900))',
  				'950': 'hsl(var(--indigo-950))',
  			},
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
