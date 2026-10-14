export const PLACEMENT_TYPES = [
  "LEFT_DOOR",
  "RIGHT_DOOR",
  "HOOD",
  "REAR_BODY",
] as const;
export const SLOT_NAMES: Record<string, [string, string, string]> = {
  LEFT_DOOR: ["Левая дверь", "Сол жақ есік", "Left door"],
  RIGHT_DOOR: ["Правая дверь", "Оң жақ есік", "Right door"],
  HOOD: ["Капот", "Капот", "Hood"],
  REAR_WINDOW: ["Заднее стекло", "Артқы әйнек", "Rear window"],
  REAR_BODY: [
    "Задняя часть кузова",
    "Кузовтың артқы бөлігі",
    "Rear body panel",
  ],
  FRONT_DOORS: ["Передние двери", "Алдыңғы есіктер", "Front doors"],
  REAR_DOORS: ["Задние двери", "Артқы есіктер", "Rear doors"],
  FENDERS: ["Крылья", "Қанаттар", "Fenders"],
  REAR_WINDOW_BUMPER: [
    "Задняя зона — согласование",
    "Артқы аймақ — келісу",
    "Rear placement — approval required",
  ],
};
