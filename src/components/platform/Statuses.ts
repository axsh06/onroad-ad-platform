export const STATUS_NAMES: Record<string, [string, string, string]> = {
  PENDING: ["На проверке", "Тексеруде", "Pending review"],
  NEEDS_INFO: [
    "Нужны уточнения",
    "Қосымша ақпарат керек",
    "More information needed",
  ],
  APPROVED: ["Одобрено", "Мақұлданды", "Approved"],
  REJECTED: ["Отклонено", "Қабылданбады", "Rejected"],
  CONFIRMED: ["Подтверждено", "Расталды", "Confirmed"],
  ACTIVE: ["Активно", "Белсенді", "Active"],
  COMPLETED: ["Завершено", "Аяқталды", "Completed"],
  CANCELLED: ["Отменено", "Бас тартылды", "Cancelled"],
};
