import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '../../api/menu';
import { categoryProductApi } from '../../api/categoryProduct';
import { companyBranchApi } from '../../api/companyBranch';
import type { Menu } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

export const MenuDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'branches'>('categories');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAssignBranch, setShowAssignBranch] = useState(false);
  const [showAssignKitchen, setShowAssignKitchen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedKitchen, setSelectedKitchen] = useState<string>('');

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

  // Tüm ürünleri getir
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => categoryProductApi.getProducts(),
  });

  // Tüm şubeleri getir
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => companyBranchApi.getBranches(),
  });

  // Mutfakları getir (şube bazında)
  const { data: kitchensData } = useQuery({
    queryKey: ['kitchens', selectedBranch],
    queryFn: () => companyBranchApi.getKitchens(selectedBranch),
    enabled: !!selectedBranch,
  });

  // Mutasyonlar
  const addCategoryMutation = useMutation({
    mutationFn: ({ menuId, categoryId }: { menuId: string; categoryId: string }) =>
      menuApi.addCategoryToMenu(menuId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories', id] });
      setShowAddCategory(false);
      setSelectedCategory('');
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

  const assignKitchenMutation = useMutation({
    mutationFn: ({ productId, kitchenId, branchId }: { productId: string; kitchenId: string; branchId: string }) =>
      menuApi.assignProductToKitchen(productId, kitchenId, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-products', id] });
      setShowAssignKitchen(false);
      setSelectedProduct('');
      setSelectedBranch('');
      setSelectedKitchen('');
    },
  });


  // Event handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    addCategoryMutation.mutate({ menuId: id!, categoryId: selectedCategory });
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

  const handleAssignKitchen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedBranch || !selectedKitchen) return;
    assignKitchenMutation.mutate({ productId: selectedProduct, kitchenId: selectedKitchen, branchId: selectedBranch });
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
  const products = productsData?.products || [];
  const branches = branchesData?.branches || [];
  const kitchens = kitchensData?.kitchens || [];

  // Menüde olmayan kategorileri filtrele
  const availableCategories = categories.filter(
    cat => !menuCategories.some(mc => (typeof mc.category === 'string' ? mc.category === cat._id : mc.category._id === cat._id))
  );

  // Menüde olmayan ürünleri filtrele
  const availableProducts = products.filter(
    prod => !menuProducts.some(mp => (typeof mp.product === 'string' ? mp.product === prod._id : mp.product._id === prod._id))
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
            Şirket: {typeof menu.company === 'string' ? menu.company : menu.company.name}
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
                data={menuCategories}
                columns={[
                  {
                    key: 'category',
                    title: 'Kategori',
                    render: (_value: any, mc: any) => mc.category.name
                  },
                  {
                    key: 'order',
                    title: 'Sıra',
                    render: (_value: any, mc: any) => mc.order
                  },
                  {
                    key: 'isActive',
                    title: 'Durum',
                    render: (_value: any, mc: any) => mc.isActive ? 'Aktif' : 'Pasif'
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
              <Button
                onClick={() => setShowAssignKitchen(true)}
                variant="secondary"
              >
                Mutfak Ata
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
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    options={menuCategories.map(mc => ({
                      value: typeof mc.category === 'string' ? mc.category : mc.category._id,
                      label: typeof mc.category === 'string' ? mc.category : mc.category.name
                    }))}
                    placeholder="Kategori Seçin"
                    required
                  />
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
                    <Button type="submit" loading={addProductMutation.isPending}>
                      Ekle
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Mutfak Atama Formu */}
          {showAssignKitchen && (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Ürün-Mutfak Atama</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAssignKitchen(false);
                      setSelectedProduct('');
                      setSelectedBranch('');
                      setSelectedKitchen('');
                    }}
                  >
                    ✕
                  </Button>
                </div>
                
                <form onSubmit={handleAssignKitchen} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Select
                        label="Ürün"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        options={menuProducts.map(mp => ({
                          value: typeof mp.product === 'string' ? mp.product : mp.product._id,
                          label: typeof mp.product === 'string' ? mp.product : mp.product.name
                        }))}
                        placeholder="Ürün Seçin"
                        required
                      />
                    </div>
                    <div>
                      <Select
                        label="Şube"
                        value={selectedBranch}
                        onChange={(e) => {
                          setSelectedBranch(e.target.value);
                          setSelectedKitchen('');
                        }}
                        options={menuBranches.map(mb => ({
                          value: typeof mb.branch === 'string' ? mb.branch : mb.branch._id,
                          label: typeof mb.branch === 'string' ? mb.branch : mb.branch.name
                        }))}
                        placeholder="Şube Seçin"
                        required
                      />
                    </div>
                    <div>
                      <Select
                        label="Mutfak"
                        value={selectedKitchen}
                        onChange={(e) => setSelectedKitchen(e.target.value)}
                        options={kitchens.map(kitchen => ({
                          value: kitchen._id,
                          label: kitchen.name
                        }))}
                        placeholder="Mutfak Seçin"
                        required
                        disabled={!selectedBranch}
                      />
                    </div>
                  </div>
                  
                  {selectedBranch && kitchens.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm text-yellow-800">
                        Bu şubede henüz mutfak bulunmuyor. Önce mutfak oluşturun.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAssignKitchen(false);
                        setSelectedProduct('');
                        setSelectedBranch('');
                        setSelectedKitchen('');
                      }}
                    >
                      İptal
                    </Button>
                    <Button 
                      type="submit" 
                      loading={assignKitchenMutation.isPending}
                      disabled={!selectedProduct || !selectedBranch || !selectedKitchen}
                    >
                      Mutfak Ata
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
                    render: (_value: any, mp: any) => (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {mp.category.name}
                      </span>
                    )
                  },
                  {
                    key: 'product',
                    title: 'Ürün',
                    render: (_value: any, mp: any) => (
                      <div>
                        <div className="font-medium text-gray-900">{mp.product.name}</div>
                        {mp.product.description && (
                          <div className="text-sm text-gray-500">{mp.product.description}</div>
                        )}
                      </div>
                    )
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
                    render: (_value: any, mp: any) => (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mp.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {mp.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    )
                  },
                  {
                    key: 'actions',
                    title: 'İşlemler',
                    render: (_value: any, mp: any) => (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(mp.product._id);
                            setShowAssignKitchen(true);
                          }}
                          title="Mutfak Ata"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => removeProductMutation.mutate({ 
                            menuId: id!, 
                            categoryId: mp.category._id, 
                            productId: mp.product._id 
                          })}
                          disabled={removeProductMutation.isPending}
                          title="Ürünü Çıkar"
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

      {/* Şubeler Tab */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Menü Şubeleri</h2>
            <Button
              onClick={() => setShowAssignBranch(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Şube Ata
            </Button>
          </div>

          {/* Şube Atama Formu */}
          {showAssignBranch && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">Şube Ata</h3>
                <form onSubmit={handleAssignBranch} className="space-y-4">
                  <Select
                    label="Şube"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    options={availableBranches.map(branch => ({
                      value: branch._id,
                      label: branch.name
                    }))}
                    placeholder="Şube Seçin"
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
                    render: (_value: any, mb: any) => mb.branch.name
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
    </div>
  );
};