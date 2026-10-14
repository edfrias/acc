import { computed, ref, shallowRef, watch } from 'vue'
import { CsvError, loadFontSet, parseCsv, parseTemplate } from '../pipeline'
import type { ColumnMapping, FontFiles, ParsedCsv, Template, ValidationResult } from '../pipeline'
import { validate } from '../pipeline'
import { guessMapping } from './mapping'
import * as store from './templateLibrary'
import type { HistoryEntry, LibraryTemplate, SeasonAssignment } from './templateLibrary'
import { currentSeason, defaultSeason, seasonLabel } from './season'
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

// Biblioteca de plantillas y plantilla oficial de cada temporada, en Firestore (templateLibrary.ts).
// Se cargan tras iniciar sesión.
const library = shallowRef<LibraryTemplate[]>([])
const assignments = shallowRef<SeasonAssignment[]>([])
const libraryStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
/** Temporada elegida en el paso 1. */
const season = ref<string | null>(null)
/** Temporada y plantilla que se acaban de aprobar, para confirmarlo en la interfaz. */
const justApproved = ref<{ season: string; name: string } | null>(null)

/** De dónde sale la plantilla en uso: la oficial de `season`, una de la biblioteca que se está mirando o un fichero. */
export type TemplateOrigin = { kind: 'season' } | { kind: 'library'; id: string; name: string } | { kind: 'file'; name: string }

const template = shallowRef<Template | null>(null)
/** SVG de la plantilla en uso, para poder publicarla si es una cargada desde fichero. */
const templateSvg = ref('')
const origin = ref<TemplateOrigin | null>(null)
const templateError = ref<string | null>(null)

/** Asignación de la temporada elegida y su plantilla (`undefined` si se eliminó de la biblioteca). */
const assignment = computed(() => assignments.value.find((a) => a.season === season.value))
const assigned = computed(() => library.value.find((t) => t.id === assignment.value?.template))

const csv = shallowRef<ParsedCsv | null>(null)
const csvName = ref('')
const csvError = ref<'empty' | 'unreadable' | null>(null)

const mapping = ref<ColumnMapping>({})
/** Carnet válido que se está previsualizando. */
const selected = ref(0)
const staticValues = ref<Record<string, string>>({ temporada: seasonLabel(currentSeason(new Date())) })

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

function useTemplate(svg: string, from: TemplateOrigin): void {
  // Cualquier cambio de plantilla deja atrás el aviso de la última aprobación
  justApproved.value = null
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
    templateSvg.value = svg
    origin.value = from
    templateError.value = null
    for (const field of parsed.fields.filter((f) => f.isStatic)) {
      staticValues.value[field.name] ??= ''
    }
  } catch (error) {
    templateError.value = error instanceof Error ? error.message : String(error)
  }
}

/** Pasa a la plantilla oficial de `chosen`. Si la temporada no tiene, o su plantilla ya no existe, no cambia nada. */
function useSeason(chosen: string): void {
  season.value = chosen
  const official = library.value.find((t) => t.id === assignments.value.find((a) => a.season === chosen)?.template)
  if (!official) return
  useTemplate(official.svg, { kind: 'season' })
  // La temporada del carnet es la de su plantilla, escrita entera: "2026-2027"
  staticValues.value['temporada'] = seasonLabel(chosen)
}

/** Vuelve a leer la biblioteca. Con `select`, pasa a la plantilla oficial de esa temporada. */
async function loadLibrary(select?: string): Promise<void> {
  libraryStatus.value = 'loading'
  try {
    const loaded = await store.loadLibrary()
    library.value = loaded.templates
    assignments.value = loaded.assignments
    libraryStatus.value = 'ready'
  } catch {
    libraryStatus.value = 'error'
    return
  }
  // Si se está mirando una plantilla de la biblioteca o probando un fichero, no se le cambia
  if (!select && origin.value && origin.value.kind !== 'season') return
  const chosen =
    select ?? defaultSeason(assignments.value.map((a) => a.season), season.value ?? currentSeason(new Date()))
  if (chosen) {
    useSeason(chosen)
  } else {
    // Ninguna temporada tiene plantilla (p. ej. se quitó la última asignación): no hay plantilla oficial que usar
    season.value = null
    template.value = null
    origin.value = null
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
    library,
    assignments,
    libraryStatus,
    season,
    assignment,
    assigned,
    justApproved,
    template,
    origin,
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
      await Promise.all([loadFonts(), loadLibrary()])
    },

    loadLibrary,
    useSeason,

    /** Muestra una plantilla de la biblioteca (para revisarla antes de aprobarla), sin cambiar ninguna temporada. */
    previewTemplate(id: string) {
      const found = library.value.find((t) => t.id === id)
      if (found) useTemplate(found.svg, { kind: 'library', id, name: found.name })
    },

    /** Guarda en la biblioteca la plantilla cargada desde fichero, la aprueba para `target` y pasa a usarla. */
    async publishTemplate(name: string, target: string, email: string) {
      await store.publishTemplate(name, templateSvg.value, target, email)
      origin.value = { kind: 'season' }
      await loadLibrary(target)
      justApproved.value = { season: target, name }
    },

    /** Aprueba para `target` una plantilla de la biblioteca y pasa a usarla. */
    async approveTemplate(id: string, target: string, email: string) {
      const found = library.value.find((t) => t.id === id)
      if (!found) return
      await store.assignTemplate(id, found.name, target, email)
      origin.value = { kind: 'season' }
      await loadLibrary(target)
      justApproved.value = { season: target, name: found.name }
    },

    async renameTemplate(id: string, name: string) {
      justApproved.value = null
      await store.renameTemplate(id, name)
      if (origin.value?.kind === 'library' && origin.value.id === id) origin.value = { ...origin.value, name }
      await loadLibrary()
    },

    /** Elimina una plantilla de la biblioteca. Las asignadas a alguna temporada no se pueden eliminar. */
    async deleteTemplate(id: string) {
      if (store.seasonsOf(id, assignments.value).length > 0) return
      justApproved.value = null
      await store.deleteTemplate(id)
      if (origin.value?.kind === 'library' && origin.value.id === id) origin.value = { kind: 'season' }
      await loadLibrary(season.value ?? undefined)
    },

    /** Deja la temporada sin plantilla oficial; su historial se conserva. */
    async unassignSeason(target: string) {
      justApproved.value = null
      await store.unassignSeason(target)
      await loadLibrary()
    },

    loadHistory: (target: string): Promise<HistoryEntry[]> => store.loadHistory(target),

    async loadTemplateFile(file: File) {
      useTemplate(await file.text(), { kind: 'file', name: file.name })
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
