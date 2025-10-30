import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryProductApi } from '../../api/categoryProduct';
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
  });

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

  const createMutation = useMutation({
    mutationFn: categoryProductApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', defaultSalesMethod: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductRequest> }) =>
      categoryProductApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      setFormData({ name: '', description: '', defaultSalesMethod: '' });
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
      key: 'isActive',
      title: 'Durum',
      render: (_value: any, item: Product) => (item.isActive ? 'Aktif' : 'Pasif'),
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
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-gray-600">Ürün yönetimi</p>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Ürün Oluştur</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ürün Adı</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
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
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ürün Adı</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
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
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-5xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedProduct.name} - Fiyat Yönetimi
                </h3>
                <Button variant="outline" onClick={() => setIsPriceModalOpen(false)}>
                  Kapat
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-800">
                    Satış yöntemlerine göre fiyat belirleyin. Mevcut fiyatlar listelenir, yeni fiyat ekleyebilir veya düzenleyebilirsiniz.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satış Yöntemi</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fiyat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Para Birimi</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesMethods.map((method) => {
                        const existing = productPrices.find(p => (typeof p.salesMethod === 'string' ? p.salesMethod : p.salesMethod._id) === method._id);
                        return (
                          <tr key={method._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{method.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {existing ? (<span className="text-sm text-gray-900">{existing.price}</span>) : (<span className="text-sm text-gray-500">Fiyat yok</span>)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {existing ? (
                                <span className="text-sm text-gray-900">{typeof existing.currencyUnit === 'string' ? existing.currencyUnit : (existing.currencyUnit?.name || '-')}</span>
                              ) : (
                                <span className="text-sm text-gray-500">-</span>
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
                  <div className="mt-4 border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                      <select
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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