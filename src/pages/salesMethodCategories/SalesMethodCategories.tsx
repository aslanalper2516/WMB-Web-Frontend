import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryProductApi } from '../../api/categoryProduct';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { SalesMethodCategory, CreateSalesMethodCategoryRequest, UpdateSalesMethodCategoryRequest } from '../../types';

export const SalesMethodCategories: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SalesMethodCategory | null>(null);
  const [formData, setFormData] = useState<CreateSalesMethodCategoryRequest>({
    name: '',
    description: '',
  });

  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['sales-method-categories'],
    queryFn: () => categoryProductApi.getSalesMethodCategories(),
  });

  const createMutation = useMutation({
    mutationFn: categoryProductApi.createSalesMethodCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-method-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] }); // Satış yöntemlerini de yenile
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSalesMethodCategoryRequest }) =>
      categoryProductApi.updateSalesMethodCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-method-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] }); // Satış yöntemlerini de yenile
      setIsEditModalOpen(false);
      setSelectedCategory(null);
      setFormData({ name: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryProductApi.deleteSalesMethodCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-method-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] }); // Satış yöntemlerini de yenile
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoryProductApi.updateSalesMethodCategory(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-method-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] }); // Satış yöntemlerini de yenile
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleToggleActive = (category: SalesMethodCategory) => {
    toggleActiveMutation.mutate({
      id: category._id,
      isActive: !category.isActive,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory._id, data: formData });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Bu kategoriye ait satış yöntemleri varsa önce onları silmeniz gerekir.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (category: SalesMethodCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setIsEditModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      title: 'Kategori Adı',
      render: (_value: any, item: SalesMethodCategory) => (
        <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
      ),
    },
    {
      key: 'description',
      title: 'Açıklama',
      render: (_value: any, item: SalesMethodCategory) => (
        <span className="text-gray-600 dark:text-gray-400">{item.description || '-'}</span>
      ),
    },
    {
      key: 'isActive',
      title: 'Durum',
      render: (_value: any, item: SalesMethodCategory) => (
        <span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
          {item.isActive ? 'Aktif' : 'Pasif'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Oluşturulma',
      render: (_value: any, item: SalesMethodCategory) => (
        <span className="text-gray-600 dark:text-gray-400">{new Date(item.createdAt).toLocaleDateString('tr-TR')}</span>
      ),
    },
    {
      key: 'actions',
      title: 'İşlemler',
      render: (_value: any, item: SalesMethodCategory) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggleActive(item)}
            title={item.isActive ? 'Pasif Yap' : 'Aktif Yap'}
          >
            {item.isActive ? '❌' : '✅'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(item)}
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
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Satış Yöntemi Kategorileri</h1>
          <p className="text-gray-600 dark:text-gray-400">Satış yöntemi kategorilerini yönetin</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kategori
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table
            data={categoriesData?.categories || []}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yeni Kategori Oluştur</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori Adı *</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setFormData({ name: '', description: '' });
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    loading={createMutation.isPending}
                    disabled={!formData.name}
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
      {isEditModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Kategori Düzenle</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori Adı</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedCategory(null);
                      setFormData({ name: '', description: '' });
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

