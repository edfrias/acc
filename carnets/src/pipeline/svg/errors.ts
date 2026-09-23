/** La plantilla no cumple el contrato o usa algo de SVG que el render no soporta. */
export class TemplateError extends Error {
  name = 'TemplateError'
}
