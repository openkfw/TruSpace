export interface UserPermissionDto {
  id?: string;
  workspaceId: string;
  email: string;
  role: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
}
