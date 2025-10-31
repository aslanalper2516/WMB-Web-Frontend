import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import { companyBranchApi } from '../../api/companyBranch';
import { userCompanyBranchApi } from '../../api/userCompanyBranch';
import { rolePermissionApi } from '../../api/rolePermission';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { UserPlus, Building2, MapPin } from 'lucide-react';
import type { User, RegisterRequest, UpdateUserRequest, Company, Branch, Role, UserCompanyBranch } from '../../types';

export const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userCompanyBranches, setUserCompanyBranches] = useState<Record<string, UserCompanyBranch[]>>({});
  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
    role: ''
  });
  const [assignFormData, setAssignFormData] = useState({
    company: '',
    branch: '',
    isManager: false,
    managerType: '' as 'company' | 'branch' | ''
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

  // Load user company branches for all users
  useEffect(() => {
    if (usersData?.users) {
      const loadUserCompanyBranches = async () => {
        const branchesMap: Record<string, UserCompanyBranch[]> = {};
        await Promise.all(
          usersData.users.map(async (user: User) => {
            const userId = user._id || user.id;
            if (!userId) {
              return; // Kullanıcı ID'si yoksa atla
            }
            try {
              const res = await userCompanyBranchApi.getUserCompanies(userId);
              branchesMap[userId] = res.userCompanyBranches.filter(ucb => ucb.isActive);
            } catch (error) {
              branchesMap[userId] = [];
            }
          })
        );
        setUserCompanyBranches(branchesMap);
      };
      loadUserCompanyBranches();
    }
  }, [usersData]);

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => authApi.register(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: '' });
      showToast('Kullanıcı başarıyla oluşturuldu.', 'success');
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
      queryClient.invalidateQueries({ queryKey: ['userCompanyBranches'] });
      setShowEditModal(false);
      setSelectedUser(null);
      showToast('Kullanıcı başarıyla güncellendi.', 'success');
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
      queryClient.invalidateQueries({ queryKey: ['userCompanyBranches'] });
      setSelectedUser(null);
      showToast('Kullanıcı başarıyla silindi.', 'success');
    },
    onError: (error: any) => {
      console.error('Kullanıcı silme hatası:', error);
      showToast(`Hata: ${error.response?.data?.error || error.message || 'Bilinmeyen hata'}`, 'error');
    },
  });

  // Assign user to company/branch mutation
  const assignUserMutation = useMutation({
    mutationFn: (data: { user: string; company: string; branch?: string | null; isManager?: boolean; managerType?: 'company' | 'branch' }) =>
      userCompanyBranchApi.assignUserToCompanyBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userCompanyBranches'] });
      setShowAssignModal(false);
      setAssignFormData({ company: '', branch: '', isManager: false, managerType: '' });
      if (selectedUser) {
        // Refresh user's company branches
        const userId = selectedUser._id || selectedUser.id;
        if (userId) {
          userCompanyBranchApi.getUserCompanies(userId).then(res => {
            setUserCompanyBranches(prev => ({
              ...prev,
              [userId]: res.userCompanyBranches.filter(ucb => ucb.isActive)
            }));
          }).catch(() => {
            // Hata durumunda sessizce atla
          });
        }
      }
      showToast('Kullanıcı başarıyla atandı.', 'success');
    },
    onError: (error: any) => {
      // Backend'den gelen hata mesajını kontrol et
      let errorMessage = 'Kullanıcı atanırken bir hata oluştu.';
      
      if (error.response?.data) {
        // Backend'den gelen mesaj string ise
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } 
        // Backend'den gelen mesaj object içindeyse
        else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } 
        else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Eğer kullanıcı zaten atanmışsa, daha açıklayıcı bir mesaj göster
      if (errorMessage.includes('zaten') || errorMessage.includes('atanmış')) {
        errorMessage = 'Bu kullanıcı zaten bu şirket/şubeye atanmış. Mevcut atamayı güncellemek için önce mevcut atamayı kaldırın.';
      }
      
      showToast(errorMessage, 'error');
    },
  });

  // Get primary company and branch for display
  const getPrimaryCompanyBranch = useMemo(() => {
    return (userId: string) => {
      if (!userId) return { company: null, branch: null };
      const branches = userCompanyBranches[userId] || [];
      if (branches.length === 0) return { company: null, branch: null };
      
      // Priority: manager company > manager branch > first active
      const managerCompany = branches.find(ucb => ucb.isManager && ucb.managerType === 'company' && !ucb.branch);
      if (managerCompany) {
        const company = typeof managerCompany.company === 'string' ? null : managerCompany.company;
        return { company, branch: null };
      }
      
      const managerBranch = branches.find(ucb => ucb.isManager && ucb.managerType === 'branch' && ucb.branch);
      if (managerBranch) {
        const company = typeof managerBranch.company === 'string' ? null : managerBranch.company;
        const branch = typeof managerBranch.branch === 'string' || !managerBranch.branch ? null : managerBranch.branch;
        return { company, branch };
      }
      
      const first = branches[0];
      const company = typeof first.company === 'string' ? null : first.company;
      const branch = typeof first.branch === 'string' || !first.branch ? null : first.branch;
      return { company, branch };
    };
  }, [userCompanyBranches]);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: typeof user.role === 'string' ? user.role : user.role?._id || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = async (user: User) => {
    const confirmed = await confirm(
      'Kullanıcıyı Sil',
      `${user.name} kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
    );
    if (confirmed) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleCreateUser = () => {
    setFormData({ name: '', email: '', password: '', role: '' });
    setShowCreateModal(true);
  };

  const handleAssignUser = (user: User) => {
    setSelectedUser(user);
    setAssignFormData({ company: '', branch: '', isManager: false, managerType: '' });
    setShowAssignModal(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      const { password, ...updateData } = formData;
      const finalUpdateData: UpdateUserRequest = {
        name: updateData.name,
        email: updateData.email,
        role: updateData.role
      };
      
      if (password) {
        finalUpdateData.password = password;
      }
      
      updateUserMutation.mutate({ userId: selectedUser.id, userData: finalUpdateData });
    }
  };

  const handleSubmitAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !assignFormData.company) {
      showToast('Şirket seçilmelidir.', 'warning');
      return;
    }
    
    const userId = selectedUser._id || selectedUser.id;
    if (!userId) {
      showToast('Kullanıcı ID\'si bulunamadı.', 'error');
      return;
    }
    
    assignUserMutation.mutate({
      user: userId,
      company: assignFormData.company,
      branch: assignFormData.branch || null,
      isManager: assignFormData.isManager,
      managerType: assignFormData.isManager ? (assignFormData.managerType as 'company' | 'branch') : undefined
    });
  };

  // Get filtered branches for selected company
  const filteredBranches = useMemo(() => {
    if (!assignFormData.company || !branchesData?.branches) return [];
    return branchesData.branches.filter((branch: Branch) => {
      const branchCompanyId = typeof branch.company === 'string' ? branch.company : branch.company?._id;
      return branchCompanyId === assignFormData.company;
    });
  }, [assignFormData.company, branchesData]);

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
      key: 'company' as keyof User, 
      title: 'Şirket',
      render: (_value: any, user: User) => {
        const userId = user._id || user.id;
        const { company } = getPrimaryCompanyBranch(userId || '');
        return company?.name || '-';
      }
    },
    { 
      key: 'branch' as keyof User, 
      title: 'Şube',
      render: (_value: any, user: User) => {
        const userId = user._id || user.id;
        const { branch } = getPrimaryCompanyBranch(userId || '');
        return branch?.name || '-';
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
            variant="secondary"
            onClick={() => handleAssignUser(user)}
            title="Şirket/Şube Ata"
          >
            <UserPlus className="h-4 w-4" />
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
        <div className="fixed inset-0 bg-black dark:bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Kullanıcı Düzenle</h2>
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

      {/* Assign User to Company/Branch Modal */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black dark:bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {selectedUser.name} - Şirket/Şube Ata
            </h2>
            <form onSubmit={handleSubmitAssign} className="space-y-4">
              <Select
                label="Şirket *"
                value={assignFormData.company}
                onChange={(e) => {
                  setAssignFormData({ ...assignFormData, company: e.target.value, branch: '' });
                }}
                options={companiesData?.companies?.map((company: Company) => ({
                  value: company._id,
                  label: company.name
                })) || []}
                placeholder="Şirket seçiniz..."
                required
              />
              <Select
                label="Şube (Opsiyonel)"
                value={assignFormData.branch}
                onChange={(e) => setAssignFormData({ ...assignFormData, branch: e.target.value })}
                options={filteredBranches.map((branch: Branch) => ({
                  value: branch._id,
                  label: branch.name
                }))}
                placeholder="Şube seçiniz (boş bırakılırsa sadece şirket atanır)..."
                disabled={!assignFormData.company}
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isManager"
                  checked={assignFormData.isManager}
                  onChange={(e) => setAssignFormData({ ...assignFormData, isManager: e.target.checked, managerType: e.target.checked ? '' : '' })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="isManager" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yönetici olarak ata
                </label>
              </div>
              {assignFormData.isManager && (
                <Select
                  label="Yönetici Tipi *"
                  value={assignFormData.managerType}
                  onChange={(e) => setAssignFormData({ ...assignFormData, managerType: e.target.value as 'company' | 'branch' })}
                  options={[
                    { value: 'company', label: 'Şirket Yöneticisi' },
                    { value: 'branch', label: 'Şube Yöneticisi' }
                  ]}
                  placeholder="Yönetici tipi seçiniz..."
                  required={assignFormData.isManager}
                />
              )}
              <div className="flex space-x-2">
                <Button type="submit" loading={assignUserMutation.isPending}>
                  Ata
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)}>
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
