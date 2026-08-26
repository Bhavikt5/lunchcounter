import { db } from "./db";

export async function createAuditLog({
  userId,
  userName,
  action,
  entity,
  entityId,
  oldValue,
  newValue,
}: {
  userId?: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: userId || null,
        userName,
        action,
        entity,
        entityId: entityId || null,
        oldValue: oldValue || null,
        newValue: newValue || null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
