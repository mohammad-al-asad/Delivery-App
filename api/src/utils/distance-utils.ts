export const EARTH_RADIUS_METERS = 6371000;

export const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const calculateDistanceMeters = (
  from?: { latitude?: number; longitude?: number } | null,
  to?: { latitude?: number; longitude?: number } | null
) => {
  if (
    typeof from?.latitude !== "number" ||
    typeof from?.longitude !== "number" ||
    typeof to?.latitude !== "number" ||
    typeof to?.longitude !== "number"
  ) {
    return null;
  }

  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
