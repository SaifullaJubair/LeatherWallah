// lib/getPopularProducts.js

import { BASE_URL } from "../utils/baseURL";

export async function getPopularProducts(category_id) {
  const url = `${BASE_URL}/product/top_selling?category_id=${category_id}`;

  const res = await fetch(url, {
    next: { revalidate: 300 }, // Server-side caching
  });

  if (!res.ok) {
    throw new Error("Error fetching popular products!");
  }

  return res.json();
}

// import { BASE_URL } from "../utils/baseURL";

// export async function getPopularProducts({ category_id }) {
//   const res = await fetch(
//     `${BASE_URL}/product/popular_product?category_id=${category_id}`,
//     {
//       next: {
//         revalidate: 30,
//       },
//     }
//   );

//   if (!res.ok) {
//     throw new Error("popular product fetching error!");
//   }

//   return res.json();
// }
