import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryProductApi } from '../../api/categoryProduct';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Category, CreateCategoryRequest, Company, Branch } from '../../types';
import { companyBranchApi } from '../../api/companyBranch';

export const Categories: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    parent: '',
    company: '',
    branch: '',
  });

  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryProductApi.getCategories(),
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
    mutationFn: categoryProductApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', parent: '', company: '', branch: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryRequest> }) =>
      categoryProductApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsEditModalOpen(false);
      setSelectedCategory(null);
      setFormData({ name: '', parent: '', company: '', branch: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryProductApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // parent alanı boş string ise undefined yap
    const dataToSend = {
      ...formData,
      parent: formData.parent === '' ? undefined : formData.parent
    };
    createMutation.mutate(dataToSend);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory) {
      // parent alanı boş string ise undefined yap
      const dataToSend = {
        ...formData,
        parent: formData.parent === '' ? undefined : formData.parent
      };
      updateMutation.mutate({ id: selectedCategory._id, data: dataToSend });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      parent: category.parent || '',
      company: category.company || '',
      branch: category.branch || '',
    });
    setIsEditModalOpen(true);
  };

  const columns = [
    { key: 'name' as keyof Category, title: 'Ad' },
    { 
      key: 'parent' as keyof Category, 
      title: 'Ana Kategori',
      render: (value: any) => typeof value === 'object' ? value?.name || 'Ana Kategori' : value || 'Ana Kategori'
    },
    { 
      key: 'company' as keyof Category, 
      title: 'Şirket',
      render: (value: any) => typeof value === 'object' ? value?.name || 'N/A' : value || 'N/A'
    },
    { 
      key: 'branch' as keyof Category, 
      title: 'Şube',
      render: (value: any) => typeof value === 'object' ? value?.name || 'N/A' : value || 'N/A'
    },
    {
      key: 'createdAt' as keyof Category,
      title: 'Oluşturulma',
      render: (value: string) => new Date(value).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions' as keyof Category,
      title: 'İşlemler',
      render: (_: any, item: Category) => (
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
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategoriler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kategori bilgilerini yönetin
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kategori
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table
            data={categoriesData?.categories || []}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Kategori</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Kategori Adı"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ana Kategori (Opsiyonel)</label>
                  <select
                    name="parent"
                    value={formData.parent}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Ana Kategori Seçin (Opsiyonel)</option>
                    {categoriesData?.categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Şirket</label>
                  <select
                    name="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-gray-700">Şube</label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Şube Seçin</option>
                    {branchesData?.branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Kategori Düzenle</h3>
              <form onSubmit={handleEdit} className="space-y-4">
                <Input
                  label="Kategori Adı"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ana Kategori (Opsiyonel)</label>
                  <select
                    name="parent"
                    value={formData.parent}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Ana Kategori Seçin (Opsiyonel)</option>
                    {categoriesData?.categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Şirket</label>
                  <select
                    name="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-gray-700">Şube</label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Şube Seçin</option>
                    {branchesData?.branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
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
