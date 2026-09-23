// Genera los CSV de prueba de fixtures/. Datos inventados.
// Se generan por script porque el de Latin-1 tiene que escribirse como bytes:
// un editor lo guardaría en UTF-8 sin avisar.
import { writeFileSync } from 'node:fs'

const fixture = (name) => new URL(`../fixtures/${name}`, import.meta.url)
const crlf = (lines) => lines.join('\r\n') + '\r\n'

// Exportación típica de Excel: UTF-8 con BOM, separador ";", cabeceras en catalán.
// El comentario de cada línea es el número de fila que verá la app.
const socios = [
  'Nom;Llicència', // 1
  'Jordi Martínez Peña;Licencia n.º 124692', // 2  válido, prefijo en castellano
  'Núria Garcia Solé;124693', // 3  válido
  'Laia Col·lell Serra;124694', // 4  válido, l·l
  'Iñaki Muñoz Ibáñez;124695', // 5  válido, ñ
  'Pere Soler i Vilaça;124696', // 6  válido, ç
  '', // 7  vacía: se ignora
  ';', // 8  celdas vacías: se ignora
  'Maria del Carme Puigdomènech i Sabaté;124697', // 9  se reduce al 81 %: sin aviso
  'Maria Montserrat Puigdomènech i Sabaté;124698', // 10 se reduce al 79 %: aviso
  'Maria de la Mercè Puigdomènech-Vilanova i Casademunt de Sabaté;124699', // 11 no cabe
  'Anna Roca Puig;124700', // 12 duplicado
  'Oriol Vidal Mas;124700', // 13 duplicado
  ';124701', // 14 nombre vacío
  'Marc Ferrer Pons;pendent', // 15 número no válido
  'Li 李 Wang;124702', // 16 glifo que Inter no tiene
  'Joan Baptista Rovira Casals;Llicència núm. 124703', // 17 válido, prefijo en catalán
]
writeFileSync(fixture('socios.csv'), '\uFEFF' + crlf(socios), 'utf8')

// Exportación antigua en Latin-1 con separador ",".
const latin1 = [
  'nombre,num_federado',
  'Àlex Pérez Ruiz,124710',
  'Mònica Castañer Puig,124711',
  'Francesc Col·lell Garcia,124712',
  '"Ramon Llull, Jaume",124713',
]
writeFileSync(fixture('socios-latin1.csv'), crlf(latin1), 'latin1')
