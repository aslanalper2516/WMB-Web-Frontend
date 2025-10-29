import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '../../api/menu';
import { categoryProductApi } from '../../api/categoryProduct';
import { companyBranchApi } from '../../api/companyBranch';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Plus, Trash2, ArrowLeft, Eye } from 'lucide-react';

export const MenuDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'branches' | 'kitchens'>('categories');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAssignBranch, setShowAssignBranch] = useState(false);
  const [showAssignProductToKitchen, setShowAssignProductToKitchen] = useState(false);
  const [showKitchenDetail, setShowKitchenDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategoryForKitchen, setSelectedCategoryForKitchen] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedBranchTab, setSelectedBranchTab] = useState<string>('');
  const [selectedKitchen, setSelectedKitchen] = useState<string>('');
  const [isAssigningProducts, setIsAssigningProducts] = useState(false);

  const queryClient = useQueryClient();

  // Menü detaylarını getir
  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => menuApi.getMenuById(id!),
    enabled: !!id,
  });

  // Menü kategorilerini getir
  const { data: menuCategoriesData } = useQuery({
    queryKey: ['menu-categories', id],
    queryFn: () => menuApi.getMenuCategories(id!),
    enabled: !!id,
  });

  // Menü ürünlerini getir
  const { data: menuProductsData } = useQuery({
    queryKey: ['menu-products', id],
    queryFn: () => menuApi.getMenuProducts(id!),
    enabled: !!id,
  });

  // Menü şubelerini getir
  const { data: menuBranchesData } = useQuery({
    queryKey: ['menu-branches', id],
    queryFn: () => menuApi.getMenuBranches(id!),
    enabled: !!id,
  });

  // Tüm kategorileri getir
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryProductApi.getCategories(),
  });

  // Eklenebilir ürünleri getir (seçilen kategoriye göre)
  const { data: availableProductsData } = useQuery({
    queryKey: ['available-products', id, selectedCategory],
    queryFn: () => menuApi.getAvailableProducts(id!, selectedCategory),
    enabled: !!id && !!selectedCategory,
  });

  // Tüm şubeleri getir
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => companyBranchApi.getBranches(),
  });

  // Mutfakları getir (seçili şubeye göre)
  const { data: kitchensData } = useQuery({
    queryKey: ['kitchens', selectedBranchTab],
    queryFn: () => categoryProductApi.getKitchens(selectedBranchTab),
    enabled: !!selectedBranchTab,
  });

  // Mutfak detayı için mutfağa atanmış ürünleri getir
  const { data: kitchenProductsData } = useQuery({
    queryKey: ['kitchen-products', selectedKitchen],
    queryFn: () => menuApi.getKitchenProducts(selectedKitchen!),
    enabled: !!selectedKitchen && showKitchenDetail,
  });

  // Mutasyonlar
  const addCategoryMutation = useMutation({
    mutationFn: ({ menuId, categoryId, parentId }: { menuId: string; categoryId: string; parentId?: string }) =>
      menuApi.addCategoryToMenu(menuId, categoryId, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories', id] });
      setShowAddCategory(false);
      setSelectedCategory('');
      setSelectedParentCategory('');
    },
  });

  const removeCategoryMutation = useMutation({
    mutationFn: ({ menuId, categoryId }: { menuId: string; categoryId: string }) =>
      menuApi.removeCategoryFromMenu(menuId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories', id] });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: ({ menuId, categoryId, productId }: { menuId: string; categoryId: string; productId: string }) =>
      menuApi.addProductToMenuCategory(menuId, categoryId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-products', id] });
      setShowAddProduct(false);
      setSelectedCategory('');
      setSelectedProduct('');
    },
  });

  const removeProductMutation = useMutation({
    mutationFn: ({ menuId, categoryId, productId }: { menuId: string; categoryId: string; productId: string }) =>
      menuApi.removeProductFromMenuCategory(menuId, categoryId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-products', id] });
    },
  });

  const assignBranchMutation = useMutation({
    mutationFn: ({ menuId, branchId }: { menuId: string; branchId: string }) =>
      menuApi.assignMenuToBranch(menuId, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-branches', id] });
      setShowAssignBranch(false);
      setSelectedBranch('');
    },
  });

  const unassignBranchMutation = useMutation({
    mutationFn: ({ menuId, branchId }: { menuId: string; branchId: string }) =>
      menuApi.unassignMenuFromBranch(menuId, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-branches', id] });
    },
  });

  const deleteKitchenMutation = useMutation({
    mutationFn: categoryProductApi.deleteKitchen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchens'] });
    },
  });

  const removeProductFromKitchenMutation = useMutation({
    mutationFn: ({ productId, kitchenId, branchId }: { productId: string; kitchenId: string; branchId: string }) =>
      menuApi.removeProductFromKitchen(productId, kitchenId, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-products'] });
    },
  });

  // İlk şubeyi otomatik seç
  useEffect(() => {
    if (activeTab === 'kitchens' && menuBranchesData?.menuBranches && menuBranchesData.menuBranches.length > 0 && !selectedBranchTab) {
      const firstBranch = menuBranchesData.menuBranches[0];
      const branchId = firstBranch.branch ? (typeof firstBranch.branch === 'string' ? firstBranch.branch : firstBranch.branch._id) : '';
      setSelectedBranchTab(branchId);
    }
  }, [activeTab, menuBranchesData, selectedBranchTab]);

  // Event handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    addCategoryMutation.mutate({ 
      menuId: id!, 
      categoryId: selectedCategory, 
      parentId: selectedParentCategory || undefined 
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !selectedProduct) return;
    addProductMutation.mutate({ menuId: id!, categoryId: selectedCategory, productId: selectedProduct });
  };

  const handleAssignBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    assignBranchMutation.mutate({ menuId: id!, branchId: selectedBranch });
  };

  const handleAssignProductToKitchen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0 || !selectedKitchen || !selectedBranch) return;
    
    setIsAssigningProducts(true);
    
    // Birden fazla ürünü sırayla ata
    try {
      await Promise.all(
        selectedProducts.map(productId => 
          menuApi.assignProductToKitchen(productId, selectedKitchen, selectedBranch)
        )
      );
      
      // Tüm atamalar başarılı olduğunda
      queryClient.invalidateQueries({ queryKey: ['kitchen-products'] });
      setShowAssignProductToKitchen(false);
      setSelectedProduct('');
      setSelectedProducts([]);
      setSelectedCategoryForKitchen('');
      setSelectedKitchen('');
      setSelectedBranch('');
    } catch (error) {
      console.error('Ürün atama hatası:', error);
      alert('Bazı ürünler atanırken hata oluştu.');
    } finally {
      setIsAssigningProducts(false);
    }
  };

  if (menuLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!menuData?.menu) {
    return <div className="text-center text-red-600">Menü bulunamadı</div>;
  }

  const menu = menuData.menu;
  const menuCategories = menuCategoriesData?.menuCategories || [];
  const menuProducts = menuProductsData?.menuProducts || [];
  const menuBranches = menuBranchesData?.menuBranches || [];
  const categories = categoriesData?.categories || [];
  const availableProducts = availableProductsData?.products || [];
  const branches = branchesData?.branches || [];
  const kitchens = kitchensData?.kitchens || [];
  const kitchenProducts = kitchenProductsData?.products || [];

  // Kategorileri hiyerarşik olarak sırala
  const sortCategoriesHierarchically = (categories: any[]) => {
    const sorted: any[] = [];
    const categoryMap = new Map(categories.map(cat => [cat._id, { ...cat, depth: 0 }]));
    
    // Her kategorinin derinliğini hesapla
    const calculateDepth = (catId: string, visited = new Set<string>()): number => {
      if (visited.has(catId)) return 0; // Sonsuz döngü kontrolü
      visited.add(catId);
      
      const cat = categoryMap.get(catId);
      if (!cat) return 0;
      
      const parentId = typeof cat.parent === 'string' ? cat.parent : cat.parent?._id;
      if (!parentId) return 0;
      
      return 1 + calculateDepth(parentId, visited);
    };
    
    // Her kategori için derinliği hesapla
    categories.forEach(cat => {
      const depth = calculateDepth(cat._id);
      categoryMap.set(cat._id, { ...cat, depth });
    });
    
    // Ana kategorileri bul ve sırala
    const addCategoryAndChildren = (parentId: string | null, currentDepth: number = 0) => {
      const children = Array.from(categoryMap.values()).filter(cat => {
        const catParentId = typeof cat.parent === 'string' ? cat.parent : cat.parent?._id;
        return (parentId === null && !catParentId) || catParentId === parentId;
      });
      
      // Sıra numarasına göre sırala
      children.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      children.forEach(cat => {
        sorted.push({ ...cat, depth: currentDepth });
        addCategoryAndChildren(cat._id, currentDepth + 1);
      });
    };
    
    addCategoryAndChildren(null);
    return sorted;
  };

  const hierarchicalCategories = sortCategoriesHierarchically(menuCategories);

  // Bir kategorinin tüm alt kategorilerini bul (recursive)
  const getAllSubCategories = (categoryId: string): string[] => {
    const subCategories: string[] = [categoryId];
    
    // Verilen category ID'ye sahip MenuCategory'yi bul
    const parentMenuCategory = menuCategories.find(mc => {
      const catId = mc.category ? (typeof mc.category === 'string' ? mc.category : mc.category._id) : '';
      return catId === categoryId;
    });
    
    if (!parentMenuCategory) return subCategories;
    
    const findChildren = (parentMenuCategoryId: string) => {
      menuCategories.forEach(mc => {
        // mc.parent field'ı bir MenuCategory'ye işaret eder
        const mcParentId = mc.parent ? (typeof mc.parent === 'string' ? mc.parent : mc.parent._id) : null;
        const catId = mc.category ? (typeof mc.category === 'string' ? mc.category : mc.category._id) : '';
        
        if (mcParentId === parentMenuCategoryId && catId && !subCategories.includes(catId)) {
          subCategories.push(catId);
          // Bu child MenuCategory'nin de child'larını bul
          findChildren(mc._id);
        }
      });
    };
    
    findChildren(parentMenuCategory._id);
    return subCategories;
  };

  // Menüde olmayan kategorileri filtrele
  const availableCategories = categories.filter(
    cat => !menuCategories.some(mc => (typeof mc.category === 'string' ? mc.category === cat._id : mc.category._id === cat._id))
  );

  // Menüde olmayan şubeleri filtrele
  const availableBranches = branches.filter(
    branch => !menuBranches.some(mb => (typeof mb.branch === 'string' ? mb.branch === branch._id : mb.branch._id === branch._id))
  );

  return (
    <div className="space-y-6">
      {/* Menü Başlığı */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{menu.name}</h1>
          <p className="text-gray-600">{menu.description}</p>
          <p className="text-sm text-gray-500">
            Şirket: {menu.company ? (typeof menu.company === 'string' ? menu.company : menu.company.name) : '-'}
          </p>
        </div>
        <Button onClick={() => navigate('/menus')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kategoriler ({menuCategories.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ürünler ({menuProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'branches'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Şubeler ({menuBranches.length})
          </button>
          <button
            onClick={() => setActiveTab('kitchens')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'kitchens'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mutfaklar
          </button>
        </nav>
      </div>

      {/* Kategoriler Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Menü Kategorileri</h2>
            <Button
              onClick={() => setShowAddCategory(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Kategori Ekle
            </Button>
          </div>

          {/* Kategori Ekleme Formu */}
          {showAddCategory && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">Kategori Ekle</h3>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <Select
                    label="Ana Kategori (Opsiyonel)"
                    value={selectedParentCategory}
                    onChange={(e) => setSelectedParentCategory(e.target.value)}
                    options={hierarchicalCategories.map(mc => {
                      const depth = mc.depth || 0;
                      const prefix = depth > 0 ? '  '.repeat(depth) + '└─ ' : '';
                      const label = mc.category ? (typeof mc.category === 'string' ? mc.category : mc.category.name) : '-';
                      return {
                        value: mc._id,
                        label: prefix + label
                      };
                    })}
                    placeholder="Ana Kategori Seçin (Boş bırakılabilir)"
                  />
                  <Select
                    label="Kategori"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    options={availableCategories.map(cat => ({
                      value: cat._id,
                      label: cat.name
                    }))}
                    placeholder="Kategori Seçin"
                    required
                  />
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddCategory(false);
                        setSelectedCategory('');
                        setSelectedParentCategory('');
                      }}
                    >
                      İptal
                    </Button>
                    <Button type="submit" loading={addCategoryMutation.isPending}>
                      Ekle
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Kategoriler Tablosu */}
          <Card>
            <CardContent>
              <Table
                data={hierarchicalCategories}
                columns={[
                  {
                    key: 'category',
                    title: 'Kategori',
                    render: (_value: any, mc: any) => {
                      const depth = mc.depth || 0;
                      const indent = depth * 24; // Her seviye için 24px girinti
                      const categoryName = mc.category ? (typeof mc.category === 'string' ? mc.category : mc.category.name) : '-';
                      
                      return (
                        <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
                          {depth > 0 && (
                            <span className="text-gray-400 mr-2">
                              └─
                            </span>
                          )}
                          <span className={depth > 0 ? 'text-gray-600' : 'font-medium'}>
                            {categoryName}
                          </span>
                        </div>
                      );
                    }
                  },
                  {
                    key: 'parent',
                    title: 'Ana Kategori',
                    render: (_value: any, mc: any) => {
                      if (!mc.parent) return '-';
                      return (
                        <span className="text-sm text-gray-600">
                          {typeof mc.parent === 'string' ? mc.parent : mc.parent.category?.name || '-'}
                        </span>
                      );
                    }
                  },
                  {
                    key: 'order',
                    title: 'Sıra',
                    render: (_value: any, mc: any) => mc.order || '-'
                  },
                  {
                    key: 'isActive',
                    title: 'Durum',
                    render: (_value: any, mc: any) => {
                      // Kategori objesinin isActive durumunu göster
                      const categoryActive = mc.category && typeof mc.category !== 'string' 
                        ? mc.category.isActive 
                        : true;
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          categoryActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {categoryActive ? 'Aktif' : 'Pasif'}
                        </span>
                      );
                    }
                  },
                  {
                    key: 'actions',
                    title: 'İşlemler',
                    render: (_value: any, mc: any) => (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => removeCategoryMutation.mutate({ menuId: id!, categoryId: mc.category._id })}
                          disabled={removeCategoryMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  }
                ]}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ürünler Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Menü Ürünleri</h2>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowAddProduct(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ürün Ekle
              </Button>
            </div>
          </div>

          {/* Ürün Ekleme Formu */}
          {showAddProduct && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">Ürün Ekle</h3>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <Select
                    label="Kategori"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedProduct(''); // Kategori değişince ürünü sıfırla
                    }}
                    options={menuCategories.map(mc => ({
                      value: mc.category ? (typeof mc.category === 'string' ? mc.category : mc.category._id) : '',
                      label: mc.category ? (typeof mc.category === 'string' ? mc.category : mc.category.name) : '-'
                    }))}
                    placeholder="Önce Kategori Seçin"
                    required
                  />
                  
                  {selectedCategory && availableProducts.length === 0 && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                      ℹ️ Bu kategoriye eklenebilecek ürün kalmadı.
                    </div>
                  )}
                  
                  {selectedCategory && availableProducts.length > 0 && (
                    <Select
                      label="Ürün"
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      options={availableProducts.map(prod => ({
                        value: prod._id,
                        label: prod.name
                      }))}
                      placeholder="Ürün Seçin"
                      required
                    />
                  )}
                  
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddProduct(false);
                        setSelectedCategory('');
                        setSelectedProduct('');
                      }}
                    >
                      İptal
                    </Button>
                    <Button 
                      type="submit" 
                      loading={addProductMutation.isPending}
                      disabled={!selectedCategory || !selectedProduct}
                    >
                      Ekle
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Ürünler Tablosu */}
          <Card>
            <CardContent>
              <Table
                data={menuProducts}
                columns={[
                  {
                    key: 'category',
                    title: 'Kategori',
                    render: (_value: any, mp: any) => {
                      const categoryName = mp.category ? (typeof mp.category === 'string' ? mp.category : mp.category.name) : '-';
                      return (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {categoryName}
                        </span>
                      );
                    }
                  },
                  {
                    key: 'product',
                    title: 'Ürün',
                    render: (_value: any, mp: any) => {
                      const productName = mp.product ? (typeof mp.product === 'string' ? mp.product : mp.product.name) : '-';
                      const productDescription = mp.product && typeof mp.product !== 'string' ? mp.product.description : null;
                      return (
                        <div>
                          <div className="font-medium text-gray-900">{productName}</div>
                          {productDescription && (
                            <div className="text-sm text-gray-500">{productDescription}</div>
                          )}
                        </div>
                      );
                    }
                  },
                  {
                    key: 'order',
                    title: 'Sıra',
                    render: (_value: any, mp: any) => (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {mp.order}
                      </span>
                    )
                  },
                  {
                    key: 'isActive',
                    title: 'Durum',
                    render: (_value: any, mp: any) => {
                      // Ürün objesinin isActive durumunu göster
                      const productActive = mp.product && typeof mp.product !== 'string' 
                        ? mp.product.isActive 
                        : true;
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          productActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {productActive ? 'Aktif' : 'Pasif'}
                        </span>
                      );
                    }
                  },
                  {
                    key: 'actions',
                    title: 'İşlemler',
                    render: (_value: any, mp: any) => {
                      const productId = mp.product ? (typeof mp.product === 'string' ? mp.product : mp.product._id) : null;
                      const categoryId = mp.category ? (typeof mp.category === 'string' ? mp.category : mp.category._id) : null;
                      
                      return (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (productId && categoryId) {
                              removeProductMutation.mutate({ 
                                menuId: id!, 
                                categoryId, 
                                productId 
                              });
                            }
                          }}
                          disabled={removeProductMutation.isPending || !productId || !categoryId}
                          title="Ürünü Çıkar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      );
                    }
                  }
                ]}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Şubeler Tab */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Menü Şubeleri</h2>
            <Button
              onClick={() => setShowAssignBranch(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Şubeye Ata
            </Button>
          </div>

          {/* Şube Atama Formu */}
          {showAssignBranch && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">Şubeye Menü Ata</h3>
                <form onSubmit={handleAssignBranch} className="space-y-4">
                  <Select
                    label="Şube"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    options={availableBranches.map(branch => ({
                      value: branch._id,
                      label: branch.name
                    }))}
                    placeholder="Menü Atanacak Şube Seçin"
                    required
                  />
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAssignBranch(false);
                        setSelectedBranch('');
                      }}
                    >
                      İptal
                    </Button>
                    <Button type="submit" loading={assignBranchMutation.isPending}>
                      Ata
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Şubeler Tablosu */}
          <Card>
            <CardContent>
              <Table
                data={menuBranches}
                columns={[
                  {
                    key: 'branch',
                    title: 'Şube',
                    render: (_value: any, mb: any) => {
                      return mb.branch ? (typeof mb.branch === 'string' ? mb.branch : mb.branch.name) : '-';
                    }
                  },
                  {
                    key: 'isActive',
                    title: 'Durum',
                    render: (_value: any, mb: any) => mb.isActive ? 'Aktif' : 'Pasif'
                  },
                  {
                    key: 'actions',
                    title: 'İşlemler',
                    render: (_value: any, mb: any) => (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => unassignBranchMutation.mutate({ menuId: id!, branchId: mb.branch._id })}
                          disabled={unassignBranchMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  }
                ]}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mutfaklar Tab */}
      {activeTab === 'kitchens' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Mutfak Yönetimi</h2>
          </div>

          {/* Ürün-Mutfak Atama Formu Modal */}
          {showAssignProductToKitchen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-4">Ürün Ekle: {kitchens.find(k => k._id === selectedKitchen)?.name}</h3>
                  <form onSubmit={handleAssignProductToKitchen} className="space-y-4">
                    {/* Kategori Seçimi */}
                    <div>
                      <Select
                        label="Kategori Seç (Opsiyonel)"
                        value={selectedCategoryForKitchen}
                        onChange={(e) => {
                          setSelectedCategoryForKitchen(e.target.value);
                          // Kategori değiştiğinde seçili ürünleri temizle
                          setSelectedProducts([]);
                        }}
                        options={[
                          { value: '', label: 'Tüm Ürünler' },
                          ...menuCategories.map(mc => {
                            const catId = mc.category ? (typeof mc.category === 'string' ? mc.category : mc.category._id) : '';
                            const catName = mc.category ? (typeof mc.category === 'string' ? mc.category : mc.category.name) : '-';
                            return {
                              value: catId,
                              label: catName
                            };
                          })
                        ]}
                      />
                      {selectedCategoryForKitchen && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            // Seçili kategoriye ve tüm alt kategorilerine ait ürünleri seç
                            const allSubCategoryIds = getAllSubCategories(selectedCategoryForKitchen);
                            const categoryProducts = menuProducts
                              .filter(mp => {
                                const catId = mp.category ? (typeof mp.category === 'string' ? mp.category : mp.category._id) : '';
                                return allSubCategoryIds.includes(catId);
                              })
                              .map(mp => mp.product ? (typeof mp.product === 'string' ? mp.product : mp.product._id) : '')
                              .filter(id => id !== '');
                            setSelectedProducts(categoryProducts);
                          }}
                        >
                          Bu Kategorideki Tüm Ürünleri Seç ({menuProducts.filter(mp => {
                            const catId = mp.category ? (typeof mp.category === 'string' ? mp.category : mp.category._id) : '';
                            const allSubCategoryIds = getAllSubCategories(selectedCategoryForKitchen);
                            return allSubCategoryIds.includes(catId);
                          }).length} ürün)
                        </Button>
                      )}
                    </div>

                    {/* Ürün Seçimi - Multi Select */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ürünler ({selectedProducts.length} seçili)
                      </label>
                      <div className="border rounded-lg max-h-96 overflow-y-auto">
                        {(selectedCategoryForKitchen 
                          ? menuProducts.filter(mp => {
                              const catId = mp.category ? (typeof mp.category === 'string' ? mp.category : mp.category._id) : '';
                              const allSubCategoryIds = getAllSubCategories(selectedCategoryForKitchen);
                              return allSubCategoryIds.includes(catId);
                            })
                          : menuProducts
                        ).map((mp) => {
                          const productId = mp.product ? (typeof mp.product === 'string' ? mp.product : mp.product._id) : '';
                          const productName = mp.product ? (typeof mp.product === 'string' ? mp.product : mp.product.name) : '-';
                          const categoryName = mp.category ? (typeof mp.category === 'string' ? mp.category : mp.category.name) : '-';
                          
                          return (
                            <div
                              key={productId}
                              className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b last:border-b-0"
                            >
                              <input
                                type="checkbox"
                                id={`product-${productId}`}
                                checked={selectedProducts.includes(productId)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProducts([...selectedProducts, productId]);
                                  } else {
                                    setSelectedProducts(selectedProducts.filter(id => id !== productId));
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`product-${productId}`} className="flex-1 cursor-pointer">
                                <div className="text-sm font-medium text-gray-900">{productName}</div>
                                <div className="text-xs text-gray-500">Kategori: {categoryName}</div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <div className="text-sm text-gray-600">
                        {selectedProducts.length > 0 && (
                          <span className="font-medium">{selectedProducts.length} ürün eklenecek</span>
                        )}
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAssignProductToKitchen(false);
                            setSelectedProduct('');
                            setSelectedProducts([]);
                            setSelectedCategoryForKitchen('');
                            setSelectedKitchen('');
                          }}
                        >
                          İptal
                        </Button>
                        <Button 
                          type="submit" 
                          loading={isAssigningProducts}
                          disabled={selectedProducts.length === 0}
                        >
                          Ürünleri Ekle
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Mutfak Detay Modal */}
          {showKitchenDetail && selectedKitchen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Mutfak: {kitchens.find(k => k._id === selectedKitchen)?.name}</h3>
                    <button
                      onClick={() => {
                        setShowKitchenDetail(false);
                        setSelectedKitchen('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <h4 className="text-md font-medium mb-3">Atanmış Ürünler</h4>
                  {kitchenProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Bu mutfakta henüz ürün bulunmuyor.
                    </div>
                  ) : (
                    <Table
                      data={kitchenProducts}
                      columns={[
                        {
                          key: 'product',
                          title: 'Ürün',
                          render: (_value: any, item: any) => {
                            return item.product ? (typeof item.product === 'string' ? item.product : item.product.name) : '-';
                          }
                        },
                        {
                          key: 'actions',
                          title: 'İşlemler',
                          render: (_value: any, item: any) => {
                            const productId = item.product ? (typeof item.product === 'string' ? item.product : item.product._id) : null;
                            return (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                  if (productId && selectedKitchen && selectedBranchTab) {
                                    if (window.confirm('Bu ürünü mutfaktan kaldırmak istediğinizden emin misiniz?')) {
                                      removeProductFromKitchenMutation.mutate({ 
                                        productId, 
                                        kitchenId: selectedKitchen, 
                                        branchId: selectedBranchTab 
                                      });
                                    }
                                  }
                                }}
                                disabled={removeProductFromKitchenMutation.isPending || !productId}
                                title="Ürünü Kaldır"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            );
                          }
                        }
                      ]}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Şubeler ve Mutfaklar */}
          {menuBranches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Bu menüde henüz şube bulunmuyor. Önce "Şubeler" sekmesinden şube ekleyin.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Şube Tabları */}
              <div className="border-b border-gray-200">
                <div className="flex space-x-8 overflow-x-auto">
                  {menuBranches.map((mb) => {
                    const branchId = mb.branch ? (typeof mb.branch === 'string' ? mb.branch : mb.branch._id) : '';
                    const branchName = mb.branch ? (typeof mb.branch === 'string' ? mb.branch : mb.branch.name) : '-';
                    return (
                      <button
                        key={branchId}
                        onClick={() => setSelectedBranchTab(branchId)}
                        className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                          selectedBranchTab === branchId
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {branchName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mutfak Kartları */}
              <div className="mt-6">
                {kitchens.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      Bu şubede henüz mutfak bulunmuyor.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kitchens.map((kitchen) => (
                      <div
                        key={kitchen._id}
                        className="group relative border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
                      >
                        <h3 className="text-lg font-semibold mb-2">{kitchen.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Şube: {kitchen.branch ? (typeof kitchen.branch === 'string' ? kitchen.branch : kitchen.branch.name) : '-'}
                        </p>
                        
                        {/* Hover Butonları */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedKitchen(kitchen._id);
                              setShowKitchenDetail(true);
                            }}
                            title="Mutfağı Görüntüle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedKitchen(kitchen._id);
                              setSelectedBranch(selectedBranchTab);
                              setShowAssignProductToKitchen(true);
                            }}
                            title="Ürün Ekle"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              if (window.confirm(`${kitchen.name} mutfağını silmek istediğinizden emin misiniz?`)) {
                                deleteKitchenMutation.mutate(kitchen._id);
                              }
                            }}
                            disabled={deleteKitchenMutation.isPending}
                            title="Mutfağı Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};