import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitsApi } from '../../api/units';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { Plus, Edit, Trash2, Ruler, DollarSign } from 'lucide-react';
import type { AmountUnit, CurrencyUnit, CreateAmountUnitRequest, CreateCurrencyUnitRequest } from '../../types';

export const Units: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'amount' | 'currency'>('amount');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<AmountUnit | CurrencyUnit | null>(null);
  const [formData, setFormData] = useState<CreateAmountUnitRequest | CreateCurrencyUnitRequest>({
    name: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const { data: amountUnitsData, isLoading: amountUnitsLoading } = useQuery({
    queryKey: ['amount-units'],
    queryFn: () => unitsApi.getAmountUnits(),
  });

  const { data: currencyUnitsData, isLoading: currencyUnitsLoading } = useQuery({
    queryKey: ['currency-units'],
    queryFn: () => unitsApi.getCurrencyUnits(),
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'amount') {
      createAmountUnitMutation.mutate(formData as CreateAmountUnitRequest);
    } else {
      createCurrencyUnitMutation.mutate(formData as CreateCurrencyUnitRequest);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUnit) {
      if (activeTab === 'amount') {
        updateAmountUnitMutation.mutate({ id: selectedUnit._id, data: formData as Partial<CreateAmountUnitRequest> });
      } else {
        updateCurrencyUnitMutation.mutate({ id: selectedUnit._id, data: formData as Partial<CreateCurrencyUnitRequest> });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      message: 'Bu birimi silmek istediğinizden emin misiniz?',
      title: 'Birim Sil',
      confirmText: 'Sil',
      cancelText: 'İptal',
    });
    
    if (confirmed) {
      if (activeTab === 'amount') {
        deleteAmountUnitMutation.mutate(id);
      } else {
        deleteCurrencyUnitMutation.mutate(id);
      }
    }
  };

  const openEditModal = (unit: AmountUnit | CurrencyUnit) => {
    setSelectedUnit(unit);
    setFormData({
      name: unit.name,
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

  if (amountUnitsLoading || currencyUnitsLoading) {
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Birimler</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-5 w-5 mr-2" /> Yeni Birim
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('amount')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'amount'
                  ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Ruler className="h-5 w-5 inline mr-2" />
              Miktar Birimleri
            </button>
            <button
              onClick={() => setActiveTab('currency')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'currency'
                  ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <DollarSign className="h-5 w-5 inline mr-2" />
              Para Birimleri
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
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Henüz hiç miktar birimi oluşturulmamış.</p>
            )
          ) : (
            currencyUnitsData?.units && currencyUnitsData.units.length > 0 ? (
              <Table data={currencyUnitsData.units} columns={currencyColumns} />
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Henüz hiç para birimi oluşturulmamış.</p>
            )
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Yeni {activeTab === 'amount' ? 'Miktar' : 'Para'} Birimi
              </h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label={`${activeTab === 'amount' ? 'Miktar' : 'Para'} Birimi Adı`}
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setFormData({ name: '' });
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    loading={
                      activeTab === 'amount' 
                        ? createAmountUnitMutation.isPending 
                        : createCurrencyUnitMutation.isPending
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
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {activeTab === 'amount' ? 'Miktar' : 'Para'} Birimi Düzenle
              </h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <Input
                  label={`${activeTab === 'amount' ? 'Miktar' : 'Para'} Birimi Adı`}
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedUnit(null);
                      setFormData({ name: '' });
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    loading={
                      activeTab === 'amount' 
                        ? updateAmountUnitMutation.isPending 
                        : updateCurrencyUnitMutation.isPending
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
