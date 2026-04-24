import { createProxyMiddleware } from 'http-proxy-middleware'

/**
 * Create a proxy for each service
 * Gateway receives requests and forwards them to the correct service
 */

const proxyOptions = (target: string, pathRewrite?: Record<string, string>) => ({
  target,
  changeOrigin: true,
  pathRewrite,
  onError: (err: Error, req: any, res: any) => {
    console.error('Proxy error:', err.message)
    res.status(502).json({
      success: false,
      error: 'Service temporarily unavailable'
    })
  }
})

// URL Service proxy
export const urlProxy = createProxyMiddleware(
  proxyOptions(
    process.env.URL_SERVICE_URL || 'http://localhost:3001',
    { '^/api/urls': '/urls' }
  )
)

// Redirect Service proxy
export const redirectProxy = createProxyMiddleware(
  proxyOptions(
    process.env.REDIRECT_SERVICE_URL || 'http://localhost:3002',
    { '^/r': '' }
  )
)

// Analytics Service proxy
export const analyticsProxy = createProxyMiddleware(
  proxyOptions(
    process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3003',
    { '^/api/analytics': '/analytics' }
  )
)