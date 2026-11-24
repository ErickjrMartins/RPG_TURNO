import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { classIds, className } from '../src/content/classes'
import { isProfile, levelFor, newProfile } from '../src/domain/profile'
import { SaveRepository } from '../src/persistence/save'

beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('reinos-da-aurora')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Banco de teste aberto.'))
  })
})

describe('criação de campanha', () => {
  it.each(classIds)('aceita as duas aparências para %s', (classId) => {
    for (const presentation of ['masculine', 'feminine'] as const) {
      const profile = newProfile('  Aurora  ', classId, presentation)
      expect(isProfile(profile)).toBe(true)
      expect(profile.hero).toMatchObject({ name: 'Aurora', classId, presentation })
      expect(className(classId, presentation)).toBeTruthy()
    }
  })

  it('valida nome, nível e versão', () => {
    expect(() => newProfile(' ', 'mage', 'feminine')).toThrow()
    expect(levelFor(100)).toBe(2)
    expect(isProfile({ ...newProfile('Íris', 'mage', 'feminine'), schemaVersion: 0 })).toBe(false)
  })

  it('persiste ao reabrir e recusa uma revisão desatualizada', async () => {
    const repository = await SaveRepository.open()
    let revision: string
    try {
      expect(await repository.load()).toBeNull()
      const saved = await repository.commit(null, () => newProfile('Íris', 'mage', 'feminine'))
      revision = saved.revision
    } finally {
      repository.close()
    }
    const reopened = await SaveRepository.open()
    try {
      const saved = await reopened.load()
      expect(saved?.hero).toMatchObject({ name: 'Íris', classId: 'mage', presentation: 'feminine' })
      await reopened.commit(revision, (current) => ({ ...current!, gold: 30 }))
      await expect(reopened.commit(revision, () => newProfile('Alda', 'archer', 'feminine'))).rejects.toThrow('outra aba')
      expect((await reopened.load())?.gold).toBe(30)
    } finally {
      reopened.close()
    }
  })
})

it('recupera a última revisão íntegra quando o registro atual é inválido', async () => {
  const repository = await SaveRepository.open()
  try {
    const first = await repository.commit(null, () => newProfile('Nara', 'warrior', 'feminine'))
    await repository.commit(first.revision, (current) => ({ ...current!, gold: 12 }))
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('reinos-da-aurora', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction('profiles', 'readwrite')
        transaction.objectStore('profiles').put({ schemaVersion: 2, invalid: true }, 'campaign')
        transaction.oncomplete = () => resolve()
        transaction.onabort = () => reject(transaction.error)
      })
      expect(await repository.load()).toEqual(first)
    } finally {
      database.close()
    }
  } finally {
    repository.close()
  }
})
