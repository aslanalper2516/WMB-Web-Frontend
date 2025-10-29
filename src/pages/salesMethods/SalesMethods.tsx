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
    parent: undefined,
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
      setFormData({ name: '', description: '', parent: undefined });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSalesMethodRequest> }) =>
      unitsApi.updateSalesMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
      setIsEditModalOpen(false);
      setSelectedMethod(null);
      setFormData({ name: '', description: '', parent: undefined });
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
    const parentId = typeof method.parent === 'string' ? method.parent : method.parent?._id;
    setFormData({
      name: method.name,
      description: method.description || '',
      parent: parentId || undefined,
    });
    setIsEditModalOpen(true);
  };

  // Hiyerarşik sıralama fonksiyonu
  const sortSalesMethodsHierarchically = (methods: SalesMethod[]) => {
    const sorted: any[] = [];
    const methodMap = new Map(methods.map(method => [method._id, { ...method, depth: 0 }]));
    
    // Her method'un depth'ini hesapla
    const calculateDepth = (methodId: string, visited = new Set<string>()): number => {
      if (visited.has(methodId)) return 0;
      visited.add(methodId);
      const method = methodMap.get(methodId);
      if (!method) return 0;
      const parentId = typeof method.parent === 'string' ? method.parent : method.parent?._id;
      if (!parentId) return 0;
      return 1 + calculateDepth(parentId, visited);
    };
    
    methods.forEach(method => {
      const depth = calculateDepth(method._id);
      methodMap.set(method._id, { ...method, depth });
    });
    
    // Recursive olarak parent ve child'ları sırala
    const addMethodAndChildren = (parentId: string | null, currentDepth: number = 0) => {
      const children = Array.from(methodMap.values()).filter(method => {
        const methodParentId = typeof method.parent === 'string' ? method.parent : method.parent?._id;
        return (parentId === null && !methodParentId) || methodParentId === parentId;
      });
      
      children.forEach(method => {
        sorted.push({ ...method, depth: currentDepth });
        addMethodAndChildren(method._id, currentDepth + 1);
      });
    };
    
    addMethodAndChildren(null);
    return sorted;
  };

  const salesMethods = salesMethodsData?.methods || [];
  const hierarchicalSalesMethods = sortSalesMethodsHierarchically(salesMethods);

  const columns = [
    {
      key: 'name',
      title: 'Yöntem',
      render: (_value: any, item: any) => {
        const depth = item.depth || 0;
        const indent = depth * 24;
        return (
          <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
            {depth > 0 && (
              <span className="text-gray-400 mr-2">
                └─
              </span>
            )}
            <span className={depth > 0 ? 'text-gray-600' : 'font-medium'}>
              {item.name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'parent',
      title: 'Ana Yöntem',
      render: (_value: any, item: any) => {
        if (!item.parent) return '-';
        const parentId = typeof item.parent === 'string' ? item.parent : item.parent._id;
        const parentMethod = salesMethods.find(m => m._id === parentId);
        return parentMethod?.name || '-';
      },
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
            data={hierarchicalSalesMethods}
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
                  <label className="block text-sm font-medium text-gray-700">Ana Satış Yöntemi (Opsiyonel)</label>
                  <select
                    value={formData.parent || ''}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value || undefined })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Ana Yöntem Seçin</option>
                    {hierarchicalSalesMethods.map((method: any) => {
                      const depth = method.depth || 0;
                      const indent = '  '.repeat(depth);
                      const prefix = depth > 0 ? '└─ ' : '';
                      return (
                        <option key={method._id} value={method._id}>
                          {indent}{prefix}{method.name}
                        </option>
                      );
                    })}
                  </select>
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
                  <label className="block text-sm font-medium text-gray-700">Ana Satış Yöntemi (Opsiyonel)</label>
                  <select
                    value={formData.parent || ''}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value || undefined })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Ana Yöntem Seçin</option>
                    {hierarchicalSalesMethods
                      .filter((method: any) => method._id !== selectedMethod?._id)
                      .map((method: any) => {
                        const depth = method.depth || 0;
                        const indent = '  '.repeat(depth);
                        const prefix = depth > 0 ? '└─ ' : '';
                        return (
                          <option key={method._id} value={method._id}>
                            {indent}{prefix}{method.name}
                          </option>
                        );
                      })
                    }
                  </select>
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

