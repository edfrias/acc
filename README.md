# Arquers Club Castelldefels - Official Landing Page

Official website of **Arquers Club Castelldefels**, an **archery** club in Castelldefels, Catalunya, built with Vue.js 3 and optimized for SEO.

## 🏹 About the Club

Arquers Club Castelldefels is a sports club specialized in **archery** located in **Castelldefels, Barcelona**. We offer:

- **Training courses** for beginners
- Practice in **recurve bow** and **compound bow**
- Activities for all ages
- Participation in official competitions
- Over 25 years of experience in archery

## 🌐 SEO Features

- **Full technical SEO**: Optimized meta tags, sitemap.xml, robots.txt
- **Structured Data**: Schema.org markup for SportsClub and LocalBusiness
- **OpenGraph and Twitter Cards**: Optimized for social media
- **Core Web Vitals**: Optimized for speed and performance
- **Mobile-first**: Responsive design and Progressive Web App
- **Accessibility**: WCAG 2.1 AA compliance
- **Keywords targeting**: Optimized for "archery", "bow", "Castelldefels", "Catalunya"

## 🛠️ Technologies Used

- **Vue.js 3** - Progressive framework for user interfaces
- **TypeScript** - Static typing for JavaScript
- **Vite** - Fast and modern build tool
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing

## 📁 Project Structure

```
src/
├── components/
│   ├── NavBar.vue          # Main navigation
│   ├── HeroSection.vue     # Hero section with CTA
│   ├── AboutSection.vue    # Club information
│   ├── ProgramsSection.vue # Programs and courses
│   ├── ContactSection.vue  # Contact form
│   └── FooterSection.vue   # Footer
├── App.vue                 # Root component
├── main.ts                 # Entry point
└── style.css              # Global styles with Tailwind
```

## 🚀 Installation and Usage

### Prerequisites

- Node.js (version 20.19+ or 22.12+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open your browser at `http://localhost:5173`

### Weather Widget

The project includes a weather widget that displays temperature, humidity, weather condition, and UV radiation for Castelldefels. It uses the free **Open-Meteo** API, which requires no additional configuration.

The widget is shown in the header with:
- **Desktop**: Compact indicator with tooltip on hover
- **Mobile**: Modal on click
- **Languages**: Support for Spanish, English, and Catalan

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build
- `npm run deploy` - Build and deploy to Firebase Hosting
- `npm run firebase:login` - Log in to Firebase CLI
- `npm run firebase:init` - Initialize Firebase Hosting (first time only)

## 🚀 Deployment with Firebase Hosting

### Initial Setup

1. **Install Firebase CLI** (if not installed globally):
   ```bash
   npm install -g firebase-tools
   ```

2. **Log in to Firebase**:
   ```bash
   npm run firebase:login
   ```

3. **The project is already configured** with:
   - `firebase.json` - Hosting configuration
   - `.firebaserc` - Project configuration
   - Deploy scripts in `package.json`

### Deploy

To deploy the application to Firebase Hosting:

```bash
npm run deploy
```

This will:
1. Production build (`npm run build`)
2. Deploy to Firebase Hosting (`firebase deploy`)

### Configure Custom Domain

1. Go to the Firebase Hosting console
2. Add your custom domain
3. Follow the instructions to configure DNS
4. Firebase will automatically provision an SSL certificate

## 🎨 Design Features

### Color Palette
- **Primary**: Blue (#2563eb)
- **Accent**: Amber (#f59e0b)
- **Neutral**: Grayscale

### Typography
- **Headings**: Montserrat (font-display)
- **Body**: Inter (font-sans)

## ♿ Accessibility

The project implements the following accessibility features:

- **Keyboard navigation**: All interactive elements are accessible via keyboard
- **ARIA labels**: Descriptive labels for screen readers
- **Color contrast**: Meets WCAG 2.1 AA
- **Semantic HTML**: Logical document structure
- **Visible focus**: Clear focus indicators

## 📱 Landing Page Sections

1. **Hero Section**: Main presentation with call-to-action
2. **About Section**: Club information, statistics, and history
3. **Programs Section**: Training courses and programs
4. **Contact Section**: Registration form and contact information
5. **Footer**: Additional links, social media, and legal information

## 📞 Club Contact Information

- **Location**: Castelldefels, Catalonia
- **Secretary Email**: secretaria@arquerscastelldefels.com
- **Board Email**: junta@arquerscastelldefels.com
- **Instagram**: @arquersclubc

To receive information about the club's activities and archery training courses, you can reach us through the channels listed above.