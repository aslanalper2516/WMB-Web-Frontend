import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyBranchApi } from '../../api/companyBranch';
import { categoryProductApi } from '../../api/categoryProduct';
import { authApi } from '../../api/auth';
import { turkiyeApi, type Province, type District, type Neighborhood } from '../../api/turkiyeApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2, ShoppingCart, UserCog } from 'lucide-react';
import type { Branch, CreateBranchRequest, SalesMethod, BranchSalesMethod } from '../../types';

export const Branches: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSalesMethodsModalOpen, setIsSalesMethodsModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedManager, setSelectedManager] = useState<string>('');
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
  const [selectedSalesMethods, setSelectedSalesMethods] = useState<string[]>([]); // Çoklu seçim için
  const [isApplyingToAllBranches, setIsApplyingToAllBranches] = useState(false);
  
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

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const result = await authApi.getUsers();
      console.log('📋 Users data received (Branch):', result);
      console.log('👤 First user (Branch):', result.users[0]);
      return result;
    },
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

  const assignManagerMutation = useMutation({
    mutationFn: ({ id, managerId }: { id: string; managerId: string }) => {
      console.log('🔍 Assigning manager to branch:', { id, managerId, type: typeof managerId });
      const payload = { manager: managerId };
      console.log('📦 Payload:', payload);
      return companyBranchApi.updateBranch(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsManagerModalOpen(false);
      setSelectedManager('');
      setSelectedBranch(null);
    },
  });


  const assignSalesMethodMutation = useMutation({
    mutationFn: ({ branchId, salesMethodId }: { branchId: string; salesMethodId: string }) =>
      categoryProductApi.assignSalesMethodToBranch(branchId, { salesMethod: salesMethodId }),
    onSuccess: () => {
      refetchBranchSalesMethods();
      setSelectedSalesMethod('');
      setSelectedSalesMethods([]);
      setIsApplyingToAllBranches(false);
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

  const openManagerModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedManager('');
    setIsManagerModalOpen(true);
  };

  const handleAssignManager = () => {
    if (selectedBranch && selectedManager) {
      assignManagerMutation.mutate({ id: selectedBranch._id, managerId: selectedManager });
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
    // State'leri temizle
    setSelectedSalesMethod('');
    setSelectedSalesMethods([]);
    setIsApplyingToAllBranches(false);
  };


  const handleAssignSalesMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    
    // Çoklu seçim modu: Seçilen satış yöntemlerini uygula
    if (selectedSalesMethods.length > 0) {
      try {
        // Uygulanacak şubeleri belirle
        const branchesToApply = isApplyingToAllBranches && selectedBranch.company
          ? branchesData?.branches?.filter(b => {
              const branchCompanyId = typeof b.company === 'string' ? b.company : b.company?._id;
              const selectedBranchCompanyId = typeof selectedBranch.company === 'string' 
                ? selectedBranch.company 
                : selectedBranch.company?._id;
              return branchCompanyId === selectedBranchCompanyId;
            }) || []
          : [selectedBranch];
        
        // Her satış yöntemi için her şubeye ata
        for (const salesMethodId of selectedSalesMethods) {
          for (const branch of branchesToApply) {
            // Bu şubeye özel kontrol - eğer tüm şubelere uyguluyorsak her şubeyi kontrol et
            if (isApplyingToAllBranches) {
              // Her şube için ayrı kontrol
              const branchSalesMethods = await categoryProductApi.getBranchSalesMethods(branch._id);
              const alreadyAssigned = branchSalesMethods.salesMethods.some(
                (bsm: BranchSalesMethod) => bsm.salesMethod._id === salesMethodId
              );
              
              if (!alreadyAssigned) {
                await categoryProductApi.assignSalesMethodToBranch(branch._id, { salesMethod: salesMethodId });
              }
            } else {
              // Sadece seçili şubeye ata - zaten atanmış mı kontrol et
              const isAlreadyAssigned = branchSalesMethodsData?.salesMethods?.some(
                (bsm: BranchSalesMethod) => bsm.salesMethod._id === salesMethodId
              );
              
              if (!isAlreadyAssigned) {
                await categoryProductApi.assignSalesMethodToBranch(selectedBranch._id, { salesMethod: salesMethodId });
              }
            }
          }
        }
        
        // Tüm şubeleri yeniden yükle
        if (isApplyingToAllBranches) {
          queryClient.invalidateQueries({ queryKey: ['branchSalesMethods'] });
        } else {
          refetchBranchSalesMethods();
        }
        
        setSelectedSalesMethods([]);
        setIsApplyingToAllBranches(false);
      } catch (error) {
        console.error('Satış yöntemi atama hatası:', error);
        alert('Satış yöntemi atanırken bir hata oluştu!');
      }
    } else if (selectedSalesMethod) {
      // Tekli seçim modu: Eski mantık
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
            variant="secondary"
            onClick={() => openManagerModal(item)}
            title="Yönetici Ata"
          >
            <UserCog className="h-4 w-4" />
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
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Şubeler</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yeni Şube</h3>
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
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Şube Düzenle</h3>
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
                <Input
                  label="Masa Sayısı"
                  name="tables"
                  type="number"
                  value={formData.tables}
                  onChange={(e) => setFormData({ ...formData, tables: parseInt(e.target.value) })}
                  required
                />
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Adres Bilgileri</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500"
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
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-2/3 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
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
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Mevcut Satış Yöntemleri</h4>
                  {branchSalesMethodsData?.salesMethods && branchSalesMethodsData.salesMethods.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {branchSalesMethodsData.salesMethods.map((branchSalesMethod: BranchSalesMethod) => (
                        <div key={branchSalesMethod._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex justify-between items-center bg-white dark:bg-gray-700">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{branchSalesMethod.salesMethod.name}</p>
                            {branchSalesMethod.salesMethod.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">{branchSalesMethod.salesMethod.description}</p>
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
                    <p className="text-gray-500 dark:text-gray-400">Bu şubeye henüz satış yöntemi atanmamış.</p>
                  )}
                </div>

                {/* Yeni Satış Yöntemi Atama */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Yeni Satış Yöntemi Ata</h4>
                  
                  {/* Çoklu Seçim Modu */}
                  <div className="space-y-3 mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md p-3">
                      <p className="text-sm text-blue-800 dark:text-blue-400 mb-3">
                        Birden fazla satış yöntemi seçerek toplu işlem yapabilirsiniz.
                      </p>
                      
                      {/* Mevcut olmayan satış yöntemlerini listele */}
                      {(() => {
                        const availableMethods = salesMethodsData?.methods?.filter((sm: SalesMethod) => 
                          !branchSalesMethodsData?.salesMethods?.some((bsm: BranchSalesMethod) => 
                            bsm.salesMethod._id === sm._id
                          )
                        ) || [];
                        
                        if (availableMethods.length === 0) {
                          return (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Atanabilecek satış yöntemi kalmadı.
                            </p>
                          );
                        }
                        
                        return (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {availableMethods.map((method: SalesMethod) => {
                              const isSelected = selectedSalesMethods.includes(method._id);
                              return (
                                <label
                                  key={method._id}
                                  className="flex items-center space-x-2 p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedSalesMethods(prev => [...prev, method._id]);
                                      } else {
                                        setSelectedSalesMethods(prev => prev.filter(id => id !== method._id));
                                      }
                                      // Tekli seçimi temizle
                                      setSelectedSalesMethod('');
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                                  />
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {method.name}
                                    </span>
                                    {method.description && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {method.description}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Tüm şubelere uygula checkbox'ı - sadece çoklu seçim modunda */}
                    {selectedSalesMethods.length > 0 && selectedBranch?.company && (
                      <div className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                        <input
                          type="checkbox"
                          id="applyToAllBranches"
                          checked={isApplyingToAllBranches}
                          onChange={(e) => setIsApplyingToAllBranches(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label
                          htmlFor="applyToAllBranches"
                          className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                        >
                          {(() => {
                            const companyId = typeof selectedBranch.company === 'string' 
                              ? selectedBranch.company 
                              : selectedBranch.company?._id;
                            const companyBranches = branchesData?.branches?.filter(b => {
                              const branchCompanyId = typeof b.company === 'string' ? b.company : b.company?._id;
                              return branchCompanyId === companyId;
                            }) || [];
                            return `Tüm şubelere uygula (${companyBranches.length} şube)`;
                          })()}
                        </label>
                      </div>
                    )}
                    
                    {/* Tekli Seçim (Fallback) */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Veya tekli seçim:</p>
                      <form onSubmit={handleAssignSalesMethod} className="flex space-x-2">
                        <Select
                          value={selectedSalesMethod}
                          onChange={(e) => {
                            setSelectedSalesMethod(e.target.value);
                            // Çoklu seçimi temizle
                            setSelectedSalesMethods([]);
                          }}
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
                          disabled={!selectedSalesMethod && selectedSalesMethods.length === 0}
                          loading={assignSalesMethodMutation.isPending}
                        >
                          Ata
                        </Button>
                      </form>
                    </div>
                    
                    {/* Çoklu Seçim için Kaydet Butonu */}
                    {selectedSalesMethods.length > 0 && (
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAssignSalesMethod}
                          disabled={selectedSalesMethods.length === 0}
                          loading={assignSalesMethodMutation.isPending}
                        >
                          {selectedSalesMethods.length > 0 
                            ? `${selectedSalesMethods.length} Satış Yöntemini ${isApplyingToAllBranches ? 'Tüm Şubelere' : 'Ata'}`
                            : 'Satış Yöntemi Seçin'
                          }
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manager Modal */}
      {isManagerModalOpen && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Yönetici Ata: {selectedBranch?.name}
              </h3>
              <div className="space-y-4">
                {selectedBranch?.manager && (() => {
                  const managerId = typeof selectedBranch.manager === 'string' 
                    ? selectedBranch.manager 
                    : (selectedBranch.manager._id || selectedBranch.manager.id);
                  const managerUser = usersData?.users.find(u => (u._id || u.id) === managerId);
                  
                  return (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
                        Mevcut Yönetici
                      </p>
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {managerUser?.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {managerUser?.name || 'Bilinmiyor'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            ✉️ {managerUser?.email || 'Email bulunamadı'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Yeni Yönetici Seç
                  </label>
                  <select
                    value={selectedManager}
                    onChange={(e) => {
                      console.log('🎯 Selected manager ID (Branch):', e.target.value);
                      setSelectedManager(e.target.value);
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Yönetici Seçin</option>
                    {usersData?.users.map((user) => {
                      const userId = user._id || user.id;
                      console.log('👤 User option (Branch):', { id: user.id, _id: user._id, userId, name: user.name });
                      return (
                        <option key={userId} value={userId}>
                          {user.name} ({user.email})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsManagerModalOpen(false);
                      setSelectedManager('');
                      setSelectedBranch(null);
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleAssignManager}
                    loading={assignManagerMutation.isPending}
                    disabled={!selectedManager}
                  >
                    Ata
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
