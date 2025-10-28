import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitsApi } from '../../api/units';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2, Ruler, DollarSign, ShoppingCart } from 'lucide-react';
import type { AmountUnit, CurrencyUnit, SalesMethod, CreateAmountUnitRequest, CreateCurrencyUnitRequest, CreateSalesMethodRequest } from '../../types';

export const Units: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'amount' | 'currency' | 'sales'>('amount');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<AmountUnit | CurrencyUnit | SalesMethod | null>(null);
  const [formData, setFormData] = useState<CreateAmountUnitRequest | CreateCurrencyUnitRequest | CreateSalesMethodRequest>({
    name: '',
  });

  const queryClient = useQueryClient();

  const { data: amountUnitsData, isLoading: amountUnitsLoading } = useQuery({
    queryKey: ['amount-units'],
    queryFn: () => unitsApi.getAmountUnits(),
  });

  const { data: currencyUnitsData, isLoading: currencyUnitsLoading } = useQuery({
    queryKey: ['currency-units'],
    queryFn: () => unitsApi.getCurrencyUnits(),
  });

  const { data: salesMethodsData, isLoading: salesMethodsLoading } = useQuery({
    queryKey: ['sales-methods'],
    queryFn: () => unitsApi.getSalesMethods(),
  });

  const createAmountUnitMutation = useMutation({
    mutationFn: unitsApi.createAmountUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amount-units'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '' });
    },
  });

  const createCurrencyUnitMutation = useMutation({
    mutationFn: unitsApi.createCurrencyUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-units'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '' });
    },
  });

  const updateAmountUnitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAmountUnitRequest> }) =>
      unitsApi.updateAmountUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amount-units'] });
      setIsEditModalOpen(false);
      setSelectedUnit(null);
      setFormData({ name: '' });
    },
  });

  const updateCurrencyUnitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCurrencyUnitRequest> }) =>
      unitsApi.updateCurrencyUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-units'] });
      setIsEditModalOpen(false);
      setSelectedUnit(null);
      setFormData({ name: '' });
    },
  });

  const deleteAmountUnitMutation = useMutation({
    mutationFn: unitsApi.deleteAmountUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amount-units'] });
    },
  });

  const deleteCurrencyUnitMutation = useMutation({
    mutationFn: unitsApi.deleteCurrencyUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-units'] });
    },
  });

  const createSalesMethodMutation = useMutation({
    mutationFn: unitsApi.createSalesMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '' });
    },
  });

  const updateSalesMethodMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSalesMethodRequest> }) =>
      unitsApi.updateSalesMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
      setIsEditModalOpen(false);
      setSelectedUnit(null);
      setFormData({ name: '', description: '' });
    },
  });

  const deleteSalesMethodMutation = useMutation({
    mutationFn: unitsApi.deleteSalesMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-methods'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'amount') {
      createAmountUnitMutation.mutate(formData as CreateAmountUnitRequest);
    } else if (activeTab === 'currency') {
      createCurrencyUnitMutation.mutate(formData as CreateCurrencyUnitRequest);
    } else {
      createSalesMethodMutation.mutate(formData as CreateSalesMethodRequest);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUnit) {
      if (activeTab === 'amount') {
        updateAmountUnitMutation.mutate({ id: selectedUnit._id, data: formData as Partial<CreateAmountUnitRequest> });
      } else if (activeTab === 'currency') {
        updateCurrencyUnitMutation.mutate({ id: selectedUnit._id, data: formData as Partial<CreateCurrencyUnitRequest> });
      } else {
        updateSalesMethodMutation.mutate({ id: selectedUnit._id, data: formData as Partial<CreateSalesMethodRequest> });
      }
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu birimi silmek istediğinizden emin misiniz?')) {
      if (activeTab === 'amount') {
        deleteAmountUnitMutation.mutate(id);
      } else if (activeTab === 'currency') {
        deleteCurrencyUnitMutation.mutate(id);
      } else {
        deleteSalesMethodMutation.mutate(id);
      }
    }
  };

  const openEditModal = (unit: AmountUnit | CurrencyUnit | SalesMethod) => {
    setSelectedUnit(unit);
    setFormData({
      name: unit.name,
      ...(activeTab === 'sales' && 'description' in unit ? { description: unit.description || '' } : {}),
    });
    setIsEditModalOpen(true);
  };

  const amountColumns = [
    { key: 'name' as keyof AmountUnit, title: 'Ad' },
    {
      key: 'createdAt' as keyof AmountUnit,
      title: 'Oluşturulma',
      render: (value: string) => new Date(value).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions' as keyof AmountUnit,
      title: 'İşlemler',
      render: (_: any, item: AmountUnit) => (
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

  const currencyColumns = [
    { key: 'name' as keyof CurrencyUnit, title: 'Ad' },
    {
      key: 'createdAt' as keyof CurrencyUnit,
      title: 'Oluşturulma',
      render: (value: string) => new Date(value).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions' as keyof CurrencyUnit,
      title: 'İşlemler',
      render: (_: any, item: CurrencyUnit) => (
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

  const salesColumns = [
    { key: 'name' as keyof SalesMethod, title: 'Ad' },
    { key: 'description' as keyof SalesMethod, title: 'Açıklama' },
    {
      key: 'createdAt' as keyof SalesMethod,
      title: 'Oluşturulma',
      render: (value: string) => new Date(value).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions' as keyof SalesMethod,
      title: 'İşlemler',
      render: (_: any, item: SalesMethod) => (
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

  if (amountUnitsLoading || currencyUnitsLoading || salesMethodsLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Birimler</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-5 w-5 mr-2" /> Yeni Birim
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('amount')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'amount'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Ruler className="h-5 w-5 inline mr-2" />
              Miktar Birimleri
            </button>
            <button
              onClick={() => setActiveTab('currency')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'currency'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="h-5 w-5 inline mr-2" />
              Para Birimleri
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingCart className="h-5 w-5 inline mr-2" />
              Satış Yöntemleri
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent>
          {activeTab === 'amount' ? (
            amountUnitsData?.units && amountUnitsData.units.length > 0 ? (
              <Table data={amountUnitsData.units} columns={amountColumns} />
            ) : (
              <p className="text-center text-gray-500 py-8">Henüz hiç miktar birimi oluşturulmamış.</p>
            )
          ) : activeTab === 'currency' ? (
            currencyUnitsData?.units && currencyUnitsData.units.length > 0 ? (
              <Table data={currencyUnitsData.units} columns={currencyColumns} />
            ) : (
              <p className="text-center text-gray-500 py-8">Henüz hiç para birimi oluşturulmamış.</p>
            )
          ) : (
            salesMethodsData?.methods && salesMethodsData.methods.length > 0 ? (
              <Table data={salesMethodsData.methods} columns={salesColumns} />
            ) : (
              <p className="text-center text-gray-500 py-8">Henüz hiç satış yöntemi oluşturulmamış.</p>
            )
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Yeni {activeTab === 'amount' ? 'Miktar' : activeTab === 'currency' ? 'Para' : 'Satış Yöntemi'} {activeTab === 'sales' ? '' : 'Birimi'}
              </h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label={`${activeTab === 'amount' ? 'Miktar' : activeTab === 'currency' ? 'Para' : 'Satış Yöntemi'} ${activeTab === 'sales' ? 'Adı' : 'Birimi Adı'}`}
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                {activeTab === 'sales' && (
                  <Input
                    label="Açıklama (Opsiyonel)"
                    name="description"
                    value={(formData as CreateSalesMethodRequest).description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                )}
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
                    loading={
                      activeTab === 'amount' 
                        ? createAmountUnitMutation.isPending 
                        : activeTab === 'currency' 
                        ? createCurrencyUnitMutation.isPending 
                        : createSalesMethodMutation.isPending
                    }
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {activeTab === 'amount' ? 'Miktar' : activeTab === 'currency' ? 'Para' : 'Satış Yöntemi'} {activeTab === 'sales' ? 'Düzenle' : 'Birimi Düzenle'}
              </h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <Input
                  label={`${activeTab === 'amount' ? 'Miktar' : activeTab === 'currency' ? 'Para' : 'Satış Yöntemi'} ${activeTab === 'sales' ? 'Adı' : 'Birimi Adı'}`}
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                {activeTab === 'sales' && (
                  <Input
                    label="Açıklama (Opsiyonel)"
                    name="description"
                    value={(formData as CreateSalesMethodRequest).description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                )}
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
                    loading={
                      activeTab === 'amount' 
                        ? updateAmountUnitMutation.isPending 
                        : activeTab === 'currency' 
                        ? updateCurrencyUnitMutation.isPending 
                        : updateSalesMethodMutation.isPending
                    }
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
