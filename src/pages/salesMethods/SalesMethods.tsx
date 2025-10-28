import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitsApi } from '../../api/units';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { SalesMethod, CreateSalesMethodRequest } from '../../types';

export const SalesMethods: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<SalesMethod | null>(null);
  const [formData, setFormData] = useState<CreateSalesMethodRequest>({
    name: '',
    description: '',
  });

  const queryClient = useQueryClient();

  const { data: salesMethodsData, isLoading } = useQuery({
    queryKey: ['sales-methods'],
    queryFn: () => unitsApi.getSalesMethods(),
  });

  const createMutation = useMutation({
    mutationFn: unitsApi.createSalesMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSalesMethodRequest> }) =>
      unitsApi.updateSalesMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
      setIsEditModalOpen(false);
      setSelectedMethod(null);
      setFormData({ name: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: unitsApi.deleteSalesMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMethod) {
      updateMutation.mutate({ id: selectedMethod._id, data: formData });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu satış yöntemini silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (method: SalesMethod) => {
    setSelectedMethod(method);
    setFormData({
      name: method.name,
      description: method.description || '',
    });
    setIsEditModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      title: 'Yöntem',
      render: (_value: any, item: SalesMethod) => item.name,
    },
    {
      key: 'description',
      title: 'Açıklama',
      render: (_value: any, item: SalesMethod) => item.description || '-',
    },
    {
      key: 'createdAt',
      title: 'Oluşturulma',
      render: (_value: any, item: SalesMethod) => new Date(item.createdAt).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions',
      title: 'İşlemler',
      render: (_value: any, item: SalesMethod) => (
        <div className="flex space-x-2">
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
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satış Yöntemleri</h1>
          <p className="text-gray-600">Satış yöntemi yönetimi</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Satış Yöntemi
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table
            data={salesMethodsData?.methods || []}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Satış Yöntemi Oluştur</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Satış Yöntemi Adı</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                  />
                </div>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Satış Yöntemi Düzenle</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Satış Yöntemi Adı</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                  />
                </div>
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

