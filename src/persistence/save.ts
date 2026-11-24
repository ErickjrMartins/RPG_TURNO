import { decodeProfile, isProfile, type Profile } from '../domain/profile'

const databaseName = 'reinos-da-aurora'
const storeName = 'profiles'
const saveKey = 'campaign'
const backupKey = 'last-valid'

export class SaveRepository {
  private constructor(private readonly db: IDBDatabase) {}

  static open(): Promise<SaveRepository> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1)
      request.onupgradeneeded = () => request.result.createObjectStore(storeName)
      request.onerror = () => reject(new Error('O navegador não conseguiu abrir o salvamento local.'))
      request.onblocked = () => reject(new Error('Feche outras abas do jogo para abrir o salvamento.'))
      request.onsuccess = () => resolve(new SaveRepository(request.result))
    })
  }

  close(): void {
    this.db.close()
  }

  load(): Promise<Profile | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const current = store.get(saveKey)
      const backup = store.get(backupKey)
      transaction.oncomplete = () => {
        const available = decodeProfile(current.result) ?? decodeProfile(backup.result)
        if (available) resolve(available)
        else if (current.result === undefined && backup.result === undefined) resolve(null)
        else reject(new Error('O salvamento local está danificado.'))
      }
      transaction.onabort = () => reject(new Error('Não foi possível ler o salvamento.'))
    })
  }

  commit(expectedRevision: string | null, change: (profile: Profile | null) => Profile): Promise<Profile> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const current = store.get(saveKey)
      const backup = store.get(backupKey)
      let saved: Profile | undefined
      let error: unknown
      backup.onsuccess = () => {
        try {
          const previous = decodeProfile(current.result) ?? decodeProfile(backup.result)
          if ((previous?.revision ?? null) !== expectedRevision) {
            throw new Error('O progresso mudou em outra aba. Volte ao título e recarregue o jogo.')
          }
          const next = change(previous)
          saved = { ...next, revision: Array.from(crypto.getRandomValues(new Uint32Array(3))).join('-') }
          if (!isProfile(saved)) throw new Error('O progresso gerado é inválido.')
          if (previous) store.put(previous, backupKey)
          store.put(saved, saveKey)
        } catch (cause) {
          error = cause
          transaction.abort()
        }
      }
      transaction.oncomplete = () => {
        if (saved) resolve(saved)
      }
      transaction.onabort = () => reject(error ?? new Error('Não foi possível salvar o progresso.'))
    })
  }
}
