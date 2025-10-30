import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryProductApi } from '../../api/categoryProduct';
import { companyBranchApi } from '../../api/companyBranch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import type { Product, CreateProductRequest, ProductPrice, SalesMethod, CurrencyUnit } from '../../types';

export const Products: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productPrices, setProductPrices] = useState<ProductPrice[]>([]);
  const [salesMethods, setSalesMethods] = useState<SalesMethod[]>([]);
  const [currencyUnits, setCurrencyUnits] = useState<CurrencyUnit[]>([]);
  const [editingPriceId, setEditingPriceId] = useState<string>('');
  const [editingSalesMethodId, setEditingSalesMethodId] = useState<string>('');
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const [editingCurrencyUnitId, setEditingCurrencyUnitId] = useState<string>('');
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    defaultSalesMethod: '',
    company: '',
  });
  
  const [initialPrice, setInitialPrice] = useState<string>('');
  const [initialCurrencyUnit, setInitialCurrencyUnit] = useState<string>('');

  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => categoryProductApi.getProducts(),
  });

  const { data: salesMethodsData } = useQuery({
    queryKey: ['sales-methods'],
    queryFn: () => categoryProductApi.getSalesMethods(),
  });

  const { data: currencyUnitsData } = useQuery({
    queryKey: ['currency-units'],
    queryFn: () => categoryProductApi.getCurrencyUnits(),
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyBranchApi.getCompanies(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductRequest> }) =>
      categoryProductApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      setFormData({ name: '', description: '', defaultSalesMethod: '', company: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryProductApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoryProductApi.updateProduct(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleToggleActive = (product: Product) => {
    toggleActiveMutation.mutate({
      id: product._id,
      isActive: !product.isActive,
    });
  };

  // "Şube Satış" metodunu ve TL'yi varsayılan olarak ayarla
  React.useEffect(() => {
    if (salesMethodsData?.methods && !formData.defaultSalesMethod && isCreateModalOpen) {
      const subeSatis = salesMethodsData.methods.find((m: SalesMethod) => m.name === 'Şube Satış');
      if (subeSatis) {
        setFormData(prev => ({ ...prev, defaultSalesMethod: subeSatis._id }));
      }
    }
  }, [salesMethodsData, isCreateModalOpen, formData.defaultSalesMethod]);

  React.useEffect(() => {
    if (currencyUnitsData?.units && !initialCurrencyUnit && isCreateModalOpen) {
      const tl = currencyUnitsData.units.find((cu: CurrencyUnit) => cu.name === 'TL' || cu.name === '₺');
      if (tl) {
        setInitialCurrencyUnit(tl._id);
      }
    }
  }, [currencyUnitsData, isCreateModalOpen, initialCurrencyUnit]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Fiyat kontrolü
    if (!initialPrice || parseFloat(initialPrice) <= 0) {
      alert('Lütfen geçerli bir fiyat girin!');
      return;
    }
    
    if (!initialCurrencyUnit) {
      alert('Lütfen para birimi seçin!');
      return;
    }
    
    try {
      // Önce ürünü oluştur
      const response = await categoryProductApi.createProduct(formData);
      const newProductId = response.product._id;
      
      // Sonra otomatik olarak fiyat ekle
      await categoryProductApi.createProductPrice(newProductId, {
        salesMethod: formData.defaultSalesMethod,
        price: parseFloat(initialPrice),
        currencyUnit: initialCurrencyUnit
      });
      
      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Formu temizle ve kapat
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', defaultSalesMethod: '', company: '' });
      setInitialPrice('');
      setInitialCurrencyUnit('');
    } catch (error) {
      console.error('Ürün oluşturma hatası:', error);
      alert('Ürün oluşturulurken bir hata oluştu!');
    }
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
      company: typeof product.company === 'string' ? product.company : (product.company?._id || ''),
    });
    setIsEditModalOpen(true);
  };

  const openPriceModal = async (product: Product) => {
    setSelectedProduct(product);
    setIsPriceModalOpen(true);
    try {
      const [pricesRes, methodsRes, unitsRes] = await Promise.all([
        categoryProductApi.getProductPrices(product._id),
        categoryProductApi.getSalesMethods(),
        categoryProductApi.getCurrencyUnits(),
      ]);
      setProductPrices(pricesRes.prices);
      setSalesMethods(methodsRes.methods);
      setCurrencyUnits(unitsRes.units);
      setEditingPriceId('');
      setEditingSalesMethodId('');
      setEditingPrice(0);
      setEditingCurrencyUnitId(unitsRes.units?.[0]?._id || '');
    } catch (e) {
      console.error('Fiyat verileri yüklenemedi:', e);
    }
  };

  const handleEditPrice = (salesMethodId: string) => {
    setEditingSalesMethodId(salesMethodId);
    const existing = productPrices.find(p => (typeof p.salesMethod === 'string' ? p.salesMethod : p.salesMethod._id) === salesMethodId);
    if (existing) {
      setEditingPriceId(existing._id);
      setEditingPrice(existing.price);
      setEditingCurrencyUnitId(typeof existing.currencyUnit === 'string' ? existing.currencyUnit : existing.currencyUnit?._id || '');
    } else {
      setEditingPriceId('');
      setEditingPrice(0);
      setEditingCurrencyUnitId(currencyUnitsData?.units?.[0]?._id || '');
    }
  };

  const handleSavePrice = async () => {
    if (!selectedProduct || !editingSalesMethodId || editingPrice <= 0 || !editingCurrencyUnitId) return;
    try {
      if (editingPriceId) {
        // Backend update şeması tutarsız; güvenli yol: mevcut kaydı sil ve yeniden oluştur
        await categoryProductApi.deleteProductPrice(editingPriceId);
      }
      await categoryProductApi.createProductPrice(selectedProduct._id, {
        salesMethod: editingSalesMethodId,
        price: editingPrice,
        currencyUnit: editingCurrencyUnitId,
      });
      // Yeniden yükle
      const pricesRes = await categoryProductApi.getProductPrices(selectedProduct._id);
      setProductPrices(pricesRes.prices);
      // Reset
      setEditingPriceId('');
      setEditingSalesMethodId('');
      setEditingPrice(0);
      setEditingCurrencyUnitId(currencyUnits?.[0]?._id || '');
    } catch (e) {
      console.error('Fiyat kaydedilemedi:', e);
    }
  };

  const products = productsData?.products || [];

  const columns = [
    {
      key: 'name',
      title: 'Ad',
      render: (_value: any, item: Product) => item.name,
    },
    {
      key: 'description',
      title: 'Açıklama',
      render: (_value: any, item: Product) => item.description || '-',
    },
    {
      key: 'defaultSalesMethod',
      title: 'Varsayılan Satış Yöntemi',
      render: (_value: any, item: Product) => {
        if (typeof item.defaultSalesMethod === 'string') {
          return item.defaultSalesMethod;
        }
        return item.defaultSalesMethod?.name || '-';
      },
    },
    {
      key: 'company',
      title: 'Şirket',
      render: (_value: any, item: Product) => {
        if (!item.company) return '-';
        if (typeof item.company === 'string') return item.company;
        return item.company.name || '-';
      },
    },
    {
      key: 'isActive',
      title: 'Durum',
      render: (_value: any, item: Product) => (
        <button
          onClick={() => handleToggleActive(item)}
          disabled={toggleActiveMutation.isPending}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            item.isActive ? 'bg-green-500' : 'bg-gray-300'
          } ${toggleActiveMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={item.isActive ? 'Aktif - Pasif yapmak için tıklayın' : 'Pasif - Aktif yapmak için tıklayın'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              item.isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
          <span className="sr-only">
            {item.isActive ? 'Deaktif et' : 'Aktif et'}
          </span>
        </button>
      ),
    },
    {
      key: 'createdAt',
      title: 'Oluşturulma',
      render: (_value: any, item: Product) => new Date(item.createdAt).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions',
      title: 'İşlemler',
      render: (_value: any, item: Product) => (
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
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ürünler</h1>
          <p className="text-gray-600 dark:text-gray-400">Ürün yönetimi</p>
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
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yeni Ürün Oluştur</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ürün Adı</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şirket</label>
                  <select
                    name="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Varsayılan Satış Yöntemi</label>
                  <select
                    name="defaultSalesMethod"
                    value={formData.defaultSalesMethod}
                    onChange={(e) => setFormData({ ...formData, defaultSalesMethod: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    disabled
                  >
                    <option value="">Satış Yöntemi Seçin</option>
                    {salesMethodsData?.methods.map((method) => (
                      <option key={method._id} value={method._id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Varsayılan olarak "Şube Satış" seçilidir</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Başlangıç Fiyatı *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    name="initialPrice"
                    value={initialPrice}
                    onChange={(e) => setInitialPrice(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ürün oluşturulurken varsayılan satış yöntemi için fiyat girilmesi zorunludur</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Para Birimi</label>
                  <select
                    name="initialCurrencyUnit"
                    value={initialCurrencyUnit}
                    onChange={(e) => setInitialCurrencyUnit(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Para Birimi Seçin</option>
                    {currencyUnitsData?.units.map((unit: CurrencyUnit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name}
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
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ürün Düzenle</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ürün Adı</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şirket</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Varsayılan Satış Yöntemi</label>
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

      {/* Price Modal */}
      {isPriceModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-4/5 max-w-5xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedProduct.name} - Fiyat Yönetimi
                </h3>
                <Button variant="outline" onClick={() => setIsPriceModalOpen(false)}>
                  Kapat
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    Satış yöntemlerine göre fiyat belirleyin. Mevcut fiyatlar listelenir, yeni fiyat ekleyebilir veya düzenleyebilirsiniz.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Satış Yöntemi</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fiyat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Para Birimi</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {salesMethods.map((method) => {
                        const existing = productPrices.find(p => (typeof p.salesMethod === 'string' ? p.salesMethod : p.salesMethod._id) === method._id);
                        return (
                          <tr key={method._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{method.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {existing ? (<span className="text-sm text-gray-900 dark:text-white">{existing.price}</span>) : (<span className="text-sm text-gray-500 dark:text-gray-400">Fiyat yok</span>)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {existing ? (
                                <span className="text-sm text-gray-900 dark:text-white">{typeof existing.currencyUnit === 'string' ? existing.currencyUnit : (existing.currencyUnit?.name || '-')}</span>
                              ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button size="sm" variant="outline" onClick={() => handleEditPrice(method._id)}>
                                {existing ? 'Düzenle' : 'Fiyat Ekle'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Inline editor */}
                {editingSalesMethodId && (
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fiyat</label>
                      <Input
                        type="number"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(parseFloat(e.target.value) || 0)}
                        placeholder="Fiyat giriniz"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Para Birimi</label>
                      <select
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={editingCurrencyUnitId}
                        onChange={(e) => setEditingCurrencyUnitId(e.target.value)}
                        required
                      >
                        {currencyUnits.map((u) => (
                          <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end justify-end space-x-3">
                      <Button variant="outline" onClick={() => { setEditingSalesMethodId(''); setEditingPriceId(''); }}>İptal</Button>
                      <Button onClick={handleSavePrice} disabled={editingPrice <= 0 || !editingCurrencyUnitId}>Kaydet</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};