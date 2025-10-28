import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyBranchApi } from '../../api/companyBranch';
import { categoryProductApi } from '../../api/categoryProduct';
import { turkiyeApi, type Province, type District, type Neighborhood } from '../../api/turkiyeApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2, ShoppingCart } from 'lucide-react';
import type { Branch, CreateBranchRequest, SalesMethod, BranchSalesMethod } from '../../types';

export const Branches: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSalesMethodsModalOpen, setIsSalesMethodsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<CreateBranchRequest>({
    name: '',
    phone: '',
    email: '',
    company: '',
    tables: 0,
    province: '',
    district: '',
    neighborhood: '',
    street: '',
    address: '',
  });
  const [selectedSalesMethod, setSelectedSalesMethod] = useState('');
  
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

  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => companyBranchApi.getBranches(),
  });

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyBranchApi.getCompanies(),
  });

  const { data: salesMethodsData } = useQuery({
    queryKey: ['salesMethods'],
    queryFn: () => categoryProductApi.getSalesMethods(),
  });

  const { data: branchSalesMethodsData, refetch: refetchBranchSalesMethods } = useQuery({
    queryKey: ['branchSalesMethods', selectedBranch?._id],
    queryFn: () => selectedBranch ? categoryProductApi.getBranchSalesMethods(selectedBranch._id) : Promise.resolve({ message: '', salesMethods: [] }),
    enabled: !!selectedBranch && isSalesMethodsModalOpen,
  });

  const createMutation = useMutation({
    mutationFn: companyBranchApi.createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', phone: '', email: '', company: '', tables: 0, province: '', district: '', neighborhood: '', street: '', address: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBranchRequest> }) =>
      companyBranchApi.updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsEditModalOpen(false);
      setSelectedBranch(null);
      setFormData({ name: '', phone: '', email: '', company: '', tables: 0, province: '', district: '', neighborhood: '', street: '', address: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: companyBranchApi.deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });


  const assignSalesMethodMutation = useMutation({
    mutationFn: ({ branchId, salesMethodId }: { branchId: string; salesMethodId: string }) =>
      categoryProductApi.assignSalesMethodToBranch(branchId, { salesMethod: salesMethodId }),
    onSuccess: () => {
      refetchBranchSalesMethods();
      setSelectedSalesMethod('');
    },
  });

  const removeSalesMethodMutation = useMutation({
    mutationFn: ({ branchId, salesMethodId }: { branchId: string; salesMethodId: string }) =>
      categoryProductApi.removeSalesMethodFromBranch(branchId, salesMethodId),
    onSuccess: () => {
      refetchBranchSalesMethods();
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBranch) {
      updateMutation.mutate({ id: selectedBranch._id, data: formData });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu şubeyi silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = async (branch: Branch) => {
    setSelectedBranch(branch);
    
    // Company ID'yi al (string veya obje olabilir)
    const companyId = typeof branch.company === 'string' 
      ? branch.company 
      : branch.company._id;
    
    setFormData({
      name: branch.name,
      phone: branch.phone,
      email: branch.email,
      company: companyId,
      tables: branch.tables,
      province: branch.province || '',
      district: branch.district || '',
      neighborhood: branch.neighborhood || '',
      street: branch.street || '',
      address: branch.address || '',
    });
    
    // İl seçimini ayarla ve ilçeleri yükle
    if (branch.province) {
      const province = provinces.find(p => p.name === branch.province);
      if (province) {
        setSelectedProvinceId(province.id);
        
        // İlçeleri yükle
        try {
          const districtsData = await turkiyeApi.getDistrictsByProvince(province.id);
          setDistricts(districtsData);
          
          // İlçe seçimini ayarla ve mahalleleri yükle
          if (branch.district) {
            const district = districtsData.find((d: District) => d.name === branch.district);
            if (district) {
              setSelectedDistrictId(district.id);
              
              // Mahalleleri yükle
              try {
                const neighborhoodsData = await turkiyeApi.getNeighborhoodsByDistrict(district.id);
                setNeighborhoods(neighborhoodsData);
              } catch (error) {
                console.error('Error loading neighborhoods:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error loading districts:', error);
        }
      }
    }
    
    setIsEditModalOpen(true);
  };

  // Modal açıldığında formu temizle
  const openCreateModal = () => {
    setFormData({ name: '', phone: '', email: '', company: '', tables: 0, province: '', district: '', neighborhood: '', street: '', address: '' });
    setSelectedProvinceId(null);
    setSelectedDistrictId(null);
    setDistricts([]);
    setNeighborhoods([]);
    setIsCreateModalOpen(true);
  };

  const openSalesMethodsModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsSalesMethodsModalOpen(true);
  };


  const handleAssignSalesMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBranch && selectedSalesMethod) {
      assignSalesMethodMutation.mutate({
        branchId: selectedBranch._id,
        salesMethodId: selectedSalesMethod
      });
    }
  };

  const handleRemoveSalesMethod = (salesMethodId: string) => {
    if (selectedBranch && window.confirm('Bu satış yöntemini şubeden kaldırmak istediğinizden emin misiniz?')) {
      removeSalesMethodMutation.mutate({
        branchId: selectedBranch._id,
        salesMethodId
      });
    }
  };

  const columns = [
    { key: 'name' as keyof Branch, title: 'Ad' },
    { key: 'email' as keyof Branch, title: 'E-posta' },
    { key: 'phone' as keyof Branch, title: 'Telefon' },
    { key: 'tables' as keyof Branch, title: 'Masa Sayısı' },
    { 
      key: 'address' as keyof Branch, 
      title: 'Adres',
      render: (_value: any, item: Branch) => {
        const addressParts = [
          item.street,
          item.neighborhood,
          item.district,
          item.province
        ].filter(Boolean);
        return addressParts.length > 0 ? addressParts.join(', ') : (item.address || '-');
      }
    },
    {
      key: 'createdAt' as keyof Branch,
      title: 'Oluşturulma',
      render: (_value: any) => new Date(_value).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions' as keyof Branch,
      title: 'İşlemler',
      render: (_: any, item: Branch) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openSalesMethodsModal(item)}
            title="Satış Yöntemlerini Görüntüle"
          >
            <ShoppingCart className="h-4 w-4" />
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

  if (branchesLoading || companiesLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Şubeler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Şube bilgilerini yönetin
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Şube
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table
            data={branchesData?.branches || []}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Şube</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Şube Adı"
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
                <Input
                  label="Masa Sayısı"
                  name="tables"
                  type="number"
                  value={formData.tables}
                  onChange={(e) => setFormData({ ...formData, tables: parseInt(e.target.value) })}
                  required
                />
                
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
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Şube Düzenle</h3>
              <form onSubmit={handleEdit} className="space-y-4">
                <Input
                  label="Şube Adı"
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
                <Input
                  label="Masa Sayısı"
                  name="tables"
                  type="number"
                  value={formData.tables}
                  onChange={(e) => setFormData({ ...formData, tables: parseInt(e.target.value) })}
                  required
                />
                
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

      {/* Sales Methods Modal */}
      {isSalesMethodsModalOpen && selectedBranch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedBranch.name} - Satış Yöntemleri
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setIsSalesMethodsModalOpen(false)}
                >
                  Kapat
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Mevcut Satış Yöntemleri */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-2">Mevcut Satış Yöntemleri</h4>
                  {branchSalesMethodsData?.salesMethods && branchSalesMethodsData.salesMethods.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {branchSalesMethodsData.salesMethods.map((branchSalesMethod: BranchSalesMethod) => (
                        <div key={branchSalesMethod._id} className="border rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{branchSalesMethod.salesMethod.name}</p>
                            {branchSalesMethod.salesMethod.description && (
                              <p className="text-sm text-gray-500">{branchSalesMethod.salesMethod.description}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRemoveSalesMethod(branchSalesMethod.salesMethod._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Bu şubeye henüz satış yöntemi atanmamış.</p>
                  )}
                </div>

                {/* Yeni Satış Yöntemi Atama */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-700 mb-2">Yeni Satış Yöntemi Ata</h4>
                  <form onSubmit={handleAssignSalesMethod} className="flex space-x-2">
                    <Select
                      value={selectedSalesMethod}
                      onChange={(e) => setSelectedSalesMethod(e.target.value)}
                      options={salesMethodsData?.methods?.filter((sm: SalesMethod) => 
                        !branchSalesMethodsData?.salesMethods?.some((bsm: BranchSalesMethod) => 
                          bsm.salesMethod._id === sm._id
                        )
                      ).map((sm: SalesMethod) => ({
                        value: sm._id,
                        label: sm.name
                      })) || []}
                      placeholder="Satış yöntemi seçiniz..."
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!selectedSalesMethod}
                      loading={assignSalesMethodMutation.isPending}
                    >
                      Ata
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
