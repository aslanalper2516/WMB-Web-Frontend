import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryProductApi } from '../../api/categoryProduct';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Folder, FileText, Settings } from 'lucide-react';
import type { SalesMethod, CreateSalesMethodRequest, UpdateSalesMethodRequest, SalesMethodCategory, CreateSalesMethodCategoryRequest, UpdateSalesMethodCategoryRequest } from '../../types';

export const SalesMethods: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<SalesMethod | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SalesMethodCategory | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(''); // Modal için seçilen kategori
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set()); // Açık kategoriler
  const [formData, setFormData] = useState<CreateSalesMethodRequest>({
    name: '',
    description: '',
    category: '',
  });
  const [categoryFormData, setCategoryFormData] = useState<CreateSalesMethodCategoryRequest>({
    name: '',
    description: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Kategorileri yükle
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['sales-method-categories'],
    queryFn: () => categoryProductApi.getSalesMethodCategories(),
  });

  // Tüm satış yöntemlerini yükle
  const { data: salesMethodsData, isLoading: salesMethodsLoading } = useQuery({
    queryKey: ['sales-methods'],
    queryFn: () => categoryProductApi.getSalesMethods(),
  });

  // Kategorilere göre satış yöntemlerini grupla (pasif kategoriler ve satış yöntemleri de dahil)
  const groupedData = useMemo(() => {
    if (!categoriesData?.categories) {
      return [];
    }

    // Backend'den gelen satış yöntemleri (aktif ve pasif)
    const allMethods = salesMethodsData?.methods || [];

    return categoriesData.categories
      .map(category => {
        const methods = allMethods.filter((method: SalesMethod) => {
          const categoryId = typeof method.category === 'string' ? method.category : method.category?._id;
          return categoryId === category._id;
        });
        
        return {
          category,
          methods,
        };
      })
      // Tüm kategorileri göster, satış yöntemi olmasa bile (pasif satış yöntemleri de dahil)
      .sort((a, b) => a.category.name.localeCompare(b.category.name)); // Kategoriye göre sırala
  }, [categoriesData, salesMethodsData]);

  // İlk yüklemede tüm kategorileri aç
  React.useEffect(() => {
    if (groupedData.length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(groupedData.map(item => item.category._id)));
    }
  }, [groupedData]);

  // Satış Yöntemi Mutations
  const createMutation = useMutation({
    mutationFn: categoryProductApi.createSalesMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
      showToast('Satış yöntemi başarıyla oluşturuldu.', 'success');
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', category: '' });
      setSelectedCategoryId('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSalesMethodRequest }) =>
      categoryProductApi.updateSalesMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
      showToast('Satış yöntemi başarıyla güncellendi.', 'success');
      setIsEditModalOpen(false);
      setSelectedMethod(null);
      setFormData({ name: '', description: '', category: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryProductApi.deleteSalesMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
      showToast('Satış yöntemi başarıyla silindi.', 'success');
    },
  });

  const toggleActiveSalesMethodMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoryProductApi.updateSalesMethod(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
    },
  });

  // Kategori Mutations
  const createCategoryMutation = useMutation({
    mutationFn: categoryProductApi.createSalesMethodCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-method-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
      showToast('Kategori başarıyla oluşturuldu.', 'success');
      setIsCreateCategoryModalOpen(false);
      setCategoryFormData({ name: '', description: '' });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSalesMethodCategoryRequest }) =>
      categoryProductApi.updateSalesMethodCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-method-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
      showToast('Kategori başarıyla güncellendi.', 'success');
      setIsEditCategoryModalOpen(false);
      setSelectedCategory(null);
      setCategoryFormData({ name: '', description: '' });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoryProductApi.deleteSalesMethodCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-method-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
      showToast('Kategori başarıyla silindi.', 'success');
    },
  });

  const toggleActiveCategoryMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoryProductApi.updateSalesMethodCategory(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-method-categories'] });
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

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      message: 'Bu satış yöntemini silmek istediğinizden emin misiniz?',
      title: 'Satış Yöntemi Sil',
      confirmText: 'Sil',
      cancelText: 'İptal',
    });
    
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (method: SalesMethod) => {
    setSelectedMethod(method);
    const categoryId = typeof method.category === 'string' ? method.category : method.category?._id;
    setFormData({
      name: method.name,
      description: method.description || '',
      category: categoryId || '',
    });
    setIsEditModalOpen(true);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate(categoryFormData);
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory) {
      updateCategoryMutation.mutate({ id: selectedCategory._id, data: categoryFormData });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const confirmed = await confirm({
      message: 'Bu kategoriyi silmek istediğinizden emin misiniz? Bu kategoriye ait satış yöntemleri varsa önce onları silmeniz gerekir.',
      title: 'Kategori Sil',
      confirmText: 'Sil',
      cancelText: 'İptal',
    });
    
    if (confirmed) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleEditCategory = (category: SalesMethodCategory) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
    });
    setIsEditCategoryModalOpen(true);
  };

  const handleToggleActiveCategory = (category: SalesMethodCategory) => {
    toggleActiveCategoryMutation.mutate({
      id: category._id,
      isActive: !category.isActive,
    });
  };

  const handleToggleActiveSalesMethod = (method: SalesMethod) => {
    toggleActiveSalesMethodMutation.mutate({
      id: method._id,
      isActive: !(method.isActive !== false), // method.isActive undefined ise true kabul et
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const openCreateModalForCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setFormData({
      name: '',
      description: '',
      category: categoryId,
    });
    setIsCreateModalOpen(true);
  };

  if (categoriesLoading || salesMethodsLoading) {
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Satış Yöntemleri</h1>
          <p className="text-gray-600 dark:text-gray-400">Satış yöntemi ve kategori yönetimi - Hiyerarşik görünüm</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => setIsCreateCategoryModalOpen(true)}
          >
            <Folder className="h-4 w-4 mr-2" />
            Yeni Kategori
          </Button>
          <Button onClick={() => {
            setSelectedCategoryId('');
            setIsCreateModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Satış Yöntemi
          </Button>
        </div>
      </div>

      {/* Hiyerarşik Liste */}
      <div className="space-y-3">
        {groupedData.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Henüz kategori veya satış yöntemi bulunmuyor.</p>
            </CardContent>
          </Card>
        ) : (
          groupedData.map(({ category, methods }) => {
            const isExpanded = expandedCategories.has(category._id);
            return (
              <Card key={category._id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Kategori Header */}
                  <div className={`p-4 border-b border-gray-200 dark:border-gray-600 ${category.isActive ? 'bg-gray-50 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800 opacity-70'}`}>
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => toggleCategory(category._id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        )}
                        <Folder className={`h-5 w-5 ${category.isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                        <div>
                          <h3 className={`font-semibold ${category.isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                          {methods.length} satış yöntemi ({methods.filter((m: SalesMethod) => m.isActive !== false).length} aktif)
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            category.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}
                        >
                          {category.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActiveCategory(category);
                          }}
                          title={category.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                        >
                          {category.isActive ? '❌' : '✅'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCategory(category);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCreateModalForCategory(category._id);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Satış Yöntemi Ekle
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category._id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Kategori Altındaki Satış Yöntemleri */}
                  {isExpanded && (
                    <div className="bg-white dark:bg-gray-800">
                      {methods.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                          <p>Bu kategoride henüz satış yöntemi bulunmuyor.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {methods.map((method: SalesMethod) => {
                            const isMethodActive = method.isActive !== false;
                            return (
                            <div
                              key={method._id}
                              className={`p-4 transition-colors ${isMethodActive ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : 'opacity-60 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <FileText className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isMethodActive ? 'text-gray-400 dark:text-gray-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h4 className={`font-medium ${isMethodActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {method.name}
                                      </h4>
                                      <span
                                        className={`px-2 py-0.5 text-xs rounded-full ${
                                          isMethodActive
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        }`}
                                      >
                                        {isMethodActive ? 'Aktif' : 'Pasif'}
                                      </span>
                                    </div>
                                    {method.description && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{method.description}</p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Oluşturulma: {new Date(method.createdAt).toLocaleDateString('tr-TR')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleActiveSalesMethod(method)}
                                    title={method.isActive !== false ? 'Pasif Yap' : 'Aktif Yap'}
                                    disabled={toggleActiveSalesMethodMutation.isPending}
                                  >
                                    {method.isActive !== false ? '❌' : '✅'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(method)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleDelete(method._id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Category Modal */}
      {isCreateCategoryModalOpen && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yeni Kategori Oluştur</h3>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori Adı *</label>
                  <Input
                    name="name"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
                  <textarea
                    name="description"
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateCategoryModalOpen(false);
                      setCategoryFormData({ name: '', description: '' });
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    loading={createCategoryMutation.isPending}
                    disabled={!categoryFormData.name}
                  >
                    Oluştur
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isEditCategoryModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Kategori Düzenle</h3>
              <form onSubmit={handleUpdateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori Adı</label>
                  <Input
                    name="name"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
                  <textarea
                    name="description"
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditCategoryModalOpen(false);
                      setSelectedCategory(null);
                      setCategoryFormData({ name: '', description: '' });
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    loading={updateCategoryMutation.isPending}
                  >
                    Güncelle
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Sales Method Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yeni Satış Yöntemi Oluştur</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Satış Yöntemi Adı *</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori *</label>
                  <select
                    value={formData.category || selectedCategoryId}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      setSelectedCategoryId(e.target.value);
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Kategori Seçin</option>
                    {categoriesData?.categories?.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name} {!category.isActive ? '(Pasif)' : ''}
                      </option>
                    ))}
                  </select>
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
                      setFormData({ name: '', description: '', category: '' });
                      setSelectedCategoryId('');
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    loading={createMutation.isPending}
                    disabled={!formData.name || !formData.category}
                  >
                    Oluştur
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sales Method Modal */}
      {isEditModalOpen && selectedMethod && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Satış Yöntemi Düzenle</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Satış Yöntemi Adı</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Kategori Seçin</option>
                    {categoriesData?.categories?.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name} {!category.isActive ? '(Pasif)' : ''}
                      </option>
                    ))}
                  </select>
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
                      setSelectedMethod(null);
                      setFormData({ name: '', description: '', category: '' });
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
