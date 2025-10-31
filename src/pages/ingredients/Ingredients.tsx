import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryProductApi } from '../../api/categoryProduct';
import { companyBranchApi } from '../../api/companyBranch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Folder, FlaskConical, Settings } from 'lucide-react';
import type { 
  Ingredient, 
  CreateIngredientRequest, 
  UpdateIngredientRequest, 
  IngredientCategory, 
  CreateIngredientCategoryRequest,
  UpdateIngredientCategoryRequest,
  Company 
} from '../../types';

export const Ingredients: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(''); // Modal için seçilen kategori
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(''); // Şirket filtresi
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set()); // Açık kategoriler
  const [formData, setFormData] = useState<CreateIngredientRequest>({
    name: '',
    company: '',
    category: '',
    description: '',
  });
  const [categoryFormData, setCategoryFormData] = useState<CreateIngredientCategoryRequest>({
    name: '',
    company: '',
    description: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Şirketleri yükle
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyBranchApi.getCompanies(),
  });

  // Seçilen şirkete göre kategorileri yükle
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['ingredient-categories', selectedCompanyId],
    queryFn: () => categoryProductApi.getIngredientCategories(selectedCompanyId || undefined),
    enabled: !!selectedCompanyId,
  });

  // Seçilen şirkete göre tüm malzemeleri yükle
  const { data: ingredientsData, isLoading: ingredientsLoading } = useQuery({
    queryKey: ['ingredients', selectedCompanyId],
    queryFn: () => categoryProductApi.getIngredients(selectedCompanyId || undefined),
    enabled: !!selectedCompanyId,
  });

  // Kategorilere göre malzemeleri grupla (pasif kategoriler ve malzemeler de dahil)
  const groupedData = useMemo(() => {
    if (!categoriesData?.categories || !ingredientsData?.ingredients) {
      return [];
    }

    const allIngredients = ingredientsData.ingredients;

    return categoriesData.categories
      .map(category => {
        const ingredients = allIngredients.filter((ingredient: Ingredient) => {
          if (!ingredient.category) return false;
          const categoryId = typeof ingredient.category === 'string' ? ingredient.category : ingredient.category?._id;
          return categoryId === category._id;
        });
        
        return {
          category,
          ingredients,
        };
      })
      .sort((a, b) => a.category.name.localeCompare(b.category.name)); // Kategoriye göre sırala
  }, [categoriesData, ingredientsData]);

  // Kategori olmayan malzemeler
  const ungroupedIngredients = useMemo(() => {
    if (!ingredientsData?.ingredients) return [];
    return ingredientsData.ingredients.filter((ingredient: Ingredient) => !ingredient.category);
  }, [ingredientsData]);

  // İlk yüklemede tüm kategorileri aç
  useEffect(() => {
    if (groupedData.length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(groupedData.map(item => item.category._id)));
    }
  }, [groupedData]);

  // Malzeme Mutations
  const createMutation = useMutation({
    mutationFn: categoryProductApi.createIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      showToast('Malzeme başarıyla oluşturuldu.', 'success');
      setIsCreateModalOpen(false);
      setFormData({ name: '', company: '', category: '', description: '' });
      setSelectedCategoryId('');
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Malzeme oluşturulurken bir hata oluştu.', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIngredientRequest }) =>
      categoryProductApi.updateIngredient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      showToast('Malzeme başarıyla güncellendi.', 'success');
      setIsEditModalOpen(false);
      setSelectedIngredient(null);
      setFormData({ name: '', company: '', category: '', description: '' });
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Malzeme güncellenirken bir hata oluştu.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryProductApi.deleteIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      showToast('Malzeme başarıyla silindi.', 'success');
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Malzeme silinirken bir hata oluştu.', 'error');
    },
  });

  const toggleActiveIngredientMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoryProductApi.updateIngredient(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });

  // Kategori Mutations
  const createCategoryMutation = useMutation({
    mutationFn: categoryProductApi.createIngredientCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-categories'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      showToast('Kategori başarıyla oluşturuldu.', 'success');
      setIsCreateCategoryModalOpen(false);
      setCategoryFormData({ name: '', company: '', description: '' });
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Kategori oluşturulurken bir hata oluştu.', 'error');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIngredientCategoryRequest }) =>
      categoryProductApi.updateIngredientCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-categories'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      showToast('Kategori başarıyla güncellendi.', 'success');
      setIsEditCategoryModalOpen(false);
      setSelectedCategory(null);
      setCategoryFormData({ name: '', company: '', description: '' });
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Kategori güncellenirken bir hata oluştu.', 'error');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoryProductApi.deleteIngredientCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-categories'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      showToast('Kategori başarıyla silindi.', 'success');
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Kategori silinirken bir hata oluştu.', 'error');
    },
  });

  const toggleActiveCategoryMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoryProductApi.updateIngredientCategory(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-categories'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    const companyId = typeof ingredient.company === 'string' ? ingredient.company : ingredient.company?._id || '';
    setFormData({
      name: ingredient.name,
      company: companyId,
      category: typeof ingredient.category === 'string' ? ingredient.category : ingredient.category?._id || '',
      description: ingredient.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      message: 'Bu malzemeyi silmek istediğinizden emin misiniz?',
      title: 'Malzeme Sil',
      confirmText: 'Sil',
      cancelText: 'İptal',
    });
    
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.company) {
      showToast('Lütfen bir şirket seçin.', 'warning');
      return;
    }
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
      message: 'Bu kategoriyi silmek istediğinizden emin misiniz? Bu kategoriye ait malzemeler varsa önce onları silmeniz gerekir.',
      title: 'Kategori Sil',
      confirmText: 'Sil',
      cancelText: 'İptal',
    });
    
    if (confirmed) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleEditCategory = (category: IngredientCategory) => {
    setSelectedCategory(category);
    const companyId = typeof category.company === 'string' ? category.company : category.company?._id || '';
    setCategoryFormData({
      name: category.name,
      company: companyId,
      description: category.description || '',
    });
    setIsEditCategoryModalOpen(true);
  };

  const handleToggleActiveCategory = (category: IngredientCategory) => {
    toggleActiveCategoryMutation.mutate({
      id: category._id,
      isActive: !category.isActive,
    });
  };

  const handleToggleActiveIngredient = (ingredient: Ingredient) => {
    toggleActiveIngredientMutation.mutate({
      id: ingredient._id,
      isActive: !ingredient.isActive,
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
      company: selectedCompanyId,
      category: categoryId,
    });
    setIsCreateModalOpen(true);
  };

  const companies = companiesData?.companies || [];

  if (categoriesLoading || ingredientsLoading) {
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Malzemeler</h1>
          <p className="text-gray-600 dark:text-gray-400">Malzeme ve kategori yönetimi - Hiyerarşik görünüm</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => setIsCreateCategoryModalOpen(true)}
            disabled={!selectedCompanyId}
          >
            <Folder className="h-4 w-4 mr-2" />
            Yeni Kategori
          </Button>
          <Button 
            onClick={() => {
              setSelectedCategoryId('');
              setFormData({ name: '', company: selectedCompanyId, category: '', description: '' });
              setIsCreateModalOpen(true);
            }}
            disabled={!selectedCompanyId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Malzeme
          </Button>
        </div>
      </div>

      {/* Şirket Filtresi */}
      <Card>
        <CardContent className="p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Şirket Seçin *</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setExpandedCategories(new Set()); // Kategorileri sıfırla
              }}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="">Şirket Seçin</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Lütfen bir şirket seçin. Kategoriler ve malzemeler şirket bazında yönetilir.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hiyerarşik Liste */}
      {selectedCompanyId && (
        <div className="space-y-3">
          {groupedData.length === 0 && ungroupedIngredients.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Henüz kategori veya malzeme bulunmuyor.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Kategoriler ve Kategorili Malzemeler */}
              {groupedData.map(({ category, ingredients }) => {
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
                              {ingredients.length} malzeme ({ingredients.filter((i: Ingredient) => i.isActive !== false).length} aktif)
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActiveCategory(category);
                              }}
                              disabled={toggleActiveCategoryMutation.isPending}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                category.isActive ? 'bg-green-500' : 'bg-gray-300'
                              } ${toggleActiveCategoryMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              title={category.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  category.isActive ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                              <span className="sr-only">
                                {category.isActive ? 'Deaktif et' : 'Aktif et'}
                              </span>
                            </button>
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
                              Malzeme Ekle
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

                      {/* Kategori Altındaki Malzemeler */}
                      {isExpanded && (
                        <div className="bg-white dark:bg-gray-800">
                          {ingredients.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                              <p>Bu kategoride henüz malzeme bulunmuyor.</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                              {ingredients.map((ingredient: Ingredient) => {
                                const isIngredientActive = ingredient.isActive !== false;
                                return (
                                  <div
                                    key={ingredient._id}
                                    className={`p-4 transition-colors ${isIngredientActive ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : 'opacity-60 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start space-x-3 flex-1">
                                        <FlaskConical className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isIngredientActive ? 'text-gray-400 dark:text-gray-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <h4 className={`font-medium ${isIngredientActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                              {ingredient.name}
                                            </h4>
                                            <span
                                              className={`px-2 py-0.5 text-xs rounded-full ${
                                                isIngredientActive
                                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                              }`}
                                            >
                                              {isIngredientActive ? 'Aktif' : 'Pasif'}
                                            </span>
                                          </div>
                                          {ingredient.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ingredient.description}</p>
                                          )}
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Oluşturulma: {new Date(ingredient.createdAt).toLocaleDateString('tr-TR')}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2 ml-4">
                                        <button
                                          onClick={() => handleToggleActiveIngredient(ingredient)}
                                          disabled={toggleActiveIngredientMutation.isPending}
                                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                            ingredient.isActive !== false ? 'bg-green-500' : 'bg-gray-300'
                                          } ${toggleActiveIngredientMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                          title={ingredient.isActive !== false ? 'Pasif Yap' : 'Aktif Yap'}
                                        >
                                          <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                              ingredient.isActive !== false ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                          />
                                          <span className="sr-only">
                                            {ingredient.isActive !== false ? 'Deaktif et' : 'Aktif et'}
                                          </span>
                                        </button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEdit(ingredient)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="danger"
                                          onClick={() => handleDelete(ingredient._id)}
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
              })}

              {/* Kategorisiz Malzemeler */}
              {ungroupedIngredients.length > 0 && (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Kategorisiz Malzemeler</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {ungroupedIngredients.length} malzeme
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800">
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {ungroupedIngredients.map((ingredient: Ingredient) => {
                          const isIngredientActive = ingredient.isActive !== false;
                          return (
                            <div
                              key={ingredient._id}
                              className={`p-4 transition-colors ${isIngredientActive ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : 'opacity-60 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <FlaskConical className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isIngredientActive ? 'text-gray-400 dark:text-gray-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h4 className={`font-medium ${isIngredientActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {ingredient.name}
                                      </h4>
                                      <span
                                        className={`px-2 py-0.5 text-xs rounded-full ${
                                          isIngredientActive
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        }`}
                                      >
                                        {isIngredientActive ? 'Aktif' : 'Pasif'}
                                      </span>
                                    </div>
                                    {ingredient.description && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ingredient.description}</p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Oluşturulma: {new Date(ingredient.createdAt).toLocaleDateString('tr-TR')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  <button
                                    onClick={() => handleToggleActiveIngredient(ingredient)}
                                    disabled={toggleActiveIngredientMutation.isPending}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                      ingredient.isActive !== false ? 'bg-green-500' : 'bg-gray-300'
                                    } ${toggleActiveIngredientMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title={ingredient.isActive !== false ? 'Pasif Yap' : 'Aktif Yap'}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        ingredient.isActive !== false ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                    <span className="sr-only">
                                      {ingredient.isActive !== false ? 'Deaktif et' : 'Aktif et'}
                                    </span>
                                  </button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(ingredient)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleDelete(ingredient._id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şirket *</label>
                  <select
                    name="company"
                    value={categoryFormData.company}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, company: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Şirket Seçin</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
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
                      setCategoryFormData({ name: '', company: '', description: '' });
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    loading={createCategoryMutation.isPending}
                    disabled={!categoryFormData.name || !categoryFormData.company}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şirket</label>
                  <select
                    name="company"
                    value={categoryFormData.company}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white sm:text-sm cursor-not-allowed"
                  >
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
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
                      setCategoryFormData({ name: '', company: '', description: '' });
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

      {/* Create Ingredient Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yeni Malzeme Oluştur</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Malzeme Adı *</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şirket *</label>
                  <select
                    name="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value, category: '' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Şirket Seçin</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori (Opsiyonel)</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    disabled={!formData.company}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Kategori Seçin (Opsiyonel)</option>
                    {categoriesData?.categories
                      ?.filter((cat: IngredientCategory) => {
                        const catCompanyId = typeof cat.company === 'string' ? cat.company : cat.company?._id;
                        return catCompanyId === formData.company;
                      })
                      .map((category: IngredientCategory) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
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
                      setFormData({ name: '', company: '', category: '', description: '' });
                      setSelectedCategoryId('');
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    loading={createMutation.isPending}
                    disabled={!formData.name || !formData.company}
                  >
                    Oluştur
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ingredient Modal */}
      {isEditModalOpen && selectedIngredient && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Malzeme Düzenle</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedIngredient) {
                  const updateData: UpdateIngredientRequest = {
                    name: formData.name,
                    description: formData.description,
                    category: formData.category || null,
                  };
                  updateMutation.mutate({ id: selectedIngredient._id, data: updateData });
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Malzeme Adı</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şirket</label>
                  <select
                    name="company"
                    value={formData.company}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white sm:text-sm cursor-not-allowed"
                  >
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori (Opsiyonel)</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Kategori Yok</option>
                    {categoriesData?.categories
                      ?.filter((cat: IngredientCategory) => {
                        const catCompanyId = typeof cat.company === 'string' ? cat.company : cat.company?._id;
                        return catCompanyId === formData.company;
                      })
                      .map((category: IngredientCategory) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
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
                      setSelectedIngredient(null);
                      setFormData({ name: '', company: '', category: '', description: '' });
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
