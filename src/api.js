const BASE = import.meta.env.VITE_API_URL ?? ''

async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (networkErr) {
    console.error(`[api] network error ${method} ${BASE}${path}:`, networkErr)
    throw new Error(`Cannot reach the server. Is it running at ${BASE || 'same origin'}?`)
  }

  let data
  try {
    data = await res.json()
  } catch {
    console.error(`[api] non-JSON response ${res.status} ${method} ${BASE}${path}`)
    throw new Error(`Unexpected response from server (HTTP ${res.status})`)
  }

  if (!res.ok) {
    console.error(`[api] error response ${res.status} ${method} ${BASE}${path}:`, data)
    throw { status: res.status, ...data }
  }
  return data
}

export const createGame = (opts) => request('POST', '/games', opts)
export const getGame = (id) => request('GET', `/games/${id}`)
export const createGuess = (id, body) => request('POST', `/games/${id}/guesses`, body)
export const rollback = (id, toGuess) =>
  request('POST', `/games/${id}/rollback`, { to_guess: toGuess })
