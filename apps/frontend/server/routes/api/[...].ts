import { defineEventHandler, sendRedirect, getRequestHeaders, readRawBody } from 'h3'

export default defineEventHandler(async (event) => {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:4000'
  const targetUrl = `${backendUrl}${event.path}`

  const headers = getRequestHeaders(event)
  delete headers.host

  const isGetOrHead = ['GET', 'HEAD'].includes(event.method)
  const body = isGetOrHead ? undefined : await readRawBody(event)

  try {
    const res = await fetch(targetUrl, {
      method: event.method,
      headers: headers as Record<string, string>,
      body,
      redirect: 'manual'
    })

    // If backend returns a 3xx redirect (e.g. 302 to Discord OAuth or callback redirect)
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      const location = res.headers.get('location')!
      
      const setCookie = res.headers.get('set-cookie')
      if (setCookie) {
        event.node.res.setHeader('set-cookie', setCookie)
      }

      return sendRedirect(event, location, res.status)
    }

    // Forward response headers
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
        event.node.res.setHeader(key, value)
      }
    })

    event.node.res.statusCode = res.status
    const data = await res.arrayBuffer()
    return Buffer.from(data)
  } catch (err: any) {
    console.error('[API Proxy Error]', err)
    event.node.res.statusCode = 502
    return { error: 'Bad Gateway', message: err.message }
  }
})
