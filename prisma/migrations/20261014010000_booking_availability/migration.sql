-- Earlier confirmations set isAvailable=false indefinitely. Keep the manual
-- listing flag for unbooked slots, and derive confirmed occupancy from dates.
UPDATE "ad_slots" AS slot
SET "isAvailable" = true
WHERE slot."isAvailable" = false
  AND EXISTS (
    SELECT 1 FROM "bookings" AS booking
    WHERE booking."slotId" = slot.id
      AND booking.status IN ('CONFIRMED', 'APPROVED', 'ACTIVE', 'COMPLETED')
  );
