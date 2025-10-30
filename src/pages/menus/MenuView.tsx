import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { menuApi } from '../../api/menu';
import { categoryProductApi } from '../../api/categoryProduct';
import { ArrowLeft } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  const menu = menuData?.menu;
  const menuCategories = menuCategoriesData?.menuCategories || [];
  const menuProducts = menuProductsData?.menuProducts || [];


  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Menü bulunamadı</p>
          <button
            onClick={() => navigate('/menus')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">{menu.name}</h1>
            <button
              onClick={() => navigate(`/menus/${id}`)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Geri</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Kategoriler Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sticky top-24">
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCategoryId === null
                      ? 'bg-gray-900 dark:bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Tümü
                </button>
                {activeCategories.map((mc) => {
                  const category = mc.category as Category;
                  if (!category) return null;
                  
                  const depth = mc.depth || 0;
                  const isSelected = selectedCategoryId === category._id;
                  const isParent = depth === 0;
                  
                  return (
                    <button
                      key={mc._id}
                      onClick={() => setSelectedCategoryId(category._id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        isSelected
                          ? 'bg-gray-900 dark:bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${isParent ? 'font-semibold' : 'font-normal'}`}
                      style={{ paddingLeft: `${0.75 + depth * 1}rem` }}
                    >
                      {depth > 0 && '└─ '}
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ürünler Liste */}
          <div className="lg:col-span-4">
            {selectedCategoryId === null ? (
              // Tüm ürünler (kategori gruplaması olmadan)
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="text-center py-10 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <h3 className="text-4xl font-light text-gray-800 dark:text-white tracking-widest mb-2">
                    Tüm Ürünler
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-light">Menümüzdeki tüm ürünler</p>
                </div>
                {getAllProducts().length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500 dark:text-gray-400">Bu menüde henüz ürün bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {getAllProducts().map((mp) => {
                      const product = mp.product as Product;
                      if (!product) return null;
                      
                      return (
                        <div key={mp._id} className="px-8 py-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                {product.name || 'İsimsiz Ürün'}
                              </h4>
                              {product.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {product.description}
                                </p>
                              )}
                            </div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white ml-4 whitespace-nowrap">
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
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="text-center py-10 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <h3 className="text-4xl font-light text-gray-800 dark:text-white tracking-widest mb-2">
                    {(() => {
                      const selectedMc = activeCategories.find(mc => {
                        const cat = mc.category as Category;
                        return cat && cat._id === selectedCategoryId;
                      });
                      return selectedMc ? (selectedMc.category as Category).name : '';
                    })()}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-light">Özenle seçilmiş ürünler</p>
                </div>
                {getProductsForCategory(selectedCategoryId).length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500 dark:text-gray-400">Bu kategoride henüz ürün bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {getProductsForCategory(selectedCategoryId).map((mp) => {
                      const product = mp.product as Product;
                      if (!product) return null;
                      
                      return (
                        <div key={mp._id} className="px-8 py-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                {product.name || 'İsimsiz Ürün'}
                              </h4>
                              {product.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {product.description}
                                </p>
                              )}
                            </div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white ml-4 whitespace-nowrap">
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

