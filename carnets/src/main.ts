import { createApp } from 'vue'
// Fuentes de la web del club, incluidas en el bundle: la app no pide nada a servicios externos
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/montserrat/latin-600.css'
import '@fontsource/montserrat/latin-700.css'
import './style.css'
import App from './App.vue'
import i18n, { syncDocument } from './i18n'

createApp(App).use(i18n).mount('#app')
syncDocument()
