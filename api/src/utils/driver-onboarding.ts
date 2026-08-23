export const VEHICLE_TYPES = ["Bike", "Car", "Truck"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const ACTIVE_ORDER_STATUSES = [
  "Accepted",
  "ArrivedPickup",
  "InProgress",
] as const;

export const normalizeVehicleType = (value?: string | null): VehicleType | null => {
  const normalized = VEHICLE_TYPES.find(
    (type) => type.toLowerCase() === String(value || "").trim().toLowerCase()
  );
  return normalized || null;
};

export const buildDriverOnboardingStatus = (driver: any) => {
  const vehicleInfoSubmitted =
    Boolean(normalizeVehicleType(driver?.vehicle?.type)) &&
    Boolean(driver?.vehicle?.plateNumber);
  const documentsUploaded = Boolean(
    driver?.emaratesId && driver?.drivingLicense && driver?.vehicleRegistration
  );
  const adminApproved = driver?.status === "Approved";

  const checks = {
    vehicleInfoSubmitted,
    documentsUploaded,
    adminApproved,
  };

  const missingRequirements = [
    !vehicleInfoSubmitted ? "Vehicle information submitted" : null,
    !documentsUploaded ? "Required documents uploaded" : null,
    !adminApproved ? "Driver account approved by admin" : null,
  ].filter(Boolean) as string[];

  return {
    checks,
    missingRequirements,
    canGoOnline: missingRequirements.length === 0,
  };
};
