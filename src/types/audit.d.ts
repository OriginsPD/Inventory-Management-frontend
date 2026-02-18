// frontend/src/types/audit.d.ts

export type AuditLog = {
  id: string;
  entityName: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedAt: string;
};
