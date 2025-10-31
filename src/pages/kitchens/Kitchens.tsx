import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryProductApi } from '../../api/categoryProduct';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Kitchen, CreateKitchenRequest } from '../../types';
import { companyBranchApi } from '../../api/companyBranch';

export const Kitchens: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedKitchen, setSelectedKitchen] = useState<Kitchen | null>(null);
  const [formData, setFormData] = useState<CreateKitchenRequest>({
    name: '',
    company: '',
    branch: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const { data: kitchensData, isLoading } = useQuery({
    queryKey: ['kitchens'],
    queryFn: () => categoryProductApi.getKitchens(),
  });

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyBranchApi.getCompanies(),
  });

  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => companyBranchApi.getBranches(),
  });

  const createMutation = useMutation({
    mutationFn: categoryProductApi.createKitchen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchens'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', company: '', branch: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateKitchenRequest> }) =>
      categoryProductApi.updateKitchen(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchens'] });
      setIsEditModalOpen(false);
      setSelectedKitchen(null);
      setFormData({ name: '', company: '', branch: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryProductApi.deleteKitchen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchens'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoryProductApi.updateKitchen(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchens'] });
    },
  });

  const handleToggleActive = (kitchen: Kitchen) => {
    toggleActiveMutation.mutate({
      id: kitchen._id,
      isActive: !kitchen.isActive,
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKitchen) {
      updateMutation.mutate({ id: selectedKitchen._id, data: formData });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      message: 'Bu mutfağı silmek istediğinizden emin misiniz?',
      title: 'Mutfak Sil',
      confirmText: 'Sil',
      cancelText: 'İptal',
    });
    
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (kitchen: Kitchen) => {
    setSelectedKitchen(kitchen);
    setFormData({
      name: kitchen.name,
      company: typeof kitchen.company === 'string' ? kitchen.company : kitchen.company._id,
      branch: typeof kitchen.branch === 'string' ? kitchen.branch : kitchen.branch._id,
    });
    setIsEditModalOpen(true);
  };

  const columns = [
    { key: 'name' as keyof Kitchen, title: 'Ad' },
    { 
      key: 'company' as keyof Kitchen, 
      title: 'Şirket',
      render: (_value: any, item: Kitchen) => {
        const value = item.company;
        if (typeof value === 'string') return value;
        return value?.name || 'N/A';
      }
    },
    { 
      key: 'branch' as keyof Kitchen, 
      title: 'Şube',
      render: (_value: any, item: Kitchen) => {
        const value = item.branch;
        if (typeof value === 'string') return value;
        return value?.name || 'N/A';
      }
    },
    {
      key: 'isActive' as keyof Kitchen,
      title: 'Durum',
      render: (_value: any, item: Kitchen) => (
        <button
          onClick={() => handleToggleActive(item)}
          disabled={toggleActiveMutation.isPending}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            item.isActive ? 'bg-green-500' : 'bg-gray-300'
          } ${toggleActiveMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={item.isActive ? 'Aktif - Pasif yapmak için tıklayın' : 'Pasif - Aktif yapmak için tıklayın'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              item.isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
          <span className="sr-only">
            {item.isActive ? 'Deaktif et' : 'Aktif et'}
          </span>
        </button>
      ),
    },
    {
      key: 'createdAt' as keyof Kitchen,
      title: 'Oluşturulma',
      render: (_value: any, item: Kitchen) => new Date(item.createdAt).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions' as keyof Kitchen,
      title: 'İşlemler',
      render: (_value: any, item: Kitchen) => (
        <div className="flex space-x-2">
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

  if (isLoading || companiesLoading || branchesLoading) {
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mutfaklar</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Mutfak bilgilerini yönetin
          </p>
        </div>
        <Button onClick={() => {
          setFormData({ name: '', company: '', branch: '' });
          setIsCreateModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Mutfak
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table
            data={kitchensData?.kitchens || []}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yeni Mutfak</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Mutfak Adı"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şirket</label>
                  <select
                    name="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value, branch: '' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Şirket Seçin</option>
                    {companiesData?.companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şube</label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500"
                    required
                    disabled={!formData.company}
                  >
                    <option value="">Şube Seçin</option>
                    {branchesData?.branches
                      .filter((branch) => {
                        const branchCompanyId = typeof branch.company === 'string' ? branch.company : branch.company._id;
                        return branchCompanyId === formData.company;
                      })
                      .map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setFormData({ name: '', company: '', branch: '' });
                    }}
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
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Mutfak Düzenle</h3>
              <form onSubmit={handleEdit} className="space-y-4">
                <Input
                  label="Mutfak Adı"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şirket</label>
                  <select
                    name="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value, branch: '' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Şirket Seçin</option>
                    {companiesData?.companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şube</label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    disabled={!formData.company}
                  >
                    <option value="">Şube Seçin</option>
                    {branchesData?.branches
                      .filter((branch) => {
                        const branchCompanyId = typeof branch.company === 'string' ? branch.company : branch.company._id;
                        return branchCompanyId === formData.company;
                      })
                      .map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedKitchen(null);
                      setFormData({ name: '', company: '', branch: '' });
                    }}
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
    </div>
  );
};
