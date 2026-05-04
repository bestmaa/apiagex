export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'execute' | 'manage';

export type PermissionActionMap<Value = boolean> = Partial<Record<PermissionAction, Value>>;
