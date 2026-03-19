# Arquers Club Castelldefels - Landing Page Oficial

Sitio web oficial del **Arquers Club Castelldefels**, club de **tiro con arco** en Castelldefels, Catalunya, construido con Vue.js 3 y optimizado para SEO.

## 🏹 Sobre el Club

El Arquers Club Castelldefels es un club deportivo especializado en **tiro con arco** ubicado en **Castelldefels, Barcelona**. Ofrecemos:

- **Cursos de formación** para principiantes
- Entrenamientos en **arco recurvo** y **arco compuesto**
- Actividades para todas las edades
- Participación en competiciones oficiales
- Más de 25 años de experiencia en arquería

## 🌐 Características SEO

- **SEO técnico completo**: Meta tags optimizados, sitemap.xml, robots.txt
- **Structured Data**: Schema.org markup para SportsClub y LocalBusiness
- **OpenGraph y Twitter Cards**: Optimizado para redes sociales
- **Core Web Vitals**: Optimizado para velocidad y rendimiento
- **Mobile-first**: Diseño responsivo y Progressive Web App
- **Accesibilidad**: WCAG 2.1 AA compliance
- **Keywords targeting**: Optimizado para "tiro con arco", "arquería", "Castelldefels", "Catalunya"

## 🛠️ Tecnologías Utilizadas

- **Vue.js 3** - Framework progressive para interfaces de usuario
- **TypeScript** - Tipado estático para JavaScript
- **Vite** - Build tool rápido y moderno
- **Tailwind CSS** - Framework de utilidades CSS
- **PostCSS** - Procesamiento de CSS

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── NavBar.vue          # Navegación principal
│   ├── HeroSection.vue     # Sección hero con CTA
│   ├── AboutSection.vue    # Información del club
│   ├── ProgramsSection.vue # Programas y cursos
│   ├── ContactSection.vue  # Formulario de contacto
│   └── FooterSection.vue   # Pie de página
├── App.vue                 # Componente principal
├── main.ts                 # Punto de entrada
└── style.css              # Estilos globales con Tailwind
```

## 🚀 Instalación y Uso

### Prerrequisitos

- Node.js (versión 20.19+ o 22.12+)
- npm o yarn

### Instalación

1. Clona el repositorio
2. Instala las dependencias: `npm install`
3. Inicia el servidor de desarrollo: `npm run dev`
4. Abre tu navegador en `http://localhost:5173`

### Widget de clima

El proyecto incluye un widget meteorológico que muestra temperatura, humedad, estado del clima y radiación UV para Castelldefels. Utiliza la API gratuita de **Open-Meteo** que no requiere configuración adicional.

El widget se muestra en el header con:
- **Desktop**: Indicador compacto con tooltip al pasar el mouse
- **Mobile**: Modal al hacer clic en el indicador
- **Idiomas**: Soporte para español, inglés y catalán

### Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run deploy` - Construye y despliega a Firebase Hosting
- `npm run firebase:login` - Inicia sesión en Firebase CLI
- `npm run firebase:init` - Inicializa Firebase Hosting (solo primera vez)

## 🚀 Despliegue con Firebase Hosting

### Configuración Inicial

1. **Instalar Firebase CLI** (si no está instalado globalmente):
   ```bash
   npm install -g firebase-tools
   ```

2. **Iniciar sesión en Firebase**:
   ```bash
   npm run firebase:login
   ```

3. **El proyecto ya está configurado** con:
   - `firebase.json` - Configuración de hosting
   - `.firebaserc` - Configuración del proyecto
   - Scripts de deploy en `package.json`

### Desplegar

Para desplegar la aplicación a Firebase Hosting:

```bash
npm run deploy
```

Esto hará:
1. Build de producción (`npm run build`)
2. Deploy a Firebase Hosting (`firebase deploy`)

### Configurar Dominio Personalizado

1. Ve a la consola de Firebase Hosting
2. Añade tu dominio personalizado
3. Sigue las instrucciones para configurar los DNS
4. Firebase automáticamente proveerá certificado SSL

## 🎨 Características de Diseño

### Paleta de Colores
- **Primary**: Azul (#2563eb)
- **Accent**: Ámbar (#f59e0b)
- **Neutral**: Escala de grises

### Tipografía
- **Títulos**: Montserrat (font-display)
- **Cuerpo**: Inter (font-sans)

## ♿ Accesibilidad

El proyecto implementa las siguientes características de accesibilidad:

- **Navegación por teclado**: Todos los elementos interactivos son accesibles via teclado
- **ARIA labels**: Etiquetas descriptivas para lectores de pantalla
- **Contraste de colores**: Cumple con WCAG 2.1 AA
- **HTML semántico**: Estructura lógica del documento
- **Focus visible**: Indicadores claros de foco

## 📱 Secciones de la Landing Page

1. **Hero Section**: Presentación principal con call-to-action
2. **About Section**: Información sobre el club, estadísticas e historia
3. **Programs Section**: Cursos y programas de entrenamiento
4. **Contact Section**: Formulario de inscripción e información de contacto
5. **Footer**: Enlaces adicionales, redes sociales e información legal

## 📞 Información de Contacto del Club

- **Ubicación**: Castelldefels, Cataluña
- **Email Secretaría**: secretaria@arquerscastelldefels.com
- **Email Junta**: junta@arquerscastelldefels.com
- **Instagram**: @arquersclubc

Para recibir información sobre las actividades que realizamos en el club, y los cursos de formación en tiro con arco, puedes comunicarte con nosotros a través de los medios mencionados arriba.