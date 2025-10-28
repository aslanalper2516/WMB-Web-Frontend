import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryProductApi } from '../../api/categoryProduct';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Product, CreateProductRequest } from '../../types';

export const Products: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    defaultSalesMethod: '',
  });

  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => categoryProductApi.getProducts(),
  });

  const { data: salesMethodsData } = useQuery({
    queryKey: ['sales-methods'],
    queryFn: () => categoryProductApi.getSalesMethods(),
  });

  const createMutation = useMutation({
    mutationFn: categoryProductApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', defaultSalesMethod: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductRequest> }) =>
      categoryProductApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      setFormData({ name: '', description: '', defaultSalesMethod: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryProductApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct._id, data: formData });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      defaultSalesMethod: typeof product.defaultSalesMethod === 'string' ? product.defaultSalesMethod : product.defaultSalesMethod._id,
    });
    setIsEditModalOpen(true);
  };

  const products = productsData?.products || [];

  const columns = [
    {
      key: 'name',
      title: 'Ad',
      render: (item: Product) => item.name,
    },
    {
      key: 'description',
      title: 'Açıklama',
      render: (item: Product) => item.description || '-',
    },
    {
      key: 'defaultSalesMethod',
      title: 'Varsayılan Satış Yöntemi',
      render: (item: Product) => {
        if (typeof item.defaultSalesMethod === 'string') {
          return item.defaultSalesMethod;
        }
        return item.defaultSalesMethod?.name || '-';
      },
    },
    {
      key: 'isActive',
      title: 'Durum',
      render: (item: Product) => (item.isActive ? 'Aktif' : 'Pasif'),
    },
    {
      key: 'createdAt',
      title: 'Oluşturulma',
      render: (item: Product) => new Date(item.createdAt).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions',
      title: 'İşlemler',
      render: (item: Product) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-gray-600">Ürün yönetimi</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Ürün
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table
            data={products}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Ürün Oluştur</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ürün Adı</label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Varsayılan Satış Yöntemi</label>
                  <select
                    name="defaultSalesMethod"
                    value={formData.defaultSalesMethod}
                    onChange={(e) => setFormData({ ...formData, defaultSalesMethod: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Satış Yöntemi Seçin</option>
                    {salesMethodsData?.methods.map((method) => (
                      <option key={method._id} value={method._id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ürün Düzenle</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ürün Adı</label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Varsayılan Satış Yöntemi</label>
                  <select
                    name="defaultSalesMethod"
                    value={formData.defaultSalesMethod}
                    onChange={(e) => setFormData({ ...formData, defaultSalesMethod: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Satış Yöntemi Seçin</option>
                    {salesMethodsData?.methods.map((method) => (
                      <option key={method._id} value={method._id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
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