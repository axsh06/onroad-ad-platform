// Coordinates measured on the supplied, unmodified BMW M5 F90 mesh.
// +X is the left side of the car, +Y is up, and +Z points forward.
export const BMW_M5_MODEL = "/models/2018-bmw-m5-f90.glb";

export const BMW_M5_PLACEMENTS = [
  "LEFT_DOOR",
  "RIGHT_DOOR",
  "HOOD",
  "REAR_WINDOW",
] as const;

export const BMW_M5_HOTSPOTS = {
  LEFT_DOOR: {
    position: "0.91735m 0.7m 0.25m",
    normal: "0.9928 0.10473 0.00983",
  },
  RIGHT_DOOR: {
    position: "-0.91735m 0.7m 0.25m",
    normal: "-0.9928 0.10481 0.00987",
  },
  HOOD: {
    position: "0m 0.92781m 1.65m",
    normal: "0 0.99062 0.13649",
  },
  REAR_WINDOW: {
    position: "0m 1.26346m -1.55m",
    normal: "0 0.92522 -0.3792",
  },
  // Existing vehicle listings retain their separately priced rear body slot.
  REAR_BODY: {
    position: "0m 0.72m -2.36044m",
    normal: "0 0.2939 -0.95582",
  },
};

export const BMW_M5_VIEWS: Record<string, string> = {
  LEFT_DOOR: "65deg 72deg 78%",
  RIGHT_DOOR: "-65deg 72deg 78%",
  HOOD: "0deg 38deg 90%",
  REAR_WINDOW: "180deg 52deg 90%",
  REAR_BODY: "155deg 72deg 90%",
};
