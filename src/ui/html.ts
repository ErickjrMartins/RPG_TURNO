export function safe(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character
  })
}

export const sigil = '<span class="sigil" aria-hidden="true"><i></i></span>'

export function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Não foi possível concluir a ação.'
}
