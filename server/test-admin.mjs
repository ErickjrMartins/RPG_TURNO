export const testAccessPath = '/api/test-admin/access'

export function testAccessResponse(allowed, method) {
  const status = method === 'GET' ? 200 : 405
  return Response.json({ allowed: status === 200 && allowed }, {
    status,
    headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}

export function createLocalTestAdminMiddleware(enabled) {
  return async (request, response, next) => {
    if (request.url?.split('?')[0] !== testAccessPath) return next()
    const loopback = /^(?:127\.0\.0\.1|localhost)(?::\d{1,5})?$/i.test(request.headers.host ?? '')
      && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress)
    const result = testAccessResponse(enabled && loopback, request.method)
    response.writeHead(result.status, Object.fromEntries(result.headers))
    response.end(await result.text())
  }
}
