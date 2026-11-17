// Genera los ficheros de prueba de fixtures/ (CSV y un Excel). Datos inventados.
// Se generan por script porque el de Latin-1 tiene que escribirse como bytes:
// un editor lo guardaría en UTF-8 sin avisar.
import { writeFileSync } from 'node:fs'
import { crc32, deflateRawSync } from 'node:zlib'

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

// Excel (.xlsx) con el nombre en dos columnas (nombre y apellidos) y la licencia como número, como lo exportan
// algunas webs de la federación. Para los tests del lector de Excel y para probar en local las dos columnas.
// La fila 4 se deja vacía y un nombre va como texto en línea (inlineStr) en lugar de compartido: Excel usa los dos.
const ejemploXlsx = [
  ['Llicència', 'Nom', 'Cognoms'],
  [125101, 'Marta', 'Casals Ribas'],
  [125102, 'Núria', 'Soler Camps'],
  null,
  [125103, 'Berta', 'Col·lell Garriga'],
  [125104, 'Iñaki', 'Muñoz Ibáñez', 'inline'],
  [125105, 'Maria del Carme', 'Puigdomènech i Sabaté'],
]
writeFileSync(fixture('socios-nom-cognoms.xlsx'), xlsx(ejemploXlsx))

function xlsx(rows) {
  const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const strings = []
  const shared = (s) => (strings.includes(s) ? strings.indexOf(s) : strings.push(s) - 1)
  const col = (i) => String.fromCharCode(65 + i)
  const sheetRows = rows
    .map((row, r) => {
      if (!row) return ''
      const [license, ...texts] = row
      const inline = texts[2] === 'inline'
      const cells = [r === 0 ? `<c r="A1" t="s"><v>${shared(license)}</v></c>` : `<c r="A${r + 1}"><v>${license}</v></c>`]
      texts.slice(0, 2).forEach((text, i) => {
        const ref = `${col(i + 1)}${r + 1}`
        cells.push(inline ? `<c r="${ref}" t="inlineStr"><is><t>${esc(text)}</t></is></c>` : `<c r="${ref}" t="s"><v>${shared(text)}</v></c>`)
      })
      return `<row r="${r + 1}">${cells.join('')}</row>`
    })
    .join('')
  const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
  const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
  const files = {
    '[Content_Types].xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>',
    '_rels/.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      `<Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook ${ns} xmlns:r="${rel}"><sheets><sheet name="Socis" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      `<Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/>` +
      `<Relationship Id="rId2" Type="${rel}/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet ${ns}><sheetData>${sheetRows}</sheetData></worksheet>`,
  }
  files['xl/sharedStrings.xml'] =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst ${ns} count="${strings.length}" uniqueCount="${strings.length}">` +
    strings.map((s) => `<si><t>${esc(s)}</t></si>`).join('') +
    '</sst>'
  return zip(files)
}

/** Zip mínimo con deflate (lo que usa Excel). */
function zip(files) {
  const locals = []
  const centrals = []
  let offset = 0
  for (const [name, content] of Object.entries(files)) {
    const data = Buffer.from(content, 'utf8')
    const packed = deflateRawSync(data)
    const nameBytes = Buffer.from(name, 'utf8')
    const crc = crc32(data)
    const header = (sig, size) => {
      const b = Buffer.alloc(size)
      b.writeUInt32LE(sig, 0)
      return b
    }
    const local = header(0x04034b50, 30)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6) // nombres en UTF-8
    local.writeUInt16LE(8, 8)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(packed.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    const central = header(0x02014b50, 46)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(8, 10)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(packed.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(nameBytes.length, 28)
    central.writeUInt32LE(offset, 42)
    locals.push(local, nameBytes, packed)
    centrals.push(central, nameBytes)
    offset += 30 + nameBytes.length + packed.length
  }
  const dir = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(Object.keys(files).length, 8)
  end.writeUInt16LE(Object.keys(files).length, 10)
  end.writeUInt32LE(dir.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, dir, end])
}
