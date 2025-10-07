export const createMessage = (body, type, options) => {
  return {
    body,
    type,
    source: 'ahwr-application-backend',
    ...options
  }
}
