import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { menuApi } from '../../api/menu';
import { categoryProductApi } from '../../api/categoryProduct';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { MenuCategory, MenuProduct, Category, Product } from '../../types';

export const MenuView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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

  // Tüm ürünlerin fiyatlarını çek
  const productIds = menuProductsData?.menuProducts?.map(mp => 
    typeof mp.product === 'string' ? mp.product : mp.product._id
  ) || [];
  
  const { data: allProductPrices } = useQuery({
    queryKey: ['menu-product-prices', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return {};
      const pricesMap: Record<string, any[]> = {};
      
      await Promise.all(
        productIds.map(async (productId) => {
          try {
            const result = await categoryProductApi.getProductPrices(productId);
            pricesMap[productId] = result.prices || [];
          } catch (error) {
            console.error(`Fiyat alınamadı (${productId}):`, error);
            pricesMap[productId] = [];
          }
        })
      );
      
      return pricesMap;
    },
    enabled: productIds.length > 0,
  });

  if (menuLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const menu = menuData?.menu;
  const menuCategories = menuCategoriesData?.menuCategories || [];
  const menuProducts = menuProductsData?.menuProducts || [];


  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Menü bulunamadı</p>
          <button
            onClick={() => navigate('/menus')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Menülere Dön
          </button>
        </div>
      </div>
    );
  }

  // Hiyerarşik kategori yapısını oluştur
  const sortCategoriesHierarchically = (categories: MenuCategory[]): MenuCategory[] => {
    const result: MenuCategory[] = [];
    const categoryMap = new Map<string, MenuCategory>();
    
    categories.forEach(cat => categoryMap.set(cat._id, { ...cat, depth: 0 }));
    
    const findDepth = (cat: MenuCategory, depth = 0): number => {
      if (!cat.parent) return depth;
      const parentCat = categoryMap.get(typeof cat.parent === 'string' ? cat.parent : cat.parent._id);
      if (!parentCat) return depth;
      return findDepth(parentCat, depth + 1);
    };
    
    categories.forEach(cat => {
      const categoryCopy = categoryMap.get(cat._id);
      if (categoryCopy) {
        categoryCopy.depth = findDepth(cat);
      }
    });
    
    const addCategory = (cat: MenuCategory) => {
      result.push(cat);
      const children = categories.filter(c => {
        const parentId = c.parent ? (typeof c.parent === 'string' ? c.parent : c.parent._id) : null;
        return parentId === cat._id;
      }).sort((a, b) => {
        const nameA = a.category ? (typeof a.category === 'string' ? a.category : a.category.name) : '';
        const nameB = b.category ? (typeof b.category === 'string' ? b.category : b.category.name) : '';
        return nameA.localeCompare(nameB, 'tr');
      });
      
      children.forEach(child => addCategory(child));
    };
    
    const rootCategories = categories.filter(cat => !cat.parent).sort((a, b) => {
      const nameA = a.category ? (typeof a.category === 'string' ? a.category : a.category.name) : '';
      const nameB = b.category ? (typeof b.category === 'string' ? b.category : b.category.name) : '';
      return nameA.localeCompare(nameB, 'tr');
    });
    
    rootCategories.forEach(cat => addCategory(cat));
    
    return result;
  };

  const hierarchicalCategories = sortCategoriesHierarchically(menuCategories);

  // Aktif kategorileri filtrele
  const activeCategories = hierarchicalCategories.filter(mc => {
    const category = mc.category as Category;
    return category && category.isActive;
  });

  // Seçili kategorinin ürünlerini getir (alt kategoriler dahil)
  const getProductsForCategory = (selectedCategoryId: string): MenuProduct[] => {
    return menuProducts.filter(mp => {
      // Product populate kontrolü
      if (typeof mp.product === 'string') return false;
      const product = mp.product as Product;
      if (!product || !product.isActive) return false;
      
      // Category ID'sini al (MenuProduct'tan)
      const productCategoryId = mp.category ? (typeof mp.category === 'string' ? mp.category : mp.category._id) : '';
      if (!productCategoryId) return false;
      
      // Bu ürünün kategorisini MenuCategories içinde bul
      const menuCategory = menuCategories.find(mc => {
        const cat = mc.category as Category;
        return cat && cat._id === productCategoryId;
      });
      
      if (!menuCategory) return false;
      
      // Category objesini al
      const categoryOfProduct = menuCategory.category as Category;
      if (!categoryOfProduct) return false;
      
      // Doğrudan eşleşme
      if (categoryOfProduct._id === selectedCategoryId) return true;
      
      // Alt kategori mi kontrol et (parent zincirinde seçili kategori var mı?)
      const isChildOfSelected = (mc: MenuCategory): boolean => {
        if (!mc.parent) return false;
        const parentId = typeof mc.parent === 'string' ? mc.parent : mc.parent._id;
        const parentMenuCategory = menuCategories.find(pmc => pmc._id === parentId);
        if (!parentMenuCategory) return false;
        
        const parentCategory = parentMenuCategory.category as Category;
        if (!parentCategory) return false;
        
        if (parentCategory._id === selectedCategoryId) return true;
        return isChildOfSelected(parentMenuCategory);
      };
      
      return isChildOfSelected(menuCategory);
    });
  };

  // Tüm ürünleri al
  const getAllProducts = (): MenuProduct[] => {
    return menuProducts.filter(mp => {
      if (typeof mp.product === 'string') return false;
      const product = mp.product as Product;
      return product && product.isActive;
    });
  };

  // Ürünün varsayılan fiyatını getir
  const getProductPrice = (productId: string): string => {
    if (!allProductPrices || !allProductPrices[productId]) {
      return '--';
    }
    
    const prices = allProductPrices[productId];
    if (prices.length === 0) return '--';
    
    // İlk fiyatı al (varsayılan olarak)
    const firstPrice = prices[0];
    if (firstPrice && firstPrice.price) {
      const currencyName = typeof firstPrice.currencyUnit === 'string' 
        ? firstPrice.currencyUnit 
        : firstPrice.currencyUnit?.name || '₺';
      return `${firstPrice.price} ${currencyName}`;
    }
    
    return '--';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{menu.name}</h1>
              {menu.description && (
                <p className="text-gray-600 mt-1">{menu.description}</p>
              )}
            </div>
            <button
              onClick={() => navigate(`/menus/${id}`)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Geri</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Kategoriler Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-28">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Kategoriler</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedCategoryId === null
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-slate-50 text-gray-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-medium">Tümü</div>
                </button>
                {activeCategories.map((mc) => {
                  const category = mc.category as Category;
                  if (!category) return null;
                  
                  const depth = mc.depth || 0;
                  const isSelected = selectedCategoryId === category._id;
                  
                  return (
                    <button
                      key={mc._id}
                      onClick={() => setSelectedCategoryId(category._id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-slate-50 text-gray-700 hover:bg-slate-100'
                      }`}
                      style={{ paddingLeft: `${1 + depth * 1}rem` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {depth > 0 && '└─ '}
                          {category.name}
                        </span>
                        {!isSelected && <ChevronRight className="h-4 w-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ürünler Grid */}
          <div className="lg:col-span-3">
            {selectedCategoryId === null ? (
              // Tüm ürünler (kategori gruplaması olmadan)
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
                  Tüm Ürünler
                </h3>
                {getAllProducts().length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Bu menüde henüz ürün bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getAllProducts().map((mp) => {
                      const product = mp.product as Product;
                      if (!product) return null;
                      
                      return (
                        <div
                          key={mp._id}
                          className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-5 hover:shadow-lg transition-all border border-slate-200"
                        >
                          <h4 className="text-lg font-bold text-gray-900 mb-2">
                            {product.name || 'İsimsiz Ürün'}
                          </h4>
                          {product.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs text-gray-500">Fiyat</span>
                            <div className="text-xl font-bold text-blue-600">
                              {getProductPrice(product._id)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Seçili kategori ürünleri
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
                  {activeCategories.find(mc => {
                    const cat = mc.category as Category;
                    return cat && cat._id === selectedCategoryId;
                  })?.category && (
                    (activeCategories.find(mc => {
                      const cat = mc.category as Category;
                      return cat && cat._id === selectedCategoryId;
                    })?.category as Category).name
                  )}
                </h3>
                {getProductsForCategory(selectedCategoryId).length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Bu kategoride henüz ürün bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getProductsForCategory(selectedCategoryId).map((mp) => {
                      const product = mp.product as Product;
                      if (!product) return null;
                      
                      return (
                        <div
                          key={mp._id}
                          className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-5 hover:shadow-lg transition-all border border-slate-200"
                        >
                          <h4 className="text-lg font-bold text-gray-900 mb-2">
                            {product.name || 'İsimsiz Ürün'}
                          </h4>
                          {product.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs text-gray-500">Fiyat</span>
                            <div className="text-xl font-bold text-blue-600">
                              {getProductPrice(product._id)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

