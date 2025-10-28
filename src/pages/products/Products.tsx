import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryProductApi } from '../../api/categoryProduct';
import { companyBranchApi } from '../../api/companyBranch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import type { Product, CreateProductRequest, ProductPrice, BranchSalesMethod } from '../../types';

export const Products: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productPrices, setProductPrices] = useState<ProductPrice[]>([]);
  const [branchSalesMethods, setBranchSalesMethods] = useState<BranchSalesMethod[]>([]);
  const [editingSalesMethodId, setEditingSalesMethodId] = useState<string>('');
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const [editingPriceId, setEditingPriceId] = useState<string>('');
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    category: '',
    kitchen: '',
    defaultSalesMethod: '',
    branch: '',
    company: '',
  });

  const queryClient = useQueryClient();

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => categoryProductApi.getProducts(),
  });


  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryProductApi.getCategories(),
  });

  const { data: kitchensData, isLoading: kitchensLoading } = useQuery({
    queryKey: ['kitchens'],
    queryFn: () => categoryProductApi.getKitchens(),
  });

  const { data: salesMethodsData, isLoading: salesMethodsLoading } = useQuery({
    queryKey: ['sales-methods'],
    queryFn: () => categoryProductApi.getSalesMethods(),
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyBranchApi.getCompanies(),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => companyBranchApi.getBranches(),
  });

  const createMutation = useMutation({
    mutationFn: categoryProductApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', category: '', kitchen: '', defaultSalesMethod: '', branch: '', company: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductRequest> }) =>
      categoryProductApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      setFormData({ name: '', category: '', kitchen: '', defaultSalesMethod: '', branch: '', company: '' });
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

  const handleEdit = (e: React.FormEvent) => {
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

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category || '',
      kitchen: product.kitchen || '',
      defaultSalesMethod: product.defaultSalesMethod || '',
      branch: product.branch || '',
      company: product.company || '',
    });
    setIsEditModalOpen(true);
  };

  const openPriceModal = async (product: Product) => {
    setSelectedProduct(product);
    setIsPriceModalOpen(true);
    
    try {
      // Ürünün fiyatlarını yükle
      const pricesResponse = await categoryProductApi.getProductPrices(product._id);
      setProductPrices(pricesResponse.prices);
      
      // Tüm satış yöntemlerini yükle (basit yaklaşım)
      const allSalesMethodsResponse = await categoryProductApi.getSalesMethods();
      const formattedSalesMethods = allSalesMethodsResponse.methods.map((method: any) => ({
        _id: `temp_${method._id}`,
        branch: 'all',
        salesMethod: method,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      setBranchSalesMethods(formattedSalesMethods);
      
      // Mevcut fiyatları input'lara yükle
      const priceMap: { [key: string]: number } = {};
      pricesResponse.prices.forEach(price => {
        const salesMethodId = typeof price.salesMethod === 'string' ? price.salesMethod : price.salesMethod._id;
        priceMap[salesMethodId] = price.price;
      });
      setPriceInputs(priceMap);
    } catch (error) {
      console.error('Failed to load price data:', error);
    }
  };

  const handleEditPrice = (salesMethodId: string, currentPrice: number) => {
    setEditingSalesMethodId(salesMethodId);
    setEditingPrice(currentPrice);
    
    // Mevcut fiyat ID'sini bul
    const existingPrice = productPrices.find(p => {
      const pSalesMethodId = typeof p.salesMethod === 'string' ? p.salesMethod : p.salesMethod._id;
      return pSalesMethodId === salesMethodId;
    });
    
    setEditingPriceId(existingPrice?._id || '');
    setIsEditPriceModalOpen(true);
  };

  const handleSavePrice = async () => {
    if (!selectedProduct || !editingSalesMethodId) return;
    
    try {
      if (editingPriceId) {
        // Mevcut fiyatı güncelle
        await categoryProductApi.updateProductPrice(editingPriceId, { price: editingPrice });
      } else {
        // Yeni fiyat oluştur
        await categoryProductApi.createProductPrice(selectedProduct._id, {
          salesMethod: editingSalesMethodId,
          price: editingPrice
        });
      }
      
      // Modal'ları kapat ve verileri yenile
      setIsEditPriceModalOpen(false);
      setIsPriceModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Fiyat modal'ını yeniden aç
      setTimeout(() => {
        openPriceModal(selectedProduct);
      }, 100);
    } catch (error) {
      console.error('Failed to save price:', error);
    }
  };

  const columns = [
    { key: 'name' as keyof Product, title: 'Ad' },
    { 
      key: 'category' as keyof Product, 
      title: 'Kategori',
      render: (value: any) => typeof value === 'object' ? value?.name || 'N/A' : value || 'N/A'
    },
    { 
      key: 'kitchen' as keyof Product, 
      title: 'Mutfak',
      render: (value: any) => typeof value === 'object' ? value?.name || 'N/A' : value || 'N/A'
    },
    { 
      key: 'defaultSalesMethod' as keyof Product, 
      title: 'Satış Yöntemi',
      render: (value: any) => typeof value === 'object' ? value?.name || 'N/A' : value || 'N/A'
    },
    {
      key: 'createdAt' as keyof Product,
      title: 'Oluşturulma',
      render: (value: string) => new Date(value).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions' as keyof Product,
      title: 'İşlemler',
      render: (_: any, item: Product) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openPriceModal(item)}
            title="Fiyatları Düzenle"
          >
            <DollarSign className="h-4 w-4" />
          </Button>
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

  if (productsLoading || categoriesLoading || kitchensLoading || salesMethodsLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ürün bilgilerini yönetin
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Ürün
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table
            data={productsData?.products || []}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Ürün</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Ürün Adı"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kategori</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Kategori Seçin</option>
                    {categoriesData?.categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mutfak</label>
                  <select
                    name="kitchen"
                    value={formData.kitchen}
                    onChange={(e) => setFormData({ ...formData, kitchen: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Mutfak Seçin</option>
                    {kitchensData?.kitchens.map((kitchen) => (
                      <option key={kitchen._id} value={kitchen._id}>
                        {kitchen.name}
                      </option>
                    ))}
                  </select>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ürün Düzenle</h3>
              <form onSubmit={handleEdit} className="space-y-4">
                <Input
                  label="Ürün Adı"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kategori</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Kategori Seçin</option>
                    {categoriesData?.categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mutfak</label>
                  <select
                    name="kitchen"
                    value={formData.kitchen}
                    onChange={(e) => setFormData({ ...formData, kitchen: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Mutfak Seçin</option>
                    {kitchensData?.kitchens.map((kitchen) => (
                      <option key={kitchen._id} value={kitchen._id}>
                        {kitchen.name}
                      </option>
                    ))}
                  </select>
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

      {/* Price Modal */}
      {isPriceModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedProduct.name} - Fiyat Yönetimi
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setIsPriceModalOpen(false)}
                >
                  Kapat
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-800">
                    Bu ürün için satış yöntemlerine göre fiyat belirleyebilirsiniz. 
                    Her satış yöntemi için farklı fiyatlar tanımlayabilirsiniz.
                  </p>
                </div>
                
                {branchSalesMethods.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-700">Satış Yöntemleri ve Fiyatlar</h4>
                    
                    {/* Tablo Formatında Fiyat Listesi */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Satış Yöntemi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fiyat
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {branchSalesMethods.map((branchSalesMethod) => {
                            const salesMethod = branchSalesMethod.salesMethod;
                            const salesMethodId = typeof salesMethod === 'string' ? salesMethod : salesMethod._id;
                            const salesMethodName = typeof salesMethod === 'string' ? salesMethod : salesMethod.name;
                            
                            // Bu satış yöntemi için mevcut fiyat var mı kontrol et
                            const existingPrice = productPrices.find(p => {
                              const pSalesMethodId = typeof p.salesMethod === 'string' ? p.salesMethod : p.salesMethod._id;
                              return pSalesMethodId === salesMethodId;
                            });
                            
                            return (
                              <tr key={salesMethodId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{salesMethodName}</div>
                                      <div className="text-sm text-gray-500">Satış Yöntemi</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {existingPrice ? (
                                    <div className="text-sm text-gray-900">
                                      {existingPrice.price} TL
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-500">
                                      Fiyat belirlenmemiş
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditPrice(salesMethodId, existingPrice?.price || 0)}
                                  >
                                    {existingPrice ? 'Düzenle' : 'Fiyat Ekle'}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Bu şubeye henüz satış yöntemi atanmamış.</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsPriceModalOpen(false)}
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {isEditPriceModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Fiyat Düzenle
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiyat (TL)
                  </label>
                  <Input
                    type="number"
                    value={editingPrice}
                    onChange={(e) => setEditingPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Fiyat giriniz"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditPriceModalOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleSavePrice}
                    disabled={editingPrice <= 0}
                  >
                    {editingPriceId ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
