ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS recipient_staff_id UUID REFERENCES staff(id_staff) ON DELETE CASCADE;

INSERT INTO notifications (
    id, type, title, message, target_path, created_at, read_at, recipient_staff_id
)
SELECT gen_random_uuid(), n.type, n.title, n.message, n.target_path, n.created_at, n.read_at, s.id_staff
FROM notifications n
CROSS JOIN staff s
WHERE n.recipient_staff_id IS NULL
  AND s.activo = TRUE
  AND LOWER(s.rol_sistema) IN ('admin', 'administrador');

DELETE FROM notifications n
WHERE n.recipient_staff_id IS NULL
  AND EXISTS (
      SELECT 1
      FROM staff s
      WHERE s.activo = TRUE
        AND LOWER(s.rol_sistema) IN ('admin', 'administrador')
  );

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
    ON notifications(recipient_staff_id, created_at DESC);
