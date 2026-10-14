import { collection, doc, getDocs, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

/** Colección de Firestore con una plantilla por temporada; el id del documento es la temporada ("2026-27"). */
const COLLECTION = 'plantilles'

export interface OfficialTemplate {
  season: string
  svg: string
  uploadedBy: string
  uploadedAt: Date | null
}

/** Todas las plantillas publicadas, de la temporada más reciente a la más antigua. */
export async function listOfficialTemplates(): Promise<OfficialTemplate[]> {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs
    .map((d) => {
      const data = d.data()
      return {
        season: d.id,
        svg: String(data['svg'] ?? ''),
        uploadedBy: String(data['uploadedBy'] ?? ''),
        uploadedAt: data['uploadedAt'] instanceof Timestamp ? data['uploadedAt'].toDate() : null,
      }
    })
    .sort((a, b) => b.season.localeCompare(a.season))
}

/** Publica (o sustituye) la plantilla de una temporada. Las reglas comprueban la cuenta, la temporada y el tamaño. */
export async function publishOfficialTemplate(season: string, svg: string, email: string): Promise<void> {
  await setDoc(doc(db, COLLECTION, season), { svg, uploadedBy: email, uploadedAt: serverTimestamp() })
}
