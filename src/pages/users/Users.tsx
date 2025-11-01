import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import { companyBranchApi } from '../../api/companyBranch';
import { userCompanyBranchApi } from '../../api/userCompanyBranch';
import { rolePermissionApi } from '../../api/rolePermission';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { Building2, MapPin, CheckSquare, Square } from 'lucide-react';
import type { User, RegisterRequest, UpdateUserRequest, Company, Branch, Role, UserCompanyBranch } from '../../types';


// Detaylı error logging (development için)
const logError = (error: any, context: string) => {
  if (import.meta.env.DEV) {
    console.error(`[${context}] Error Details:`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      dataType: typeof error.response?.data,
      dataStringified: typeof error.response?.data === 'object' ? JSON.stringify(error.response?.data, null, 2) : error.response?.data,
      request: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      },
      // Backend service dosyalarından bilinen hata mesajları için referans
      knownBackendErrors: {
        superAdmin: 'Super-admin rolüne sahip kullanıcılar şirket veya şubeye atanamaz.',
        duplicate: 'Bu kullanıcı zaten bu şirket/şubeye atanmış',
        multipleCompanies: 'Bu kullanıcı zaten başka bir şirkete atanmış. Bir kullanıcı sadece bir şirkete ait olabilir.',
        companyManagerBranch: 'Şirket yöneticisi rolüne sahip kullanıcılar şubeye atanamaz. Sadece şirket seviyesinde atanabilirler.'
      }
    });
    
    // Özel olarak response body'yi de göster
    if (error.response?.data) {
      console.error(`[${context}] Response Body:`, error.response.data);
      if (typeof error.response.data === 'string') {
        console.error(`[${context}] Response Body (String):`, error.response.data);
      }
    }
    
    // Request data'dan kullanıcı ve rol bilgisini çıkar (super-admin kontrolü için)
    if (error.config?.data) {
      try {
        const requestData = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data;
        if (requestData.user) {
          console.warn(`[${context}] Request User ID:`, requestData.user);
          console.warn(`[${context}] Note: Backend'de bu kullanıcının rolü kontrol ediliyor. Super-admin kontrolü backend'de yapılıyor.`);
        }
      } catch (e) {
        // JSON parse hatası, önemli değil
      }
    }
  }
};

export const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBranchesModal, setShowBranchesModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [userCompanyBranches, setUserCompanyBranches] = useState<Record<string, UserCompanyBranch[]>>({});
  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
    role: ''
  });
  const [assignFormData, setAssignFormData] = useState({
    company: '',
    branch: '' as string | string[]
  });
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  // Modal açıldığında formu tamamen temizle
  useEffect(() => {
    if (showCreateModal) {
      setFormData({ name: '', email: '', password: '', role: '' });
      setAssignFormData({ company: '', branch: '' });
      setSelectedBranches([]);
      setSelectedUser(null);
      setCreateFormKey(prev => prev + 1); // Form'u yeniden render etmek için key'i değiştir
    }
  }, [showCreateModal]);

  const { data: usersData, isLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers(),
  });

  // Fetch companies, branches, and roles for dropdowns
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyBranchApi.getCompanies(),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => companyBranchApi.getBranches(),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolePermissionApi.getRoles(),
  });

  // Error handling helper function with access to usersData and rolesData
  const getErrorMessage = useMemo(() => {
    return (error: any, defaultMessage: string = 'Bir hata oluştu.', context?: string): string => {
      // Network hatası
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return 'Backend sunucusuna bağlanılamıyor. Lütfen backend\'in çalıştığından emin olun.';
      }

      // Timeout hatası
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
      }

      // HTTP hata yanıtı var
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        const requestUrl = error.config?.url || '';
        const requestMethod = error.config?.method || '';

        // 400 - Bad Request (Validation errors)
        if (status === 400) {
          if (typeof errorData === 'string') {
            return errorData;
          }
          if (errorData?.message) {
            return errorData.message;
          }
          if (errorData?.error) {
            return errorData.error;
          }
          if (errorData?.errors && Array.isArray(errorData.errors)) {
            return `Validasyon hataları: ${errorData.errors.map((e: any) => e.message || e).join(', ')}`;
          }
          if (errorData?.errors && typeof errorData.errors === 'object') {
            const validationErrors = Object.entries(errorData.errors)
              .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ');
            return `Validasyon hataları: ${validationErrors}`;
          }
          return 'Geçersiz istek. Lütfen bilgileri kontrol edin.';
        }

        // 401 - Unauthorized
        if (status === 401) {
          return 'Yetkiniz bulunmuyor. Lütfen giriş yapın.';
        }

        // 403 - Forbidden
        if (status === 403) {
          return 'Bu işlem için yetkiniz bulunmuyor.';
        }

        // 404 - Not Found
        if (status === 404) {
          return 'İstenen kayıt bulunamadı.';
        }

        // 409 - Conflict (Duplicate entry)
        if (status === 409) {
          if (typeof errorData === 'string' && (errorData.includes('zaten') || errorData.includes('atanmış'))) {
            return 'Bu kullanıcı zaten bu şirket/şubeye atanmış. Mevcut atamayı güncellemek için önce mevcut atamayı kaldırın.';
          }
          return errorData?.message || errorData?.error || 'Bu kayıt zaten mevcut.';
        }

        // 500 - Internal Server Error
        if (status === 500) {
          // Backend'den gelen tüm olası mesaj kaynaklarını kontrol et
          let errorText = '';
          
          // Önce errorData'yı kontrol et (string, object, vs.)
          if (typeof errorData === 'string') {
            errorText = errorData;
          } else if (errorData) {
            // Object ise message, error, veya diğer alanları kontrol et
            errorText = errorData.message || 
                       errorData.error || 
                       errorData.details ||
                       errorData.msg ||
                       (Array.isArray(errorData.errors) ? errorData.errors.map((e: any) => e.message || e).join(', ') : '') ||
                       '';
          }
          
          // Request context'e göre bilinen hata senaryolarını kontrol et
          // User-company-branch assignment endpoint'leri için özel kontroller
          if (requestUrl.includes('user-company-branches') && requestMethod === 'post') {
            // Bu endpoint'te backend'den bilinen hata mesajları:
            // 1. "Super-admin rolüne sahip kullanıcılar şirket veya şubeye atanamaz."
            // 2. "Bu kullanıcı zaten bu şirket/şubeye atanmış"
            // 3. "Bu kullanıcı zaten başka bir şirkete atanmış. Bir kullanıcı sadece bir şirkete ait olabilir."
            // 4. "Şirket yöneticisi rolüne sahip kullanıcılar şubeye atanamaz. Sadece şirket seviyesinde atanabilirler."
            
            // Eğer generic "Internal Server Error" geldiyse, request data'dan kullanıcı bilgisini çıkar ve kontrol et
            if (errorText === 'Internal Server Error' || !errorText) {
              // Request data'dan kullanıcı ID'sini çıkar
              let requestUserId = '';
              try {
                const requestData = typeof error.config?.data === 'string' 
                  ? JSON.parse(error.config.data) 
                  : (error.config?.data || {});
                requestUserId = requestData.user || '';
              } catch (e) {
                // JSON parse hatası, önemli değil
              }
              
              // Eğer user ID varsa, kullanıcının rolünü kontrol et
              if (requestUserId) {
                // Kullanıcı bilgisini usersData'dan bul
                const user = usersData?.users?.find((u: User) => 
                  (u._id === requestUserId) || (u.id === requestUserId)
                );
                
                if (user) {
                  // Kullanıcının rolünü kontrol et
                  const userRole = typeof user.role === 'string' 
                    ? rolesData?.roles?.find((r: Role) => r._id === user.role) 
                    : user.role;
                  
                  if (userRole) {
                    const roleName = (typeof userRole === 'object' ? userRole.name : userRole).toLowerCase().trim();
                    
                    // Super-admin kontrolü
                    if (roleName === 'super-admin' || roleName === 'super admin') {
                      return 'Super-admin rolüne sahip kullanıcılar şirket veya şubeye atanamaz.';
                    }
                    
                    // Şirket yöneticisi kontrolü (şube seçilmişse)
                    if ((roleName === 'şirket-yöneticisi' || roleName === 'şirket yöneticisi' || 
                         roleName === 'sirket-yoneticisi' || roleName === 'sirket yoneticisi')) {
                      const requestData = typeof error.config?.data === 'string' 
                        ? JSON.parse(error.config.data) 
                        : (error.config?.data || {});
                      
                      if (requestData.branch) {
                        return 'Şirket yöneticisi rolüne sahip kullanıcılar şubeye atanamaz. Sadece şirket seviyesinde atanabilirler.';
                      }
                    }
                  }
                }
              }
              
              // Eğer hala mesaj bulamadıysak, genel mesaj göster
              return 'Kullanıcı atanırken bir hata oluştu. Lütfen kullanıcının rolünü ve mevcut atamalarını kontrol edin.';
            }
            
            // Super-admin kontrolü (mesaj içinde geçiyorsa)
            if (errorText.toLowerCase().includes('super-admin') || 
                errorText.toLowerCase().includes('super admin')) {
              return 'Super-admin rolüne sahip kullanıcılar şirket veya şubeye atanamaz.';
            }
            
            // Duplicate assignment kontrolü
            if (errorText.includes('zaten') || errorText.includes('atanmış')) {
              return 'Bu kullanıcı zaten bu şirket/şubeye atanmış. Mevcut atamayı güncellemek için önce mevcut atamayı kaldırın.';
            }
            
            // Başka şirkete atanmış kontrolü
            if (errorText.includes('başka bir şirkete') || errorText.includes('sadece bir şirkete')) {
              return 'Bu kullanıcı zaten başka bir şirkete atanmış. Bir kullanıcı sadece bir şirkete ait olabilir.';
            }
            
            // Şirket yöneticisi şubeye atanamaz kontrolü
            if (errorText.includes('şirket yöneticisi') && errorText.includes('şubeye atanamaz')) {
              return 'Şirket yöneticisi rolüne sahip kullanıcılar şubeye atanamaz. Sadece şirket seviyesinde atanabilirler.';
            }
            
            // Generic mesaj varsa göster
            if (errorText && errorText !== 'Internal Server Error') {
              return errorText;
            }
          }
          
          // Diğer endpoint'ler için genel kontrol
          // Super-admin kontrolü
          if (errorText.toLowerCase().includes('super-admin') || 
              errorText.toLowerCase().includes('super admin')) {
            return 'Super-admin rolüne sahip kullanıcılar şirket veya şubeye atanamaz.';
          }
          
          // Duplicate assignment kontrolü
          if (errorText.includes('zaten') || errorText.includes('atanmış')) {
            return 'Bu kullanıcı zaten bu şirket/şubeye atanmış. Mevcut atamayı güncellemek için önce mevcut atamayı kaldırın.';
          }
          
          // Generic "Internal Server Error" string'i geldiyse
          if (errorText && errorText !== 'Internal Server Error') {
            return errorText;
          }
          
          return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
        }

        // Diğer 5xx hatalar
        if (status >= 500) {
          // Diğer 5xx hatalar için de aynı parse mantığını uygula
          let errorText = '';
          if (typeof errorData === 'string') {
            errorText = errorData;
          } else if (errorData) {
            errorText = errorData.message || errorData.error || errorData.details || '';
          }
          
          if (errorText && errorText !== 'Internal Server Error') {
            return errorText;
          }
          
          return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
        }

        // 4xx hatalar (diğer)
        if (status >= 400 && status < 500) {
          if (typeof errorData === 'string') {
            return errorData;
          }
          return errorData?.message || errorData?.error || 'İstek hatası. Lütfen bilgileri kontrol edin.';
        }

        // Response data parse et
        if (typeof errorData === 'string') {
          return errorData;
        }
        if (errorData?.message) {
          return errorData.message;
        }
        if (errorData?.error) {
          return errorData.error;
        }
        if (errorData?.details) {
          return errorData.details;
        }
      }

      // Error message var mı kontrol et (Axios error mesajı)
      if (error.message) {
        // Eğer error.message içinde bilinen hata mesajları varsa onları kontrol et
        const messageLower = error.message.toLowerCase();
        if (messageLower.includes('super-admin') || messageLower.includes('super admin')) {
          return 'Super-admin rolüne sahip kullanıcılar şirket veya şubeye atanamaz.';
        }
        return error.message;
      }

      return defaultMessage;
    };
  }, [usersData, rolesData]);

  // Load user company branches for all users
  useEffect(() => {
    if (usersData?.users) {
      const loadUserCompanyBranches = async () => {
        const branchesMap: Record<string, UserCompanyBranch[]> = {};
        await Promise.allSettled(
          usersData.users.map(async (user: User) => {
            const userId = user._id || user.id;
            if (!userId) {
              return; // Kullanıcı ID'si yoksa atla
            }
            try {
              const res = await userCompanyBranchApi.getUserCompanies(userId);
              branchesMap[userId] = res?.assignments?.filter(ucb => ucb.isActive) || [];
            } catch (error) {
              // Hata durumunda sessizce boş array set et
              logError(error, `Load User Company Branches for User ${userId}`);
              branchesMap[userId] = [];
            }
          })
        );
        setUserCompanyBranches(branchesMap);
      };
      loadUserCompanyBranches();
    }
  }, [usersData]);

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => authApi.register(userData),
    onSuccess: async (response) => {
      const newUser = response.user;
      const userId = newUser._id || newUser.id;
      
      // Eğer şirket seçildiyse, kullanıcıyı şirket/şubeye ata
      if (userId && assignFormData.company) {
        try {
          // Eğer hiç şube seçilmemişse sadece şirket ata
          if (selectedBranches.length === 0) {
            await userCompanyBranchApi.assignUserToCompanyBranch({
              user: userId,
              company: assignFormData.company,
              branch: null
            });
          } else {
            // Her seçili şube için ayrı atama yap
            await Promise.all(
              selectedBranches.map(branchId =>
                userCompanyBranchApi.assignUserToCompanyBranch({
                  user: userId,
                  company: assignFormData.company,
                  branch: branchId
                })
              )
            );
          }
         } catch (error: any) {
           // Atama hatası olsa bile kullanıcı oluşturuldu, sadece atama yapılamadı
           logError(error, 'Assign User to Company/Branch after create');
           const assignErrorMessage = getErrorMessage(error, 'Kullanıcı atanırken bir hata oluştu.', 'Assign User to Company/Branch');
           showToast(`Kullanıcı oluşturuldu ancak şirket/şubeye atama yapılamadı: ${assignErrorMessage}`, 'warning');
         }
      }
      
      // State'leri temizle
      setSelectedBranches([]);
      
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userCompanyBranches'] });
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: '' });
      setAssignFormData({ company: '', branch: '' });
      showToast('Kullanıcı başarıyla oluşturuldu.', 'success');
    },
    onError: (error: any) => {
      logError(error, 'Create User');
      const errorMessage = getErrorMessage(error, 'Kullanıcı oluşturulurken bir hata oluştu.', 'Create User');
      showToast(errorMessage, 'error');
    },
  });


  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => authApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userCompanyBranches'] });
      setSelectedUser(null);
      showToast('Kullanıcı başarıyla silindi.', 'success');
    },
    onError: (error: any) => {
      logError(error, 'Delete User');
      const errorMessage = getErrorMessage(error, 'Kullanıcı silinirken bir hata oluştu.', 'Delete User');
      showToast(errorMessage, 'error');
    },
  });


  // Get primary company and branch for display
  const getPrimaryCompanyBranch = useMemo(() => {
    return (userId: string) => {
      if (!userId) return { company: null, branch: null };
      const branches = userCompanyBranches[userId] || [];
      if (branches.length === 0) return { company: null, branch: null };
      
      // Priority: first active assignment with company
      const first = branches[0];
      const company = typeof first.company === 'string' ? null : first.company;
      const branch = typeof first.branch === 'string' || !first.branch ? null : first.branch;
      return { company, branch };
    };
  }, [userCompanyBranches]);

  const handleEditUser = async (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: typeof user.role === 'string' ? user.role : user.role?._id || ''
    });
    
    // Kullanıcının mevcut şirket/şube atamalarını yükle
    const userId = user._id || user.id;
    if (userId) {
      try {
        const res = await userCompanyBranchApi.getUserCompanies(userId);
        const activeAssignments = res?.assignments?.filter(ucb => ucb.isActive) || [];
        
        // Tüm aktif atamaları işle
        if (activeAssignments.length > 0) {
          // Şirket bilgisini ilk atamadan al (tüm atamaların aynı şirkete ait olması beklenir)
          const firstAssignment = activeAssignments[0];
          const companyId = typeof firstAssignment.company === 'string' 
            ? firstAssignment.company 
            : firstAssignment.company?._id || '';
          
          // Tüm şube atamalarını bul
          const branchIds = activeAssignments
            .filter(ucb => {
              const branch = typeof ucb.branch === 'string' || !ucb.branch ? null : ucb.branch;
              return branch !== null;
            })
            .map(ucb => {
              const branch = typeof ucb.branch === 'string' ? ucb.branch : ucb.branch._id || '';
              return branch;
            });
          
          setAssignFormData({
            company: companyId,
            branch: branchIds.length > 0 ? branchIds[0] : '' // Geriye uyumluluk için ilk şubeyi kullan
          });
          setSelectedBranches(branchIds); // Çoklu şube seçimlerini ayarla
        } else {
          setAssignFormData({ company: '', branch: '' });
          setSelectedBranches([]);
        }
      } catch (error) {
        console.error('Kullanıcı şirket/şube bilgileri yüklenemedi:', error);
        setAssignFormData({ company: '', branch: '' });
        setSelectedBranches([]);
      }
    } else {
      setAssignFormData({ company: '', branch: '' });
      setSelectedBranches([]);
    }
    
    setShowEditModal(true);
  };

  const handleDeleteUser = async (user: User) => {
    const confirmed = await confirm(
      'Kullanıcıyı Sil',
      `${user.name} kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
    );
    if (confirmed) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleCreateUser = () => {
    // Tüm state'leri tamamen temizle
    setFormData({ name: '', email: '', password: '', role: '' });
    setAssignFormData({ company: '', branch: '' });
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  const handleShowBranches = (user: User) => {
    setSelectedUser(user);
    setShowBranchesModal(true);
  };


  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const userId = selectedUser._id || selectedUser.id;
    if (!userId) {
      showToast('Kullanıcı ID\'si bulunamadı.', 'error');
      return;
    }
    
    // Kullanıcı bilgilerini güncelle
      const { password, ...updateData } = formData;
      const finalUpdateData: UpdateUserRequest = {
        name: updateData.name,
        email: updateData.email,
        role: updateData.role
      };
      
      if (password) {
        finalUpdateData.password = password;
      }
      
    // Önce kullanıcı bilgilerini güncelle
    try {
      await authApi.updateUser(selectedUser.id, finalUpdateData);
      
      // Şirket/şube ataması durumunu yönet (sadece şirket seçildiyse)
      if (assignFormData.company) {
        try {
          const currentRes = await userCompanyBranchApi.getUserCompanies(userId);
          const existingActives = currentRes?.assignments?.filter((ucb: UserCompanyBranch) => ucb.isActive) || [];
          
          // Mevcut tüm aktif atamaları sil
          await Promise.all(
            existingActives.map(ucb => userCompanyBranchApi.deleteUserCompanyBranch(ucb._id))
          );
          
          // Yeni atamaları yap
          // Eğer hiç şube seçilmemişse sadece şirket ata
          if (selectedBranches.length === 0) {
            await userCompanyBranchApi.assignUserToCompanyBranch({
              user: userId,
              company: assignFormData.company,
              branch: null
            });
          } else {
            // Her seçili şube için ayrı atama yap
            await Promise.all(
              selectedBranches.map(branchId =>
                userCompanyBranchApi.assignUserToCompanyBranch({
                  user: userId,
                  company: assignFormData.company,
                  branch: branchId
                })
              )
            );
          }
        } catch (assignError: any) {
          // Atama hatası ayrı handle edilsin
          logError(assignError, 'Assign User to Company/Branch in Update');
          const assignErrorMessage = getErrorMessage(assignError, 'Kullanıcı atanırken bir hata oluştu.', 'Assign User to Company/Branch');
          showToast(assignErrorMessage, 'error');
          // Kullanıcı bilgileri güncellendi ama atama başarısız oldu
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['userCompanyBranches'] });
          setShowEditModal(false);
          setSelectedUser(null);
          return; // Fonksiyondan çık
        }
      }
      
      // State'leri temizle
      setSelectedBranches([]);
      setAssignFormData({ company: '', branch: '' });
      setFormData({ name: '', email: '', password: '', role: '' });
      
      // Başarılı - Tüm ilgili query'leri invalidate et ve refetch et
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['userCompanyBranches'] });
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
      
      // Kullanıcı listesini yeniden çek
      const updatedUsersData = await refetchUsers();
      
      // Kullanıcı listesi güncellendiğinde şirket/şube bilgilerini de yenile
      if (updatedUsersData?.data?.users) {
        const branchesMap: Record<string, UserCompanyBranch[]> = {};
        await Promise.allSettled(
          updatedUsersData.data.users.map(async (user: User) => {
            const userId = user._id || user.id;
            if (!userId) return;
            
            try {
              const res = await userCompanyBranchApi.getUserCompanies(userId);
              branchesMap[userId] = res?.assignments?.filter(ucb => ucb.isActive) || [];
            } catch (error) {
              branchesMap[userId] = [];
            }
          })
        );
        setUserCompanyBranches(branchesMap);
      }
      
      setShowEditModal(false);
      setSelectedUser(null);
      showToast('Kullanıcı başarıyla güncellendi.', 'success');
     } catch (error: any) {
       logError(error, 'Update User');
       const errorMessage = getErrorMessage(error, 'Kullanıcı güncellenirken bir hata oluştu.', 'Update User');
       showToast(errorMessage, 'error');
     }
  };


  // Get filtered branches for selected company
  const filteredBranches = useMemo(() => {
    if (!assignFormData.company || !branchesData?.branches) return [];
    return branchesData.branches.filter((branch: Branch) => {
      const branchCompanyId = typeof branch.company === 'string' ? branch.company : branch.company?._id;
      return branchCompanyId === assignFormData.company;
    });
  }, [assignFormData.company, branchesData]);

  const columns = [
    { key: 'name' as keyof User, title: 'Ad' },
    { key: 'email' as keyof User, title: 'E-posta' },
    { 
      key: 'role' as keyof User, 
      title: 'Rol',
      render: (value: string | { name: string }) => {
        if (typeof value === 'string') return value;
        return value?.name || '-';
      }
    },
    { 
      key: 'company' as keyof User, 
      title: 'Şirket',
      render: (_value: any, user: User) => {
        const userId = user._id || user.id;
        const { company } = getPrimaryCompanyBranch(userId || '');
        return company?.name || '-';
      }
    },
    { 
      key: 'branch' as keyof User, 
      title: 'Şube',
      render: (_value: any, user: User) => {
        const userId = user._id || user.id;
        const branches = userCompanyBranches[userId || ''] || [];
        
        // Şube olan atamaları filtrele
        const branchAssignments = branches.filter(ucb => {
          const branch = typeof ucb.branch === 'string' || !ucb.branch ? null : ucb.branch;
          return branch !== null;
        });
        
        if (branchAssignments.length === 0) return '-';
        
        // İlk şube atamayı göster
        const first = branchAssignments[0];
        const firstBranch = typeof first.branch === 'string' || !first.branch ? null : first.branch;
        
        // Birden fazla şube ilişkisi varsa badge göster
        if (branchAssignments.length > 1) {
          return (
            <div className="flex items-center gap-2">
              <span>{firstBranch?.name || '-'}</span>
              <button
                onClick={() => handleShowBranches(user)}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                title={`${branchAssignments.length} şube ilişkisi - Detayları görmek için tıklayın`}
              >
                +{branchAssignments.length - 1}
              </button>
            </div>
          );
        }
        
        return firstBranch?.name || '-';
      }
    },
    {
      key: 'createdAt' as keyof User,
      title: 'Oluşturulma',
      render: (value: string) => new Date(value).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions' as keyof User,
      title: 'İşlemler',
      render: (_value: any, user: User) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditUser(user)}
          >
            Düzenle
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteUser(user)}
          >
            Sil
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanıcılar</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kullanıcı bilgilerini görüntüleyin ve yönetin
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          + Yeni Kullanıcı Ekle
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table
            data={usersData?.users || []}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black dark:bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Yeni Kullanıcı Ekle</h2>
            <form key={`create-user-form-${createFormKey}`} onSubmit={handleSubmitCreate} className="space-y-4" autoComplete="off">
              <Input
                label="Ad"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoComplete="off"
                required
              />
              <Input
                label="E-posta"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="new-password"
                required
              />
              <Input
                label="Şifre"
                type="password"
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete="new-password"
                required
              />
              <Select
                label="Rol"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={rolesData?.map((role: Role) => ({
                  value: role._id,
                  label: role.name
                })) || []}
                placeholder="Rol seçiniz..."
                required
              />
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Şirket/Şube Ataması (Opsiyonel)
                </h3>
                <Select
                  label="Şirket"
                  value={assignFormData.company || ''}
                  onChange={(e) => {
                    setAssignFormData({ ...assignFormData, company: e.target.value, branch: '' });
                    setSelectedBranches([]); // Şirket değiştiğinde şube seçimlerini temizle
                  }}
                  options={companiesData?.companies?.map((company: Company) => ({
                    value: company._id,
                    label: company.name
                  })) || []}
                  placeholder="Şirket seçiniz (opsiyonel)..."
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Şubeler (Opsiyonel)
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-48 overflow-y-auto bg-white dark:bg-gray-700">
                    {!assignFormData.company ? (
                      <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                        Önce bir şirket seçin
                      </p>
                    ) : filteredBranches.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                        Bu şirkete ait şube bulunmuyor
                      </p>
                    ) : (
                      <div className="p-2 space-y-1">
                        {filteredBranches.map((branch: Branch) => (
                          <label
                            key={branch._id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedBranches.includes(branch._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBranches([...selectedBranches, branch._id]);
                                } else {
                                  setSelectedBranches(selectedBranches.filter(id => id !== branch._id));
                                }
                              }}
                              className="sr-only"
                            />
                            {selectedBranches.includes(branch._id) ? (
                              <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            )}
                            <span className="text-sm text-gray-900 dark:text-white">{branch.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedBranches.length > 0 ? `${selectedBranches.length} şube seçildi` : 'Birden fazla şube seçebilirsiniz'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit" loading={createUserMutation.isPending}>
                  Oluştur
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', email: '', password: '', role: '' });
                    setAssignFormData({ company: '', branch: '' });
                    setSelectedBranches([]);
                  }}
                >
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Branch Assignments Modal */}
      {showBranchesModal && selectedUser && (() => {
        const userId = selectedUser._id || selectedUser.id;
        const allAssignments = userCompanyBranches[userId || ''] || [];
        
        // Sadece şube atamalarını filtrele
        const branchAssignments = allAssignments.filter(ucb => {
          const branch = typeof ucb.branch === 'string' || !ucb.branch ? null : ucb.branch;
          return branch !== null;
        });
        
        return (
          <div className="fixed inset-0 bg-black dark:bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-300 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {selectedUser.name} - Tüm Şube Atamaları
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {branchAssignments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">Henüz şube ataması bulunmuyor.</p>
                ) : (
                  branchAssignments.map((assignment, index) => {
                    const company = typeof assignment.company === 'string' ? null : assignment.company;
                    const branch = typeof assignment.branch === 'string' || !assignment.branch ? null : assignment.branch;
                    
                    return (
                      <div 
                        key={assignment._id || index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {branch?.name || 'Şube bilgisi yok'}
                                </p>
                                {company && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Building2 className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {company.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              assignment.isActive 
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}>
                              {assignment.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(assignment.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={() => {
                    setShowBranchesModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Kapat
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black dark:bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Kullanıcı Düzenle</h2>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <Input
                label="Ad"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Şifre (boş bırakırsanız değişmez)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <Select
                label="Rol"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={rolesData?.map((role: Role) => ({
                  value: role._id,
                  label: role.name
                })) || []}
                placeholder="Rol seçiniz..."
                required
              />
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Şirket/Şube Ataması (Opsiyonel)
                </h3>
              <Select
                label="Şirket (Opsiyonel)"
                value={assignFormData.company}
                onChange={(e) => {
                  setAssignFormData({ ...assignFormData, company: e.target.value, branch: '' });
                  setSelectedBranches([]); // Şirket değiştiğinde şube seçimlerini temizle
                }}
                options={companiesData?.companies?.map((company: Company) => ({
                  value: company._id,
                  label: company.name
                })) || []}
                placeholder="Şirket seçiniz (opsiyonel)..."
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Şubeler (Opsiyonel)
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-48 overflow-y-auto bg-white dark:bg-gray-700">
                  {!assignFormData.company ? (
                    <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      Önce bir şirket seçin
                    </p>
                  ) : filteredBranches.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      Bu şirkete ait şube bulunmuyor
                    </p>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredBranches.map((branch: Branch) => (
                        <label
                          key={branch._id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBranches.includes(branch._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBranches([...selectedBranches, branch._id]);
                              } else {
                                setSelectedBranches(selectedBranches.filter(id => id !== branch._id));
                              }
                            }}
                            className="sr-only"
                          />
                          {selectedBranches.includes(branch._id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          )}
                          <span className="text-sm text-gray-900 dark:text-white">{branch.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedBranches.length > 0 ? `${selectedBranches.length} şube seçildi` : 'Birden fazla şube seçebilirsiniz'}
                </p>
              </div>
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit">
                  Güncelle
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setAssignFormData({ company: '', branch: '' });
                    setSelectedBranches([]);
                  }}
                >
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
