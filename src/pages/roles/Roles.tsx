import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolePermissionApi } from '../../api/rolePermission';
import { companyBranchApi } from '../../api/companyBranch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2, Shield, Eye, X } from 'lucide-react';
import type { Role, RolePermission, Permission, Branch } from '../../types';

export const Roles: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewPermissionsModalOpen, setIsViewPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    scope: 'GLOBAL' as 'GLOBAL' | 'BRANCH',
    branch: '',
  });
  const [selectedPermission, setSelectedPermission] = useState('');
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);

  const queryClient = useQueryClient();

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolePermissionApi.getRoles(),
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => rolePermissionApi.getPermissions(),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => companyBranchApi.getBranches(),
  });

  const createMutation = useMutation({
    mutationFn: rolePermissionApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', scope: 'GLOBAL', branch: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; scope?: 'GLOBAL' | 'BRANCH'; branch?: string }> }) =>
      rolePermissionApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsEditModalOpen(false);
      setSelectedRole(null);
      setFormData({ name: '', scope: 'GLOBAL', branch: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: rolePermissionApi.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const assignPermissionMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      rolePermissionApi.assignPermissionToRole({ roleId, permissionId }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsAssignModalOpen(false);
      setSelectedPermission('');
      
      // İzin atandıktan sonra izinleri görüntüle modal'ını tekrar aç
      if (selectedRole) {
        try {
          const permissions = await rolePermissionApi.getRolePermissions(selectedRole._id);
          setRolePermissions(permissions);
          setIsViewPermissionsModalOpen(true);
        } catch (error) {
          console.error('Failed to reload role permissions:', error);
        }
      }
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      rolePermissionApi.removePermissionFromRole(roleId, permissionId),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      
      // İzin kaldırıldıktan sonra izinleri yeniden yükle
      if (selectedRole) {
        try {
          const permissions = await rolePermissionApi.getRolePermissions(selectedRole._id);
          setRolePermissions(permissions);
        } catch (error) {
          console.error('Failed to reload role permissions:', error);
        }
      }
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      updateMutation.mutate({ id: selectedRole._id, data: formData });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu rolü silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      scope: role.scope,
      branch: role.branch || '',
    });
    setIsEditModalOpen(true);
  };

  const openAssignModal = async (role: Role) => {
    setSelectedRole(role);
    setSelectedPermission(''); // Seçimi sıfırla
    try {
      // Önce mevcut izinleri yükle
      const permissions = await rolePermissionApi.getRolePermissions(role._id);
      setRolePermissions(permissions);
    } catch (error) {
      console.error('Failed to load role permissions:', error);
      setRolePermissions([]);
    }
    setIsAssignModalOpen(true);
    setIsViewPermissionsModalOpen(false); // İzinleri görüntüle modal'ını kapat
  };

  const openViewPermissionsModal = async (role: Role) => {
    setSelectedRole(role);
    try {
      const permissions = await rolePermissionApi.getRolePermissions(role._id);
      setRolePermissions(permissions);
      setIsViewPermissionsModalOpen(true);
    } catch (error) {
      console.error('Failed to load role permissions:', error);
    }
  };

  const handleAssignPermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole && selectedPermission) {
      assignPermissionMutation.mutate({
        roleId: selectedRole._id,
        permissionId: selectedPermission,
      });
    }
  };

  const handleRemovePermission = (permissionId: string) => {
    if (selectedRole && window.confirm('Bu izni rolden kaldırmak istediğinizden emin misiniz?')) {
      removePermissionMutation.mutate({
        roleId: selectedRole._id,
        permissionId: permissionId,
      });
    }
  };

  // Filtrelenmiş izinleri hesapla
  const availablePermissions = permissionsData ? permissionsData.filter((permission: any) => 
    !rolePermissions.some((rolePermission) => 
      typeof rolePermission.permission === 'string' 
        ? rolePermission.permission === permission._id
        : rolePermission.permission?._id === permission._id
    )
  ) : [];

  const columns = [
    { key: 'name' as keyof Role, title: 'Ad' },
    { key: 'scope' as keyof Role, title: 'Kapsam' },
    { key: 'branch' as keyof Role, title: 'Şube' },
    {
      key: 'createdAt' as keyof Role,
      title: 'Oluşturulma',
      render: (value: string) => new Date(value).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions' as keyof Role,
      title: 'İşlemler',
      render: (_: any, item: Role) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openViewPermissionsModal(item)}
            className="flex items-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>İzinleri Görüntüle</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditModal(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(item._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roller</h1>
          <p className="mt-1 text-sm text-gray-500">
            Rol bilgilerini yönetin
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Rol
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table
            data={rolesData || []}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Rol</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Rol Adı"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kapsam</label>
                  <select
                    name="scope"
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as 'GLOBAL' | 'BRANCH' })} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="BRANCH">Şube</option>
                  </select>
                </div>
                {formData.scope === 'BRANCH' && (
                  <Select
                    label="Şube"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    options={branchesData?.branches?.map((branch: Branch) => ({
                      value: branch._id,
                      label: branch.name
                    })) || []}
                    placeholder="Şube seçiniz..."
                    required
                  />
                )}
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    loading={createMutation.isPending}
                  >
                    Oluştur
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Rol Düzenle</h3>
              <form onSubmit={handleEdit} className="space-y-4">
                <Input
                  label="Rol Adı"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kapsam</label>
                  <select
                    name="scope"
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as 'GLOBAL' | 'BRANCH' })} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="BRANCH">Şube</option>
                  </select>
                </div>
                {formData.scope === 'BRANCH' && (
                  <Select
                    label="Şube"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    options={branchesData?.branches?.map((branch: Branch) => ({
                      value: branch._id,
                      label: branch.name
                    })) || []}
                    placeholder="Şube seçiniz..."
                    required
                  />
                )}
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    loading={updateMutation.isPending}
                  >
                    Güncelle
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Permission Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedRole?.name} Rolüne İzin Ata
              </h3>
              <form onSubmit={handleAssignPermission} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">İzin Seçin</label>
                  {availablePermissions.length === 0 ? (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        Bu role atanabilecek yeni izin bulunmuyor. Tüm mevcut izinler zaten atanmış.
                      </p>
                    </div>
                  ) : (
                    <select
                      name="permission"
                      value={selectedPermission}
                      onChange={(e) => setSelectedPermission(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="">İzin Seçin</option>
                      {availablePermissions.map((permission) => (
                        <option key={permission._id} value={permission._id}>
                          {permission.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAssignModalOpen(false);
                      setSelectedPermission('');
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    loading={assignPermissionMutation.isPending}
                    disabled={availablePermissions.length === 0}
                  >
                    İzin Ata
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Permissions Modal */}
      {isViewPermissionsModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedRole?.name} Rolünün İzinleri
                </h3>
                <Button
                  onClick={() => openAssignModal(selectedRole!)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>İzin Ata</span>
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {rolePermissions.length > 0 ? (
                  <div className="space-y-2">
                    {rolePermissions.map((rolePermission, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {typeof rolePermission.permission === 'string' 
                                ? rolePermission.permission 
                                : (rolePermission.permission as Permission)?.name || 'Bilinmeyen İzin'
                              }
                            </p>
                            <p className="text-sm text-gray-500">
                              Atanma Tarihi: {new Date(rolePermission.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {rolePermission.branch && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Şube: {rolePermission.branch}
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRemovePermission(
                              typeof rolePermission.permission === 'string' 
                                ? rolePermission.permission 
                                : (rolePermission.permission as Permission)?._id || ''
                            )}
                            loading={removePermissionMutation.isPending}
                            className="flex items-center space-x-1"
                          >
                            <X className="h-4 w-4" />
                            <span>Kaldır</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Bu role henüz hiç izin atanmamış.</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsViewPermissionsModalOpen(false)}
                >
                  Kapat
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
