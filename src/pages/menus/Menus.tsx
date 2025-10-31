import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '../../api/menu';
import { companyBranchApi } from '../../api/companyBranch';
import type { Menu, Company } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

export const Menus: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    company: ''
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const { data: menusData, isLoading: menusLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menuApi.getMenus(),
  });

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyBranchApi.getCompanies(),
  });

  const createMutation = useMutation({
    mutationFn: menuApi.createMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      setFormData({ name: '', description: '', company: '' });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => menuApi.updateMenu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      setIsEditModalOpen(false);
      setSelectedMenu(null);
      setFormData({ name: '', description: '', company: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: menuApi.deleteMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenu) return;
    updateMutation.mutate({ id: selectedMenu._id, data: formData });
  };

  const handleDeleteMenu = async (id: string) => {
    const confirmed = await confirm({
      message: 'Bu menüyü silmek istediğinizden emin misiniz?',
      title: 'Menü Sil',
      confirmText: 'Sil',
      cancelText: 'İptal',
    });
    
    if (!confirmed) return;
    deleteMutation.mutate(id);
  };

  const handleEditMenu = (menu: Menu) => {
    setSelectedMenu(menu);
    setFormData({
      name: menu.name,
      description: menu.description || '',
      company: typeof menu.company === 'string' ? menu.company : menu.company._id
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', company: '' });
    setSelectedMenu(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  const menus = menusData?.menus || [];
  const companies = companiesData?.companies || [];

  const columns = [
    {
      key: 'name',
      title: 'Ad',
    },
    {
      key: 'description',
      title: 'Açıklama',
      render: (_value: any, menu: Menu) => menu.description || '-'
    },
    {
      key: 'company',
      title: 'Şirket',
      render: (_value: any, menu: Menu) => {
        if (!menu.company) return '-';
        return typeof menu.company === 'string' ? menu.company : menu.company.name;
      }
    },
    {
      key: 'isActive',
      title: 'Durum',
      render: (_value: any, menu: Menu) => menu.isActive ? 'Aktif' : 'Pasif'
    },
    {
      key: 'createdAt',
      title: 'Oluşturulma',
      render: (_value: any, menu: Menu) => new Date(menu.createdAt).toLocaleDateString('tr-TR')
    },
    {
      key: 'actions',
      title: 'İşlemler',
      render: (_value: any, menu: Menu) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/menus/${menu._id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditMenu(menu)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteMenu(menu._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (menusLoading || companiesLoading) {
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menüler</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Menü bilgilerini yönetin
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Menü
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table
            data={menus}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yeni Menü Oluştur</h3>
              <form onSubmit={handleCreateMenu} className="space-y-4">
                <Input
                  label="Menü Adı"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Açıklama"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <Select
                  label="Şirket"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  options={companies.map(company => ({
                    value: company._id,
                    label: company.name
                  }))}
                  placeholder="Şirket Seçin"
                  required
                />
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
      {isEditModalOpen && selectedMenu && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Menü Düzenle</h3>
              <form onSubmit={handleUpdateMenu} className="space-y-4">
                <Input
                  label="Menü Adı"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Açıklama"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
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
    </div>
  );
};