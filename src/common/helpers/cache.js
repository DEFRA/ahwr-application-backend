export function initCache(server, segment, generateFunc, options = {}) {
  return server.cache({
    cache: 'ahwr-application-backend',
    segment,
    generateTimeout: 2000,
    generateFunc,
    ...options
  })
}
