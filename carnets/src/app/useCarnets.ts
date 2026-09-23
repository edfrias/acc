import { computed, ref, shallowRef, watch } from 'vue'
import { CsvError, loadFontSet, parseCsv, parseTemplate } from '../pipeline'
import type { ColumnMapping, FontFiles, ParsedCsv, Template, ValidationResult } from '../pipeline'
import { validate } from '../pipeline'
import { guessMapping } from './mapping'
import { currentSeason } from './season'
import officialTemplateSvg from '../../templates/plantilla-carnet-cr80.svg?raw'
import interMedium from '../../fonts/Inter-Medium.ttf?url'
import interSemiBold from '../../fonts/Inter-SemiBold.ttf?url'
import interBold from '../../fonts/Inter-Bold.ttf?url'
import interExtraBold from '../../fonts/Inter-ExtraBold.ttf?url'

const FONT_URLS: Record<number, string> = {
  500: interMedium,
  600: interSemiBold,
  700: interBold,
  800: interExtraBold,
}

// Estado único de la app. Vive solo en memoria: al cerrar la pestaña desaparece (CLAUDE.md § Principios).
// shallowRef: la plantilla compilada y los datos del CSV no necesitan reactividad profunda.
const fontFiles = shallowRef<FontFiles | null>(null)
const fonts = computed(() => (fontFiles.value ? loadFontSet(fontFiles.value) : null))

const template = shallowRef<Template | null>(null)
/** `null` es la plantilla oficial; si no, el nombre del fichero cargado. */
const templateName = ref<string | null>(null)
const templateError = ref<string | null>(null)

const csv = shallowRef<ParsedCsv | null>(null)
const csvName = ref('')
const csvError = ref<'empty' | 'unreadable' | null>(null)

const mapping = ref<ColumnMapping>({})
/** Carnet válido que se está previsualizando. */
const selected = ref(0)
const staticValues = ref<Record<string, string>>({ temporada: currentSeason(new Date()) })

const csvFields = computed(() => template.value?.fields.filter((f) => !f.isStatic) ?? [])
const staticFields = computed(() => template.value?.fields.filter((f) => f.isStatic) ?? [])
const mappingComplete = computed(() => csvFields.value.every((f) => Boolean(mapping.value[f.name])))

const result = computed<ValidationResult | null>(() => {
  if (!template.value || !csv.value || !fonts.value || !mappingComplete.value) return null
  return validate(csv.value.rows, template.value, { mapping: mapping.value, staticValues: staticValues.value }, fonts.value)
})

// Al cambiar de plantilla o de CSV se vuelve a proponer la asignación de columnas.
watch([template, csv], ([t, c]) => {
  mapping.value = t && c ? guessMapping(t.fields, c.headers) : {}
})

// Si cambia la lista de válidos, la selección no puede quedarse fuera de rango.
watch(result, (r) => {
  if (!r || selected.value >= r.valid.length) selected.value = 0
})

function useTemplate(svg: string, name: string | null): void {
  try {
    const parsed = parseTemplate(svg)
    const missing = parsed.fontWeights.filter((weight) => !(weight in FONT_URLS))
    if (missing.length > 0) {
      throw new Error(
        `La plantilla usa pesos de Inter que la app no tiene (${missing.join(', ')}). ` +
          `Disponibles: ${Object.keys(FONT_URLS).join(', ')}.`,
      )
    }
    template.value = parsed
    templateName.value = name
    templateError.value = null
    for (const field of parsed.fields.filter((f) => f.isStatic)) {
      staticValues.value[field.name] ??= ''
    }
  } catch (error) {
    templateError.value = error instanceof Error ? error.message : String(error)
  }
}

async function loadFonts(): Promise<void> {
  const entries = await Promise.all(
    Object.entries(FONT_URLS).map(async ([weight, url]) => {
      const response = await fetch(url)
      return [Number(weight), new Uint8Array(await response.arrayBuffer())] as const
    }),
  )
  fontFiles.value = Object.fromEntries(entries)
}

export function useCarnets() {
  return {
    fontFiles,
    fonts,
    template,
    templateName,
    templateError,
    csv,
    csvName,
    csvError,
    mapping,
    selected,
    staticValues,
    csvFields,
    staticFields,
    mappingComplete,
    result,

    async init() {
      useTemplate(officialTemplateSvg, null)
      await loadFonts()
    },

    useOfficialTemplate() {
      useTemplate(officialTemplateSvg, null)
    },

    async loadTemplateFile(file: File) {
      useTemplate(await file.text(), file.name)
    },

    async loadCsvFile(file: File) {
      try {
        csv.value = await parseCsv(file)
        csvName.value = file.name
        csvError.value = null
      } catch (error) {
        csv.value = null
        csvError.value = error instanceof CsvError ? 'empty' : 'unreadable'
      }
    },
  }
}
