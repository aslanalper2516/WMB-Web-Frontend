import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyBranchApi } from '../../api/companyBranch';
import { turkiyeApi, type Province, type District, type Neighborhood } from '../../api/turkiyeApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Company, CreateCompanyRequest } from '../../types';

export const Companies: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<CreateCompanyRequest>({
    name: '',
    phone: '',
    email: '',
    province: '',
    district: '',
    neighborhood: '',
    street: '',
    address: '',
  });

  // TurkiyeAPI state'leri
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // İlleri yükle
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const provincesData = await turkiyeApi.getProvinces();
        setProvinces(provincesData);
      } catch (error) {
        console.error('Error loading provinces:', error);
      }
    };
    loadProvinces();
  }, []);

  // İl seçildiğinde ilçeleri yükle
  useEffect(() => {
    const loadDistricts = async () => {
      if (selectedProvinceId) {
        try {
          const districtsData = await turkiyeApi.getDistrictsByProvince(selectedProvinceId);
          setDistricts(districtsData);
        } catch (error) {
          console.error('Error loading districts:', error);
          setDistricts([]);
        }
      } else {
        setDistricts([]);
      }
      setNeighborhoods([]);
      setSelectedDistrictId(null);
    };
    loadDistricts();
  }, [selectedProvinceId]);

  // İlçe seçildiğinde mahalleleri yükle
  useEffect(() => {
    const loadNeighborhoods = async () => {
      if (selectedDistrictId) {
        try {
          const neighborhoodsData = await turkiyeApi.getNeighborhoodsByDistrict(selectedDistrictId);
          setNeighborhoods(neighborhoodsData);
        } catch (error) {
          console.error('Error loading neighborhoods:', error);
          setNeighborhoods([]);
        }
      } else {
        setNeighborhoods([]);
      }
    };
    loadNeighborhoods();
  }, [selectedDistrictId]);

  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyBranchApi.getCompanies(),
  });

  const createMutation = useMutation({
    mutationFn: companyBranchApi.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', phone: '', email: '', province: '', district: '', neighborhood: '', street: '', address: '' });
      setErrorMessage('');
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.error || 'Şirket oluşturulurken bir hata oluştu');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCompanyRequest> }) =>
      companyBranchApi.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsEditModalOpen(false);
      setSelectedCompany(null);
      setFormData({ name: '', phone: '', email: '', province: '', district: '', neighborhood: '', street: '', address: '' });
      setErrorMessage('');
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.error || 'Şirket güncellenirken bir hata oluştu');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: companyBranchApi.deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  // Modal açıldığında formu temizle
  const openCreateModal = () => {
    setFormData({ name: '', phone: '', email: '', province: '', district: '', neighborhood: '', street: '', address: '' });
    setSelectedProvinceId(null);
    setSelectedDistrictId(null);
    setDistricts([]);
    setNeighborhoods([]);
    setErrorMessage('');
    setIsCreateModalOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    createMutation.mutate(formData);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (selectedCompany) {
      updateMutation.mutate({ id: selectedCompany._id, data: formData });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu şirketi silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      phone: company.phone,
      email: company.email,
      province: company.province || '',
      district: company.district || '',
      neighborhood: company.neighborhood || '',
      street: company.street || '',
      address: company.address || '',
    });
    
    // İl seçimini ayarla
    if (company.province) {
      const province = provinces.find(p => p.name === company.province);
      if (province) {
        setSelectedProvinceId(province.id);
      }
    }
    
    setIsEditModalOpen(true);
  };

  const columns = [
    { key: 'name' as keyof Company, title: 'Şirket Adı' },
    { key: 'email' as keyof Company, title: 'E-posta' },
    { key: 'phone' as keyof Company, title: 'Telefon' },
    { 
      key: 'address' as keyof Company, 
      title: 'Adres',
      render: (value: string, item: Company) => {
        const addressParts = [
          item.street,
          item.neighborhood,
          item.district,
          item.province
        ].filter(Boolean);
        return addressParts.length > 0 ? addressParts.join(', ') : (value || '-');
      }
    },
    {
      key: 'createdAt' as keyof Company,
      title: 'Oluşturulma',
      render: (value: string) => new Date(value).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions' as keyof Company,
      title: 'İşlemler',
      render: (_: any, item: Company) => (
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

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Şirketler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Şirket bilgilerini yönetin
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Şirket
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table
            data={companiesData?.companies || []}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Şirket</h3>
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {errorMessage}
                </div>
              )}
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Şirket Adı"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="E-posta"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <Input
                    label="Telefon"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Adres Bilgileri</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        İl
                      </label>
                      <select
                        name="province"
                        value={formData.province}
                        onChange={(e) => {
                          const selectedProvince = provinces.find(p => p.name === e.target.value);
                          setSelectedProvinceId(selectedProvince?.id || null);
                          setFormData({ ...formData, province: e.target.value, district: '', neighborhood: '', street: '' });
                        }}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">İl Seçin</option>
                        {provinces.map((province) => (
                          <option key={province.id} value={province.name}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        İlçe
                      </label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={(e) => {
                          const selectedDistrict = districts.find(d => d.name === e.target.value);
                          setSelectedDistrictId(selectedDistrict?.id || null);
                          setFormData({ ...formData, district: e.target.value, neighborhood: '', street: '' });
                        }}
                        disabled={!selectedProvinceId}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">İlçe Seçin</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.name}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mahalle
                      </label>
                      <select
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value, street: '' })}
                        disabled={!selectedDistrictId}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Mahalle Seçin</option>
                        {neighborhoods.map((neighborhood) => (
                          <option key={neighborhood.id} value={neighborhood.name}>
                            {neighborhood.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Sokak"
                      name="street"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    />
                  </div>
                  <div className="mt-4">
                    <Input
                      label="Açık Adres *"
                      name="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      placeholder="Detaylı adres bilgisi giriniz"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setErrorMessage('');
                    }}
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
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Şirket Düzenle</h3>
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {errorMessage}
                </div>
              )}
              <form onSubmit={handleEdit} className="space-y-4">
                <Input
                  label="Şirket Adı"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="E-posta"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <Input
                    label="Telefon"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Adres Bilgileri</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        İl
                      </label>
                      <select
                        name="province"
                        value={formData.province}
                        onChange={(e) => {
                          const selectedProvince = provinces.find(p => p.name === e.target.value);
                          setSelectedProvinceId(selectedProvince?.id || null);
                          setFormData({ ...formData, province: e.target.value, district: '', neighborhood: '', street: '' });
                        }}
                        required
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">İl Seçin</option>
                        {provinces.map((province) => (
                          <option key={province.id} value={province.name}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        İlçe
                      </label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={(e) => {
                          const selectedDistrict = districts.find(d => d.name === e.target.value);
                          setSelectedDistrictId(selectedDistrict?.id || null);
                          setFormData({ ...formData, district: e.target.value, neighborhood: '', street: '' });
                        }}
                        disabled={!selectedProvinceId}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">İlçe Seçin</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.name}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mahalle
                      </label>
                      <select
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value, street: '' })}
                        disabled={!selectedDistrictId}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Mahalle Seçin</option>
                        {neighborhoods.map((neighborhood) => (
                          <option key={neighborhood.id} value={neighborhood.name}>
                            {neighborhood.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Sokak"
                      name="street"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    />
                  </div>
                  <div className="mt-4">
                    <Input
                      label="Açık Adres *"
                      name="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      placeholder="Detaylı adres bilgisi giriniz"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setErrorMessage('');
                      setSelectedCompany(null);
                      setFormData({ name: '', phone: '', email: '', province: '', district: '', neighborhood: '', street: '', address: '' });
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
