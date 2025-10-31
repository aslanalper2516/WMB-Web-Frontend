import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryProductApi } from '../../api/categoryProduct';
import { companyBranchApi } from '../../api/companyBranch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { Plus, Edit, Trash2, DollarSign, AlertTriangle } from 'lucide-react';
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
  const [editingBranchId, setEditingBranchId] = useState<string>('');
  const [selectedBranchTab, setSelectedBranchTab] = useState<string>(''); // branch id
  const [isApplyingToAllBranches, setIsApplyingToAllBranches] = useState(false);
  const [productPriceStatus, setProductPriceStatus] = useState<Record<string, boolean>>({}); // productId -> hasPrice
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    defaultSalesMethod: '',
    company: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

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

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => companyBranchApi.getBranches(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductRequest> }) =>
      categoryProductApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Ürün başarıyla güncellendi.', 'success');
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      setFormData({ name: '', description: '', defaultSalesMethod: '', company: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryProductApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Ürün başarıyla silindi.', 'success');
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

  // Sayfa yüklendiğinde tüm ürünlerin fiyat durumlarını kontrol et
  React.useEffect(() => {
    const checkAllProductPrices = async () => {
      if (!productsData?.products || !salesMethodsData?.methods) return;
      
      const products = productsData.products;
      const salesMethods = salesMethodsData.methods;
      
      // Tüm ürünlerin fiyatlarını paralel olarak kontrol et
      const priceCheckPromises = products.map(async (product) => {
        try {
          const pricesRes = await categoryProductApi.getProductPrices(product._id);
          const prices = pricesRes.prices || [];
          
          // Tüm satış yöntemleri için fiyat var mı kontrol et
          const hasAllPrices = salesMethods.every((method) => {
            return prices.some((price) => {
              const priceSalesMethodId = typeof price.salesMethod === 'string' 
                ? price.salesMethod 
                : price.salesMethod?._id;
              return priceSalesMethodId === method._id;
            });
          });
          
          return { productId: product._id, hasAllPrices };
        } catch (error) {
          console.error(`Ürün ${product._id} fiyat kontrolü başarısız:`, error);
          // Hata durumunda fiyat yok kabul et
          return { productId: product._id, hasAllPrices: false };
      }
      });
      
      // Tüm kontroller tamamlandığında durumu güncelle
      const results = await Promise.all(priceCheckPromises);
      const newPriceStatus: Record<string, boolean> = {};
      
      results.forEach(({ productId, hasAllPrices }) => {
        newPriceStatus[productId] = hasAllPrices;
      });
      
      setProductPriceStatus(prev => ({
        ...prev,
        ...newPriceStatus
      }));
    };
    
    checkAllProductPrices();
  }, [productsData?.products, salesMethodsData?.methods]);


  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.defaultSalesMethod) {
      showToast('Varsayılan satış yöntemi seçilmelidir!', 'warning');
      return;
    }
    
    if (!formData.company) {
      showToast('Şirket seçilmelidir!', 'warning');
      return;
    }
    
    try {
      // Ürünü oluştur (isActive default true, backend'de otomatik set edilir)
      // Fiyatlar daha sonra fiyat yönetimi modal'ından eklenebilir
      const response = await categoryProductApi.createProduct(formData);
      
      // Yeni oluşturulan ürün için fiyat uyarısı ekle
      if (response.product?._id) {
        setProductPriceStatus(prev => ({
          ...prev,
          [response.product._id]: false // Yeni ürün için fiyat yok
        }));
      }
      
      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Başarı mesajı göster
      showToast('Ürün başarıyla oluşturuldu.', 'success');
      
      // Formu temizle ve kapat
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', defaultSalesMethod: '', company: '' });
    } catch (error: any) {
      console.error('Ürün oluşturma hatası:', error);
      
      // Detaylı hata mesajı göster
      let errorMessage = 'Ürün oluşturulurken bir hata oluştu!';
      
      if (error?.response?.data?.message) {
        errorMessage = `Hata: ${error.response.data.message}`;
      } else if (error?.response?.data?.error) {
        errorMessage = `Hata: ${error.response.data.error}`;
      } else if (error?.message) {
        errorMessage = `Hata: ${error.message}`;
      }
      
      console.error('Detaylı hata bilgisi:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        requestUrl: error?.config?.url,
        requestData: error?.config?.data,
        requestMethod: error?.config?.method,
      });
      
      // Backend'den gelen hata mesajını daha detaylı göster
      if (error?.response?.data) {
        console.error('Backend hata detayı:', JSON.stringify(error.response.data, null, 2));
        
        // Backend'den gelen spesifik hata mesajını göster
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = typeof error.response.data.error === 'string' 
            ? error.response.data.error 
            : JSON.stringify(error.response.data.error);
        } else if (error.response.data.errors) {
          // Validation hataları varsa
          const validationErrors = Object.entries(error.response.data.errors)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          errorMessage = `Validasyon hatası: ${validationErrors}`;
        }
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct._id, data: formData });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      message: 'Bu ürünü silmek istediğinizden emin misiniz?',
      title: 'Ürün Sil',
      confirmText: 'Sil',
      cancelText: 'İptal',
    });
    
    if (confirmed) {
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
    
    // Ürünün şirket bilgisini al
    const productCompanyId = typeof product.company === 'string' ? product.company : product.company?._id;
    
    // İlk şubeyi seç (varsa)
    const filteredBranches = branchesData?.branches?.filter(b => {
      const branchCompanyId = typeof b.company === 'string' ? b.company : b.company?._id;
      return branchCompanyId === productCompanyId;
    }) || [];
    
    if (filteredBranches.length > 0) {
      setSelectedBranchTab(filteredBranches[0]._id);
    } else {
      setSelectedBranchTab('');
    }
    
    setEditingSalesMethodId('');
    setEditingBranchId('');
    setIsApplyingToAllBranches(false);
    
    try {
      const [pricesRes, unitsRes] = await Promise.all([
        categoryProductApi.getProductPrices(product._id),
        categoryProductApi.getCurrencyUnits(),
      ]);
      setProductPrices(pricesRes.prices);
      setCurrencyUnits(unitsRes.units);
      setEditingPriceId('');
      setEditingPrice(0);
      setEditingCurrencyUnitId(unitsRes.units?.[0]?._id || '');
      
      // İlk şube seçiliyse o şubeye ait satış yöntemlerini yükle
      if (filteredBranches.length > 0) {
        loadBranchSalesMethods(filteredBranches[0]._id);
      } else {
        setSalesMethods([]);
      }
      
      // Ürünün fiyat durumunu güncelle - tüm satış yöntemleri için fiyat var mı kontrol et
      if (salesMethodsData?.methods) {
        const hasAllPrices = salesMethodsData.methods.every((method) => {
          return pricesRes.prices.some((price) => {
            const priceSalesMethodId = typeof price.salesMethod === 'string' 
              ? price.salesMethod 
              : price.salesMethod?._id;
            return priceSalesMethodId === method._id;
          });
        });
        
        setProductPriceStatus(prev => ({
          ...prev,
          [product._id]: hasAllPrices
        }));
      } else {
        // Satış yöntemleri yüklenmemişse sadece fiyat var mı kontrol et
        setProductPriceStatus(prev => ({
          ...prev,
          [product._id]: pricesRes.prices && pricesRes.prices.length > 0
        }));
      }
    } catch (e) {
      console.error('Fiyat verileri yüklenemedi:', e);
      // Hata durumunda da fiyat olmadığını işaretle
      setProductPriceStatus(prev => ({
        ...prev,
        [product._id]: false
      }));
    }
  };

  const handleEditPrice = (salesMethodId: string, branchId?: string) => {
    // Önce önceki state'leri temizle - farklı satış yöntemleri için state'lerin birbirine karışmasını önle
    handleCancelEdit();
    
    // Yeni değerleri set et
    const targetBranchId = branchId || selectedBranchTab || '';
    setEditingSalesMethodId(salesMethodId);
    setEditingBranchId(targetBranchId);
    
    // Şube seçimine göre fiyat bul
    const existing = productPrices.find(p => {
      if (!p.salesMethod) return false; // null salesMethod kontrolü
      const priceSalesMethodId = typeof p.salesMethod === 'string' ? p.salesMethod : p.salesMethod._id;
      const priceBranchId = typeof p.branch === 'string' ? p.branch : p.branch?._id || '';
      
      if (targetBranchId) {
        // Şube özel fiyat arıyoruz
        return priceSalesMethodId === salesMethodId && priceBranchId === targetBranchId;
      } else {
        // Genel fiyat arıyoruz (şube yok)
        return priceSalesMethodId === salesMethodId && !priceBranchId;
      }
    });
    
    if (existing) {
      setEditingPriceId(existing._id);
      setEditingPrice(existing.price);
      setEditingCurrencyUnitId(typeof existing.currencyUnit === 'string' ? existing.currencyUnit : existing.currencyUnit?._id || '');
      const existingBranchId = typeof existing.branch === 'string' ? existing.branch : existing.branch?._id || '';
      setEditingBranchId(existingBranchId);
    } else {
      setEditingPriceId('');
      setEditingPrice(0);
      setEditingCurrencyUnitId(currencyUnitsData?.units?.[0]?._id || '');
      setEditingBranchId(targetBranchId);
    }
  };

  // Şube seçildiğinde o şubeye ait satış yöntemlerini yükle
  const loadBranchSalesMethods = async (branchId: string) => {
    try {
      const branchSalesMethodsRes = await categoryProductApi.getBranchSalesMethods(branchId);
      // BranchSalesMethod array'inden SalesMethod array'ine dönüştür
      // Null olan salesMethod'ları filtrele
      const salesMethodsList: SalesMethod[] = branchSalesMethodsRes.salesMethods
        .filter((bsm: any) => bsm.salesMethod) // null salesMethod'ları filtrele
        .map((bsm: any) => {
          // BranchSalesMethod içindeki salesMethod alanını çıkar
          const salesMethod = typeof bsm.salesMethod === 'string' 
            ? { _id: bsm.salesMethod, name: '', createdAt: '', updatedAt: '' } 
            : bsm.salesMethod;
          
          // salesMethod hala null ise atla
          if (!salesMethod || !salesMethod._id) {
            return null;
          }
          
          return {
            _id: salesMethod._id,
            name: salesMethod.name || '',
            description: salesMethod.description,
            category: salesMethod.category,
            isActive: salesMethod.isActive,
            createdAt: salesMethod.createdAt || '',
            updatedAt: salesMethod.updatedAt || '',
          } as SalesMethod;
        })
        .filter((sm: SalesMethod | null) => sm !== null) as SalesMethod[]; // null değerleri filtrele
      
      setSalesMethods(salesMethodsList);
    } catch (error) {
      console.error('Şube satış yöntemleri yüklenemedi:', error);
      setSalesMethods([]);
    }
  };

  const handleCancelEdit = () => {
    setEditingSalesMethodId('');
    setEditingPriceId('');
    setEditingBranchId('');
    setEditingPrice(0);
    setEditingCurrencyUnitId(currencyUnitsData?.units?.[0]?._id || '');
    setIsApplyingToAllBranches(false);
  };

  const handleSavePrice = async () => {
    if (!selectedProduct || !editingSalesMethodId || editingPrice <= 0 || !editingCurrencyUnitId) return;
    
    try {
      // Ürünün şirket bilgisini al
      const productCompanyId = typeof selectedProduct.company === 'string' ? selectedProduct.company : selectedProduct.company?._id;
      
      // Şirkete ait şubeleri al
      const companyBranches = branchesData?.branches?.filter(b => {
        const branchCompanyId = typeof b.company === 'string' ? b.company : b.company?._id;
        return branchCompanyId === productCompanyId;
      }) || [];
      
      // Uygulanacak şubeler
      // Önce editingBranchId kontrolü, yoksa selectedBranchTab kullan
      const currentBranchId = editingBranchId || selectedBranchTab;
      
      const branchesToApply = isApplyingToAllBranches 
        ? companyBranches.map(b => b._id)
        : (currentBranchId ? [currentBranchId] : []);
      
      // Şube seçilmediyse hata ver
      if (branchesToApply.length === 0) {
        showToast('Lütfen bir şube seçin.', 'warning');
        // State'leri temizle
        handleCancelEdit();
        return;
      }
      
      // Her şube için fiyat kaydet
      const promises = branchesToApply.map(async (branchId) => {
        try {
          // Önce mevcut fiyatı kontrol et ve sil
          const existingPrice = productPrices.find(p => {
            if (!p.salesMethod) return false; // null salesMethod kontrolü
            const priceSalesMethodId = typeof p.salesMethod === 'string' ? p.salesMethod : p.salesMethod._id;
            const priceBranchId = typeof p.branch === 'string' ? p.branch : p.branch?._id || '';
            return priceSalesMethodId === editingSalesMethodId && priceBranchId === branchId;
          });
          
          if (existingPrice) {
            await categoryProductApi.deleteProductPrice(existingPrice._id);
          }
          
          // Yeni fiyatı ekle
          // Ürünün şirket bilgisini de gönder
          const priceData: any = {
            salesMethod: editingSalesMethodId,
            price: editingPrice,
            currencyUnit: editingCurrencyUnitId,
            branch: branchId,
          };
          
          // Company bilgisini ekle (backend muhtemelen bekliyor)
          if (productCompanyId) {
            priceData.company = productCompanyId;
          }
          
          await categoryProductApi.createProductPrice(selectedProduct._id, priceData);
          
          return { success: true, branchId };
        } catch (error: any) {
          console.error(`Şube ${branchId} için fiyat kaydedilemedi:`, error);
          return { 
            success: false, 
            branchId, 
            error: error?.response?.data || error?.message || 'Bilinmeyen hata'
          };
        }
      });
      
      // Tüm fiyatları kaydet - başarısız olanları da kontrol et
      const results = await Promise.allSettled(promises);
      
      // Hata kontrolü
      const errors: Array<{ branchId: string; error: any }> = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          errors.push({ branchId: branchesToApply[index], error: result.reason });
        } else if (result.value && !result.value.success) {
          errors.push({ branchId: result.value.branchId, error: result.value.error });
        }
      });
      
      // Eğer tüm işlemler başarısız olduysa hata fırlat
      if (errors.length === branchesToApply.length) {
        throw new Error(`Tüm şubeler için fiyat kaydedilemedi. İlk hata: ${JSON.stringify(errors[0]?.error)}`);
      }
      
      // Bazı şubeler başarısız olduysa uyarı göster
      if (errors.length > 0) {
        const branchNames = errors.map(e => {
          const branch = branchesData?.branches?.find(b => b._id === e.branchId);
          return branch?.name || e.branchId;
        }).join(', ');
        
        const errorMessage = `${branchesToApply.length - errors.length} şube için fiyat kaydedildi. ${errors.length} şube için hata oluştu: ${branchNames}`;
        showToast(errorMessage, 'warning');
      }
      
      // Yeniden yükle
      const pricesRes = await categoryProductApi.getProductPrices(selectedProduct._id);
      setProductPrices(pricesRes.prices);
      
      // Fiyat durumunu güncelle - tüm satış yöntemleri için fiyat var mı kontrol et
      if (salesMethodsData?.methods) {
        const hasAllPrices = salesMethodsData.methods.every((method) => {
          return pricesRes.prices.some((price) => {
            const priceSalesMethodId = typeof price.salesMethod === 'string' 
              ? price.salesMethod 
              : price.salesMethod?._id;
            return priceSalesMethodId === method._id;
          });
        });
        
        setProductPriceStatus(prev => ({
          ...prev,
          [selectedProduct._id]: hasAllPrices
        }));
      } else {
        // Satış yöntemleri yüklenmemişse sadece fiyat var mı kontrol et
        setProductPriceStatus(prev => ({
          ...prev,
          [selectedProduct._id]: pricesRes.prices && pricesRes.prices.length > 0
        }));
      }
      
      // Başarı mesajı göster
      if (branchesToApply.length === 1) {
        showToast('Fiyat başarıyla kaydedildi.', 'success');
      } else {
        showToast(`${branchesToApply.length} şube için fiyat başarıyla kaydedildi.`, 'success');
      }
      
      // Reset - başarılı kayıttan sonra state'leri temizle
      handleCancelEdit();
    } catch (e: any) {
      console.error('Fiyat kaydedilemedi:', e);
      
      // Detaylı hata bilgisi
      let errorMessage = 'Fiyat kaydedilemedi. Lütfen tekrar deneyin.';
      
      if (e?.response?.data) {
        // Backend'den gelen hata mesajı
        if (e.response.data.message) {
          errorMessage = e.response.data.message;
        } else if (e.response.data.error) {
          errorMessage = e.response.data.error;
        } else if (typeof e.response.data === 'string') {
          errorMessage = e.response.data;
        }
        
        // Validation hatalarını da göster
        if (e.response.data.errors && Array.isArray(e.response.data.errors)) {
          const validationErrors = e.response.data.errors.map((err: any) => 
            `${err.field || err.path}: ${err.message || err.msg}`
          ).join('\n');
          errorMessage += '\n\nValidasyon Hataları:\n' + validationErrors;
        }
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      // Sadece gerçek hatalarda console'a yaz (debug için)
      if (e?.response?.status !== 500 || !errorMessage.includes('Internal Server Error')) {
        console.error('Hata detayı:', {
          status: e?.response?.status,
          statusText: e?.response?.statusText,
          data: e?.response?.data,
        });
      }
      
      // Hata durumunda kullanıcıya bilgi ver
      showToast(errorMessage, 'error');
      // Hata durumunda da state'leri temizle (eski state'lerin kalmasını önle)
      handleCancelEdit();
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
      render: (_value: any, item: Product) => {
        const hasPrice = productPriceStatus[item._id] ?? null; // null = henüz kontrol edilmedi
        
        return (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openPriceModal(item)}
              title={hasPrice === false ? "Fiyatları Düzenle (Fiyat girilmemiş)" : "Fiyatları Düzenle"}
              className="relative"
          >
            <DollarSign className="h-4 w-4" />
              {hasPrice === false && (
                <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500 fill-yellow-500" />
              )}
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
        );
      },
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
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
                    Satış yöntemlerine göre şubelere özel fiyat belirleyin. Fiyat eklerken diğer şubelere de uygulayabilirsiniz.
                  </p>
                </div>

                {/* Şube Tabları - Sadece ürünün şirketine ait şubeler */}
                {(() => {
                  const productCompanyId = typeof selectedProduct.company === 'string' 
                    ? selectedProduct.company 
                    : selectedProduct.company?._id;
                  
                  const filteredBranches = branchesData?.branches?.filter(b => {
                    const branchCompanyId = typeof b.company === 'string' ? b.company : b.company?._id;
                    return branchCompanyId === productCompanyId;
                  }) || [];
                  
                  if (filteredBranches.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Bu şirkete ait şube bulunamadı.
                      </div>
                    );
                  }
                  
                  return (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <div className="flex space-x-8 overflow-x-auto">
                        {filteredBranches.map((branch) => (
                          <button
                            key={branch._id}
                            onClick={async () => {
                              setSelectedBranchTab(branch._id);
                              handleCancelEdit();
                              // Şube değiştiğinde o şubeye ait satış yöntemlerini yükle
                              await loadBranchSalesMethods(branch._id);
                            }}
                            className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                              selectedBranchTab === branch._id
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            {branch.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

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
                        // Seçili şubeye göre fiyat bul (sadece şube fiyatları)
                        const existing = productPrices.find(p => {
                          if (!p.salesMethod) return false; // null salesMethod kontrolü
                          const priceSalesMethodId = typeof p.salesMethod === 'string' ? p.salesMethod : p.salesMethod._id;
                          const priceBranchId = typeof p.branch === 'string' ? p.branch : p.branch?._id || '';
                          
                          // Sadece şube özel fiyatları göster
                          return priceSalesMethodId === method._id && priceBranchId === selectedBranchTab;
                        });
                        
                        const isEditing = editingSalesMethodId === method._id && 
                          selectedBranchTab && editingBranchId === selectedBranchTab;
                        
                        return (
                          <tr key={method._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{method.name}</div>
                            </td>
                            {isEditing ? (
                              <>
                            <td className="px-6 py-4 whitespace-nowrap">
                      <Input
                        type="number"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(parseFloat(e.target.value) || 0)}
                        placeholder="Fiyat giriniz"
                        min="0"
                        step="0.01"
                                    className="w-32"
                      />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                      <select
                                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        value={editingCurrencyUnitId}
                        onChange={(e) => setEditingCurrencyUnitId(e.target.value)}
                        required
                      >
                        {currencyUnits.map((u) => (
                          <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                      </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex flex-col space-y-2">
                                    <div className="flex space-x-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={handleCancelEdit}
                                      >
                                        İptal
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        onClick={handleSavePrice} 
                                        disabled={editingPrice <= 0 || !editingCurrencyUnitId}
                                      >
                                        Kaydet
                                      </Button>
                    </div>
                                    {(() => {
                                      const productCompanyId = typeof selectedProduct.company === 'string' 
                                        ? selectedProduct.company 
                                        : selectedProduct.company?._id;
                                      
                                      const filteredBranches = branchesData?.branches?.filter(b => {
                                        const branchCompanyId = typeof b.company === 'string' ? b.company : b.company?._id;
                                        return branchCompanyId === productCompanyId && b._id !== selectedBranchTab;
                                      }) || [];
                                      
                                      if (filteredBranches.length > 0) {
                                        return (
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              id="applyToAllBranches"
                                              checked={isApplyingToAllBranches}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                setIsApplyingToAllBranches(checked);
                                                // Checkbox kaldırıldığında editingBranchId'yi güncelle
                                                if (!checked && !editingBranchId && selectedBranchTab) {
                                                  setEditingBranchId(selectedBranchTab);
                                                }
                                              }}
                                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                                            />
                                            <label 
                                              htmlFor="applyToAllBranches" 
                                              className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer"
                                            >
                                              Diğer şubelere de uygula ({filteredBranches.length} şube)
                                            </label>
                    </div>
                                        );
                                      }
                                      return null;
                                    })()}
                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {existing ? (
                                    <span className="text-sm text-gray-900 dark:text-white">{existing.price}</span>
                                  ) : (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Fiyat yok</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {existing ? (
                                    <span className="text-sm text-gray-900 dark:text-white">
                                      {typeof existing.currencyUnit === 'string' ? existing.currencyUnit : (existing.currencyUnit?.name || '-')}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  {selectedBranchTab && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleEditPrice(method._id, selectedBranchTab)}
                                    >
                                      {existing ? 'Düzenle' : 'Fiyat Ekle'}
                                    </Button>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};