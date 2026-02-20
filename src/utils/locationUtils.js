/**
 * Calculates the bearing (heading) between two coordinates in degrees.
 * @param {[number, number]} start - [longitude, latitude]
 * @param {[number, number]} end - [longitude, latitude]
 * @returns {number} Bearing in degrees (0-360)
 */
export function calculateBearing(start, end) {
  if (!start || !end) return 0

  const startLat = (start[1] * Math.PI) / 180
  const startLng = (start[0] * Math.PI) / 180
  const endLat = (end[1] * Math.PI) / 180
  const endLng = (end[0] * Math.PI) / 180

  const y = Math.sin(endLng - startLng) * Math.cos(endLat)
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng)

  let bearing = (Math.atan2(y, x) * 180) / Math.PI
  return (bearing + 360) % 360
}
