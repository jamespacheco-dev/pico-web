const BASE = import.meta.env.VITE_API_URL ?? ''

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

export const createGame = (opts) => request('POST', '/games', opts)
export const getGame = (id) => request('GET', `/games/${id}`)
export const createGuess = (id, body) => request('POST', `/games/${id}/guesses`, body)
export const rollback = (id, toGuess) =>
  request('POST', `/games/${id}/rollback`, { to_guess: toGuess })
