import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import { companyBranchApi } from '../../api/companyBranch';
import { rolePermissionApi } from '../../api/rolePermission';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import type { User, RegisterRequest, UpdateUserRequest, Company, Branch, Role } from '../../types';

export const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
    role: '',
    branch: '',
    company: ''
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers(),
  });

  // Fetch companies, branches, and roles for dropdowns
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyBranchApi.getCompanies(),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => companyBranchApi.getBranches(),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolePermissionApi.getRoles(),
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => authApi.register(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: '', branch: '', company: '' });
    },
    onError: (error: any) => {
      console.error('Kullanıcı oluşturma hatası:', error);
      showToast(`Hata: ${error.response?.data?.error || error.message || 'Bilinmeyen hata'}`, 'error');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: UpdateUserRequest }) => 
      authApi.updateUser(userId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowEditModal(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      console.error('Kullanıcı güncelleme hatası:', error);
      showToast(`Hata: ${error.response?.data?.error || error.message || 'Bilinmeyen hata'}`, 'error');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => authApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowDeleteModal(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      console.error('Kullanıcı silme hatası:', error);
      showToast(`Hata: ${error.response?.data?.error || error.message || 'Bilinmeyen hata'}`, 'error');
    },
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: typeof user.role === 'string' ? user.role : user.role?._id || '',
      branch: typeof user.branch === 'string' ? user.branch : user.branch?._id || '',
      company: typeof user.company === 'string' ? user.company : user.company?._id || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleCreateUser = () => {
    setFormData({ name: '', email: '', password: '', role: '', branch: '', company: '' });
    setShowCreateModal(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Boş string'leri undefined yap
    const cleanData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      branch: formData.branch || undefined,
      company: formData.company || undefined
    };
    
    createUserMutation.mutate(cleanData);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      const { password, ...updateData } = formData;
      
      // Boş string'leri undefined yap
      const finalUpdateData: UpdateUserRequest = {
        name: updateData.name,
        email: updateData.email,
        role: updateData.role,
        branch: updateData.branch || undefined,
        company: updateData.company || undefined
      };
      
      if (password) {
        finalUpdateData.password = password;
      }
      
      updateUserMutation.mutate({ userId: selectedUser.id, userData: finalUpdateData });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const columns = [
    { key: 'name' as keyof User, title: 'Ad' },
    { key: 'email' as keyof User, title: 'E-posta' },
    { 
      key: 'role' as keyof User, 
      title: 'Rol',
      render: (value: string | { name: string }) => {
        if (typeof value === 'string') return value;
        return value?.name || '-';
      }
    },
    { 
      key: 'branch' as keyof User, 
      title: 'Şube',
      render: (value: string | { name: string }) => {
        if (typeof value === 'string') return value;
        return value?.name || '-';
      }
    },
    { 
      key: 'company' as keyof User, 
      title: 'Şirket',
      render: (value: string | { name: string }) => {
        if (typeof value === 'string') return value;
        return value?.name || '-';
      }
    },
    {
      key: 'createdAt' as keyof User,
      title: 'Oluşturulma',
      render: (value: string) => new Date(value).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions' as keyof User,
      title: 'İşlemler',
      render: (_value: any, user: User) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditUser(user)}
          >
            Düzenle
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteUser(user)}
          >
            Sil
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanıcılar</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kullanıcı bilgilerini görüntüleyin ve yönetin
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          + Yeni Kullanıcı Ekle
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table
            data={usersData?.users || []}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black dark:bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Yeni Kullanıcı Ekle</h2>
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <Input
                label="Ad"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Şifre"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <Select
                label="Rol"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={rolesData?.map((role: Role) => ({
                  value: role._id,
                  label: role.name
                })) || []}
                placeholder="Rol seçiniz..."
                required
              />
              <Select
                label="Şirket"
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                options={companiesData?.companies?.map((company: Company) => ({
                  value: company._id,
                  label: company.name
                })) || []}
                placeholder="Şirket seçiniz..."
              />
              <Select
                label="Şube"
                value={formData.branch || ''}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                options={branchesData?.branches?.map((branch: Branch) => ({
                  value: branch._id,
                  label: branch.name
                })) || []}
                placeholder="Şube seçiniz..."
              />
              <div className="flex space-x-2">
                <Button type="submit" loading={createUserMutation.isPending}>
                  Oluştur
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Kullanıcı Düzenle</h2>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <Input
                label="Ad"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Şifre (boş bırakırsanız değişmez)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <Select
                label="Rol"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={rolesData?.map((role: Role) => ({
                  value: role._id,
                  label: role.name
                })) || []}
                placeholder="Rol seçiniz..."
                required
              />
              <Select
                label="Şirket"
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                options={companiesData?.companies?.map((company: Company) => ({
                  value: company._id,
                  label: company.name
                })) || []}
                placeholder="Şirket seçiniz..."
              />
              <Select
                label="Şube"
                value={formData.branch || ''}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                options={branchesData?.branches?.map((branch: Branch) => ({
                  value: branch._id,
                  label: branch.name
                })) || []}
                placeholder="Şube seçiniz..."
              />
              <div className="flex space-x-2">
                <Button type="submit" loading={updateUserMutation.isPending}>
                  Güncelle
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Kullanıcı Sil</h2>
            <p className="mb-4">
              <strong>{selectedUser.name}</strong> kullanıcısını silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </p>
            <div className="flex space-x-2">
              <Button 
                variant="danger" 
                onClick={handleDeleteConfirm}
                loading={deleteUserMutation.isPending}
              >
                Sil
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                İptal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};