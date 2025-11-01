import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyBranchApi } from '../../api/companyBranch';
import { authApi } from '../../api/auth';
import { userCompanyBranchApi } from '../../api/userCompanyBranch';
import { turkiyeApi, type Province, type District, type Neighborhood } from '../../api/turkiyeApi.ts';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { Plus, Edit, Trash2, UserCog } from 'lucide-react';
import type { Company, CreateCompanyRequest, UserCompanyBranch } from '../../types';

export const Companies: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [companyManagers, setCompanyManagers] = useState<any[]>([]);
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
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
  const { showToast } = useToast();
  const { confirm } = useConfirm();

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

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers(),
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

  const assignManagerMutation = useMutation({
    mutationFn: ({ userId, companyId }: { userId: string; companyId: string }) => {
      const requestData = {
        user: userId,
        company: companyId
      };
      return userCompanyBranchApi.assignUserToCompanyBranch(requestData);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['userCompanyBranches'] });
      setSelectedManager('');
      showToast('Yönetici başarıyla atandı.', 'success');
      
      // Yöneticiler listesini yenile
      if (selectedCompany) {
        try {
          const managersRes = await companyBranchApi.getCompanyManagers(selectedCompany._id);
          if (managersRes?.managers) {
            setCompanyManagers(managersRes.managers);
          }
          
          // Available managers listesini de güncelle
          const allUsersRes = await authApi.getUsers();
          if (allUsersRes?.users) {
            const companyManagerRoleUsers = allUsersRes.users.filter((user: any) => {
              const role = typeof user.role === 'string' ? null : user.role;
              const roleName = role?.name?.toLowerCase() || '';
              return roleName === 'şirket yöneticisi' || roleName === 'şirket-yöneticisi' || 
                     roleName === 'sirket yoneticisi' || roleName === 'sirket-yoneticisi';
            });
            
            const currentManagerIds = managersRes?.managers?.map((m: any) => {
              const user = typeof m.user === 'string' ? null : m.user;
              return typeof user === 'string' ? user : user?._id || user?.id;
            }) || [];
            
            const available = companyManagerRoleUsers.filter((user: any) => {
              const userId = user._id || user.id;
              return !currentManagerIds.includes(userId);
            });
            
            setAvailableManagers(available);
          }
        } catch (error) {
          console.error('Yöneticiler yenilenemedi:', error);
        }
      }
    },
    onError: (error: any) => {
      console.error('Yönetici atama hatası:', error);
      
      // Backend'den gelen hata mesajını kontrol et
      let errorMessage = 'Yönetici atanırken bir hata oluştu.';
      
      // Tüm olası hata mesajı kaynaklarını kontrol et
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // String formatı
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } 
        // Object formatı
        else if (typeof errorData === 'object') {
          errorMessage = errorData.message || 
                        errorData.error || 
                        errorData.errors?.[0]?.message ||
                        JSON.stringify(errorData);
        }
      } 
      // Error object'inin kendisinde mesaj varsa
      else if (error.message) {
        errorMessage = error.message;
      }
      
      // Backend log'undan bilinen hatalar için özel mesajlar
      if (errorMessage === 'Internal Server Error' || 
          error.response?.status === 500) {
        // 500 hatası genellikle duplicate kayıt veya validation hatası anlamına gelir
        // Backend'den gelen log'a göre "Bu kullanıcı zaten bu şirket/şubeye atanmış" hatası
        errorMessage = 'Bu kullanıcı zaten bu şirkete atanmış. Mevcut atamayı güncellemek için önce mevcut atamayı kaldırın.';
      }
      // Eğer hata mesajında "zaten" veya "atanmış" geçiyorsa
      else if (errorMessage.includes('zaten') || errorMessage.includes('atanmış')) {
        errorMessage = 'Bu kullanıcı zaten bu şirkete atanmış. Mevcut atamayı güncellemek için önce mevcut atamayı kaldırın.';
      }
      
      showToast(errorMessage, 'error');
      
      // Detaylı hata loglama
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        request: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
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

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      message: 'Bu şirketi silmek istediğinizden emin misiniz?',
      title: 'Şirket Sil',
      confirmText: 'Sil',
      cancelText: 'İptal',
    });
    
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const openManagerModal = async (company: Company) => {
    setSelectedCompany(company);
    setSelectedManager('');
    setIsManagerModalOpen(true);
    
    // Mevcut yöneticileri ve yönetici adaylarını yükle
    try {
      const managersRes = await companyBranchApi.getCompanyManagers(company._id);
      
      // Mevcut yöneticileri ayarla (bu şirkete atanmış ve rolü "şirket yöneticisi" olanlar)
      if (managersRes?.managers) {
        setCompanyManagers(managersRes.managers);
      } else {
        setCompanyManagers([]);
      }
      
      // Tüm kullanıcıları getir ve rolü "şirket yöneticisi" olanları filtrele
      const allUsersRes = await authApi.getUsers();
      if (allUsersRes?.users) {
        const companyManagerRoleUsers = allUsersRes.users.filter((user: any) => {
          const role = typeof user.role === 'string' ? null : user.role;
          const roleName = role?.name?.toLowerCase() || '';
          return roleName === 'şirket yöneticisi' || roleName === 'şirket-yöneticisi' || 
                 roleName === 'sirket yoneticisi' || roleName === 'sirket-yoneticisi';
        });
        
        // Mevcut yöneticilerin ID'lerini al
        const currentManagerIds = managersRes?.managers?.map((m: any) => {
          const user = typeof m.user === 'string' ? null : m.user;
          return typeof user === 'string' ? user : user?._id || user?.id;
        }) || [];
        
        // Henüz bu şirkete atanmamış olan yönetici adaylarını göster
        const available = companyManagerRoleUsers.filter((user: any) => {
          const userId = user._id || user.id;
          return !currentManagerIds.includes(userId);
        });
        
        setAvailableManagers(available);
      } else {
        setAvailableManagers([]);
      }
    } catch (error) {
      console.error('Yönetici yüklenemedi:', error);
      setCompanyManagers([]);
      setAvailableManagers([]);
    }
  };

  const handleAssignManager = () => {
    if (selectedCompany && selectedManager) {
      assignManagerMutation.mutate({ 
        userId: selectedManager, 
        companyId: selectedCompany._id 
      });
    }
  };

  const openEditModal = async (company: Company) => {
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
    
    // İl seçimini ayarla ve ilçeleri yükle
    if (company.province) {
      const province = provinces.find(p => p.name === company.province);
      if (province) {
        setSelectedProvinceId(province.id);
        
        // İlçeleri yükle
        try {
          const districtsData = await turkiyeApi.getDistrictsByProvince(province.id);
          setDistricts(districtsData);
          
          // İlçe seçimini ayarla ve mahalleleri yükle
          if (company.district) {
            const district = districtsData.find((d: District) => d.name === company.district);
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

  if (isLoading) {
    return <div className="text-gray-900 dark:text-white">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Şirketler</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yeni Şirket</h3>
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mahalle
                      </label>
                      <select
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value, street: '' })}
                        disabled={!selectedDistrictId}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500"
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
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Şirket Düzenle</h3>
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
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
                        required
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mahalle
                      </label>
                      <select
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value, street: '' })}
                        disabled={!selectedDistrictId}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500"
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

      {/* Manager Modal */}
      {isManagerModalOpen && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Yöneticiler: {selectedCompany?.name}
              </h3>
              <div className="space-y-4">
                {companyManagers.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
                      Mevcut Yöneticiler ({companyManagers.length})
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {companyManagers.map((manager, index) => {
                        const user = typeof manager.user === 'string' ? null : manager.user;
                        if (!user) return null;
                        
                        return (
                          <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    {user?.name?.charAt(0).toUpperCase() || '?'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {user?.name || 'Bilinmiyor'}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                  ✉️ {user?.email || 'Email bulunamadı'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {companyManagers.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">Henüz yönetici atanmamış.</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsManagerModalOpen(false);
                      setSelectedManager('');
                      setSelectedCompany(null);
                      setCompanyManagers([]);
                      setAvailableManagers([]);
                    }}
                  >
                    Kapat
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
