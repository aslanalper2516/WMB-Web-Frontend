import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyBranchApi } from '../../api/companyBranch';
import { userCompanyBranchApi } from '../../api/userCompanyBranch';
import { categoryProductApi } from '../../api/categoryProduct';
import { authApi } from '../../api/auth';
import { turkiyeApi, type Province, type District, type Neighborhood } from '../../api/turkiyeApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { Plus, Edit, Trash2, ShoppingCart, UserCog, ChevronDown, ChevronRight, Folder, FileText } from 'lucide-react';
import type { Branch, CreateBranchRequest, SalesMethod, BranchSalesMethod, SalesMethodCategory, UserCompanyBranch, Company } from '../../types';

export const Branches: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSalesMethodsModalOpen, setIsSalesMethodsModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [branchManagers, setBranchManagers] = useState<any[]>([]);
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
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
  const [selectedSalesMethods, setSelectedSalesMethods] = useState<string[]>([]); // Çoklu seçim için
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(''); // Kategori seçimi
  const [categorySalesMethods, setCategorySalesMethods] = useState<SalesMethod[]>([]); // Seçili kategorinin satış yöntemleri
  const [isApplyingToAllBranches, setIsApplyingToAllBranches] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set()); // Açık kategoriler
  
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
    queryFn: () => authApi.getUsers(),
  });

  // Satış yöntemi kategorilerini yükle
  const { data: categoriesData } = useQuery({
    queryKey: ['sales-method-categories'],
    queryFn: () => categoryProductApi.getSalesMethodCategories(),
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
    mutationFn: ({ userId, companyId, branchId }: { userId: string; companyId: string; branchId: string }) => {
      const requestData = {
        user: userId,
        company: companyId,
        branch: branchId
      };
      return userCompanyBranchApi.assignUserToCompanyBranch(requestData);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['userCompanyBranches'] });
      setSelectedManager('');
      showToast('Yönetici başarıyla atandı.', 'success');
      
      // Yöneticiler listesini yenile
      if (selectedBranch) {
        try {
          const managersRes = await companyBranchApi.getBranchManagers(selectedBranch._id);
          if (managersRes?.managers) {
            setBranchManagers(managersRes.managers);
          }
          
          // Available managers listesini de güncelle
          const companyId = typeof selectedBranch.company === 'string' 
            ? selectedBranch.company 
            : selectedBranch.company._id;
          
          const [allUsersRes, companyUsersRes] = await Promise.all([
            authApi.getUsers(),
            userCompanyBranchApi.getCompanyUsers(companyId)
          ]);
          
          if (allUsersRes?.users) {
            const branchManagerRoleUsers = allUsersRes.users.filter((user: any) => {
              const role = typeof user.role === 'string' ? null : user.role;
              const roleName = role?.name?.toLowerCase() || '';
              return roleName === 'şube yöneticisi' || roleName === 'şube-yöneticisi' || 
                     roleName === 'sube yoneticisi' || roleName === 'sube-yoneticisi';
            });
            
            const companyUserIds = companyUsersRes?.assignments
              ?.filter((ucb: UserCompanyBranch) => ucb.isActive)
              ?.map((ucb: UserCompanyBranch) => {
                const user = typeof ucb.user === 'string' ? null : ucb.user;
                return typeof user === 'string' ? user : user?._id || user?.id;
              }) || [];
            
            const currentManagerIds = managersRes?.managers?.map((m: any) => {
              const user = typeof m.user === 'string' ? null : m.user;
              return typeof user === 'string' ? user : user?._id || user?.id;
            }) || [];
            
            const available = branchManagerRoleUsers.filter((user: any) => {
              const userId = user._id || user.id;
              return companyUserIds.includes(userId) && !currentManagerIds.includes(userId);
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
        errorMessage = 'Bu kullanıcı zaten bu şubeye atanmış. Mevcut atamayı güncellemek için önce mevcut atamayı kaldırın.';
      }
      // Eğer hata mesajında "zaten" veya "atanmış" geçiyorsa
      else if (errorMessage.includes('zaten') || errorMessage.includes('atanmış')) {
        errorMessage = 'Bu kullanıcı zaten bu şubeye atanmış. Mevcut atamayı güncellemek için önce mevcut atamayı kaldırın.';
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


  const assignSalesMethodMutation = useMutation({
    mutationFn: ({ branchId, salesMethodId }: { branchId: string; salesMethodId: string }) =>
      categoryProductApi.assignSalesMethodToBranch(branchId, { salesMethod: salesMethodId }),
    onSuccess: () => {
      refetchBranchSalesMethods();
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

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      message: 'Bu şubeyi silmek istediğinizden emin misiniz?',
      title: 'Şube Sil',
      confirmText: 'Sil',
      cancelText: 'İptal',
    });
    
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const openManagerModal = async (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedManager('');
    setIsManagerModalOpen(true);
    
    // Mevcut yöneticileri ve yönetici adaylarını yükle
    try {
      const companyId = typeof branch.company === 'string' ? branch.company : branch.company._id;
      const managersRes = await companyBranchApi.getBranchManagers(branch._id);
      
      // Mevcut yöneticileri ayarla (bu şubeye atanmış ve rolü "şube yöneticisi" olanlar)
      if (managersRes?.managers) {
        setBranchManagers(managersRes.managers);
      } else {
        setBranchManagers([]);
      }
      
      // Tüm kullanıcıları getir ve rolü "şube yöneticisi" olanları filtrele
      const allUsersRes = await authApi.getUsers();
      if (allUsersRes?.users) {
        const branchManagerRoleUsers = allUsersRes.users.filter((user: any) => {
          const role = typeof user.role === 'string' ? null : user.role;
          const roleName = role?.name?.toLowerCase() || '';
          return roleName === 'şube yöneticisi' || roleName === 'şube-yöneticisi' || 
                 roleName === 'sube yoneticisi' || roleName === 'sube-yoneticisi';
        });
        
        // Bu şirkete atanmış olanları kontrol et
        const companyUsersRes = await userCompanyBranchApi.getCompanyUsers(companyId);
        const companyUserIds = companyUsersRes?.assignments
          ?.filter((ucb: UserCompanyBranch) => ucb.isActive)
          ?.map((ucb: UserCompanyBranch) => {
            const user = typeof ucb.user === 'string' ? null : ucb.user;
            return typeof user === 'string' ? user : user?._id || user?.id;
          }) || [];
        
        // Mevcut yöneticilerin ID'lerini al
        const currentManagerIds = managersRes?.managers?.map((m: any) => {
          const user = typeof m.user === 'string' ? null : m.user;
          return typeof user === 'string' ? user : user?._id || user?.id;
        }) || [];
        
        // Bu şirkete atanmış VE henüz bu şubeye atanmamış olan yönetici adaylarını göster
        const available = branchManagerRoleUsers.filter((user: any) => {
          const userId = user._id || user.id;
          return companyUserIds.includes(userId) && !currentManagerIds.includes(userId);
        });
        
        setAvailableManagers(available);
      } else {
        setAvailableManagers([]);
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
      setBranchManagers([]);
      setAvailableManagers([]);
    }
  };

  const handleAssignManager = () => {
    if (selectedBranch && selectedManager) {
      const companyId = typeof selectedBranch.company === 'string' 
        ? selectedBranch.company 
        : selectedBranch.company._id;
      assignManagerMutation.mutate({ 
        userId: selectedManager, 
        companyId: companyId,
        branchId: selectedBranch._id
      });
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
    setSelectedSalesMethods([]);
    setSelectedCategoryId('');
    setCategorySalesMethods([]);
    setIsApplyingToAllBranches(false);
    setExpandedCategories(new Set()); // Kategorileri sıfırla, ilk yüklemede açılacak
  };

  // Kategori seçildiğinde o kategorinin satış yöntemlerini yükle
  const loadCategorySalesMethods = async (categoryId: string) => {
    if (!categoryId) {
      setCategorySalesMethods([]);
      return;
    }
    try {
      const response = await categoryProductApi.getCategorySalesMethods(categoryId);
      // Şubeye atanmamış olanları filtrele
      const availableMethods = response.methods.filter((sm: SalesMethod) => 
        !branchSalesMethodsData?.salesMethods?.some((bsm: BranchSalesMethod) => 
          bsm.salesMethod && bsm.salesMethod._id === sm._id
        )
      );
      setCategorySalesMethods(availableMethods);
    } catch (error) {
      console.error('Kategori satış yöntemleri yüklenemedi:', error);
      setCategorySalesMethods([]);
    }
  };

  // Kategori değiştiğinde satış yöntemlerini yükle
  useEffect(() => {
    if (selectedCategoryId && isSalesMethodsModalOpen) {
      loadCategorySalesMethods(selectedCategoryId);
    }
  }, [selectedCategoryId, isSalesMethodsModalOpen]);

  // Modal açıldığında veya şube satış yöntemleri değiştiğinde listeyi yenile
  useEffect(() => {
    if (selectedCategoryId && isSalesMethodsModalOpen && branchSalesMethodsData) {
      loadCategorySalesMethods(selectedCategoryId);
    }
  }, [branchSalesMethodsData, selectedCategoryId, isSalesMethodsModalOpen]);

  // Şubeye atanmış satış yöntemlerini kategorilere göre grupla
  const groupedBranchSalesMethods = useMemo(() => {
    if (!categoriesData?.categories || !branchSalesMethodsData?.salesMethods) {
      return [];
    }

    const validMethods = branchSalesMethodsData.salesMethods.filter(
      (bsm: BranchSalesMethod) => bsm.salesMethod
    );

    return categoriesData.categories
      .filter(cat => cat.isActive)
      .map(category => {
        const methods = validMethods.filter((bsm: BranchSalesMethod) => {
          if (!bsm.salesMethod) return false;
          const categoryId = typeof bsm.salesMethod.category === 'string' 
            ? bsm.salesMethod.category 
            : bsm.salesMethod.category?._id;
          return categoryId === category._id;
        });

        return {
          category,
          branchSalesMethods: methods,
        };
      })
      .filter(item => item.branchSalesMethods.length > 0) // Sadece satış yöntemi olan kategorileri göster
      .sort((a, b) => a.category.name.localeCompare(b.category.name));
  }, [categoriesData, branchSalesMethodsData]);

  // İlk yüklemede tüm kategorileri aç
  useEffect(() => {
    if (groupedBranchSalesMethods.length > 0 && expandedCategories.size === 0 && isSalesMethodsModalOpen) {
      setExpandedCategories(new Set(groupedBranchSalesMethods.map(item => item.category._id)));
    }
  }, [groupedBranchSalesMethods, isSalesMethodsModalOpen]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };


  const handleAssignSalesMethod = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedBranch || selectedSalesMethods.length === 0) return;
    
    try {
      if (isApplyingToAllBranches && selectedBranch.company) {
        // Tüm şubelere uygula
        const companyId = typeof selectedBranch.company === 'string' 
          ? selectedBranch.company 
          : selectedBranch.company?._id;
        const companyBranches = branchesData?.branches?.filter(b => {
          const branchCompanyId = typeof b.company === 'string' ? b.company : b.company?._id;
          return branchCompanyId === companyId;
        }) || [];
        
        // Her şube için toplu atama
        const results = await Promise.allSettled(
          companyBranches.map(branch => 
            categoryProductApi.assignSalesMethodsToBranch(branch._id, { salesMethods: selectedSalesMethods })
          )
        );
        
        const errors = results
          .map((result, index) => {
            if (result.status === 'rejected') {
              return { branch: companyBranches[index].name, error: result.reason };
            }
            if (result.value.errors && result.value.errors.length > 0) {
              return { branch: companyBranches[index].name, errors: result.value.errors };
            }
            return null;
          })
          .filter(Boolean);
        
        if (errors.length > 0) {
          showToast(`Satış yöntemleri atandı. Bazı şubelerde hata oluştu: ${errors.map((e: any) => e.branch).join(', ')}`, 'warning');
        } else {
          showToast('Satış yöntemleri tüm şubelere başarıyla atandı!', 'success');
        }
        
        queryClient.invalidateQueries({ queryKey: ['branchSalesMethods'] });
      } else {
        // Sadece seçili şubeye ata
        const result = await categoryProductApi.assignSalesMethodsToBranch(selectedBranch._id, { 
          salesMethods: selectedSalesMethods 
        });
        
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map((e: any) => e.error).join(', ');
          showToast(`Satış yöntemleri atandı. Bazı hatalar oluştu: ${errorMessages}`, 'warning');
        } else {
          showToast('Satış yöntemleri başarıyla atandı!', 'success');
        }
        
        refetchBranchSalesMethods();
      }
      
      // State'leri temizle
      setSelectedSalesMethods([]);
      setSelectedCategoryId('');
      setCategorySalesMethods([]);
      setIsApplyingToAllBranches(false);
    } catch (error: any) {
      console.error('Satış yöntemi atama hatası:', error);
      showToast(`Satış yöntemi atanırken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`, 'error');
    }
  };

  const handleRemoveSalesMethod = async (salesMethodId: string) => {
    if (selectedBranch) {
      const confirmed = await confirm({
        message: 'Bu satış yöntemini şubeden kaldırmak istediğinizden emin misiniz?',
        title: 'Satış Yöntemi Kaldır',
        confirmText: 'Kaldır',
        cancelText: 'İptal',
      });
      
      if (!confirmed) return;
      removeSalesMethodMutation.mutate({
        branchId: selectedBranch._id,
        salesMethodId
      });
    }
  };

  const columns = [
    { key: 'name' as keyof Branch, title: 'Ad' },
    { 
      key: 'company' as keyof Branch, 
      title: 'Şirket',
      render: (value: string | Company | undefined) => {
        if (!value) return '-';
        if (typeof value === 'string') return value;
        return value.name;
      }
    },
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
                {/* Mevcut Satış Yöntemleri - Hiyerarşik Görünüm */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Mevcut Satış Yöntemleri</h4>
                  {groupedBranchSalesMethods.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">Bu şubeye henüz satış yöntemi atanmamış.</p>
                  ) : (
                    <div className="space-y-3">
                      {groupedBranchSalesMethods.map(({ category, branchSalesMethods }) => {
                        const isExpanded = expandedCategories.has(category._id);
                        return (
                          <Card key={category._id} className="overflow-hidden">
                            <CardContent className="p-0">
                              {/* Kategori Header */}
                              <div
                                className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                onClick={() => toggleCategory(category._id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3 flex-1">
                                    {isExpanded ? (
                                      <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                    ) : (
                                      <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                    )}
                                    <Folder className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                          <div>
                                      <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                                      {category.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                            )}
                          </div>
                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                                      {branchSalesMethods.length} satış yöntemi
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Kategori Altındaki Satış Yöntemleri */}
                              {isExpanded && (
                                <div className="bg-white dark:bg-gray-800">
                                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {branchSalesMethods.map((branchSalesMethod: BranchSalesMethod) => {
                                      const salesMethod = branchSalesMethod.salesMethod;
                                      if (!salesMethod) return null;
                                      
                                      return (
                                        <div
                                          key={branchSalesMethod._id}
                                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3 flex-1">
                                              <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                                              <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                  <h4 className="font-medium text-gray-900 dark:text-white">{salesMethod.name}</h4>
                                                  {salesMethod.isActive !== false && (
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                      Aktif
                                                    </span>
                                                  )}
                                                </div>
                                                {salesMethod.description && (
                                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{salesMethod.description}</p>
                                                )}
                                                {salesMethod.createdAt && (
                                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Oluşturulma: {new Date(salesMethod.createdAt).toLocaleDateString('tr-TR')}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="danger"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRemoveSalesMethod(salesMethod._id);
                                                }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Yeni Satış Yöntemi Atama */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Yeni Satış Yöntemi Ata</h4>
                  
                  {/* Kategori Seçimi */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kategori Seçin *
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => {
                        setSelectedCategoryId(e.target.value);
                        setSelectedSalesMethods([]); // Kategori değişince seçimleri temizle
                      }}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Kategori Seçin</option>
                      {categoriesData?.categories?.filter(cat => cat.isActive).map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    </div>
                  
                  {/* Seçili Kategorinin Satış Yöntemleri */}
                  {selectedCategoryId && (
                    <div className="space-y-3 mb-4">
                      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md p-3">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm text-blue-800 dark:text-blue-400">
                            Seçili kategorinin satış yöntemleri:
                          </p>
                          {categorySalesMethods.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedSalesMethods.length === categorySalesMethods.length) {
                                  // Tümünü kaldır
                                  setSelectedSalesMethods([]);
                                } else {
                                  // Tümünü seç
                                  setSelectedSalesMethods(categorySalesMethods.map(m => m._id));
                                }
                              }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {selectedSalesMethods.length === categorySalesMethods.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                            </button>
                          )}
                        </div>
                        
                        {categorySalesMethods.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedCategoryId ? 'Bu kategoride atanabilecek satış yöntemi kalmadı.' : 'Önce bir kategori seçin.'}
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {categorySalesMethods.map((method: SalesMethod) => {
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
                        )}
                      </div>
                    </div>
                  )}
                  
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
                {branchManagers.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
                      Mevcut Yöneticiler ({branchManagers.length})
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {branchManagers.map((manager, index) => {
                        const user = typeof manager.user === 'string' ? null : manager.user;
                        if (!user) return null;
                        
                        return (
                          <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Yeni Yönetici Seç
                  </label>
                  <select
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Yönetici Seçin</option>
                    {availableManagers.map((user) => {
                      const userId = user._id || user.id;
                      if (!userId) return null;
                      
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
                      setBranchManagers([]);
                      setAvailableManagers([]);
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
