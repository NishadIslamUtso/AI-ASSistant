// Time-of-day greeting from the browser's local clock (user is on Asia/Dhaka).
export function getGreeting(date = new Date()) {
  const h = date.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 22) return 'Evening'
  return 'Good night'
}
