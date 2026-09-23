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

// Lista de ejemplo para probar la app en local: 30 socios inventados, con el formato de la exportación
// de la federación. Todos válidos salvo dos nombres largos que se reducen (uno con aviso).
const ejemplo = [
  'Nom;Llicència',
  'Marta Casals Ribas;Licencia n.º 125001',
  'Jordi Puig Ferrer;Licencia n.º 125002',
  'Laia Font Serra;Licencia n.º 125003',
  'Pau Vidal Roca;Licencia n.º 125004',
  'Núria Soler Camps;Licencia n.º 125005',
  'Àlex Martí Bosch;Licencia n.º 125006',
  'Carla Pons Vila;Licencia n.º 125007',
  'Marc Riera Coll;Licencia n.º 125008',
  'Aina Batlle Prat;Licencia n.º 125009',
  'Oriol Mas Sala;Licencia n.º 125010',
  'Berta Col·lell Garriga;Licencia n.º 125011',
  'Sergi Castañer Llop;Licencia n.º 125012',
  'Judit Rovira Güell;Licencia n.º 125013',
  'Pere Vilaça Torrent;Licencia n.º 125014',
  'Clara Ibáñez Moreno;Licencia n.º 125015',
  'David Muñoz Ortega;Licencia n.º 125016',
  'Irene Sánchez Gil;Licencia n.º 125017',
  'Xavier Planas Oliver;Licencia n.º 125018',
  'Mireia Esteve Grau;Licencia n.º 125019',
  'Arnau Bonet Fuster;Licencia n.º 125020',
  'Elena Navarro Ruiz;Licencia n.º 125021',
  'Guillem Sabaté Querol;Licencia n.º 125022',
  'Rosa Maria Cardona Pujol;Licencia n.º 125023',
  'Joan Carles Domènech Arnau;Licencia n.º 125024',
  'Maria del Carme Puigdomènech i Sabaté;Licencia n.º 125025',
  'Maria Montserrat Vallverdú i Casademunt;Licencia n.º 125026',
  'Ferran Giménez Blasco;Licencia n.º 125027',
  'Anna Ventura Mestres;Licencia n.º 125028',
  'Roger Almirall Serrat;Licencia n.º 125029',
  'Queralt Ferrando Pi;Licencia n.º 125030',
]
writeFileSync(fixture('socios-ejemplo.csv'), String.fromCharCode(0xfeff) + crlf(ejemplo), 'utf8')
