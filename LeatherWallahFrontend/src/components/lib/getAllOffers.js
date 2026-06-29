import { BASE_URL } from '../utils/baseURL'

export async function getAllOffers() {
  const res = await fetch(`${BASE_URL}/offer`, {
    next: {
      revalidate: 100,
    },
  })

  if (!res.ok) {
    throw new Error('feature campaign fetching error!')
  }

  return res.json()
}
