import { testAccessPath, testAccessResponse } from './test-admin.mjs'

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname !== testAccessPath) return env.ASSETS.fetch(request)
    const owner = env.AURORA_ADMIN_EMAIL?.trim().toLowerCase()
    const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase()
    const user = request.headers.get('oai-authenticated-user-id')
    return testAccessResponse(!!owner && !!user && email === owner, request.method)
  },
}
