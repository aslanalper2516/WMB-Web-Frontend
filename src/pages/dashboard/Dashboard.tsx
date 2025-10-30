import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Package, 
  Users, 
  ShoppingBag,
  Menu as MenuIcon,
  TrendingUp,
  Activity,
  Plus,
  ArrowRight
} from 'lucide-react';
import { companyBranchApi } from '../../api/companyBranch';
import { categoryProductApi } from '../../api/categoryProduct';
import { authApi } from '../../api/auth';
import { menuApi } from '../../api/menu';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Veri çekme
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyBranchApi.getCompanies(),
  });

  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => companyBranchApi.getBranches(),
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryProductApi.getCategories(),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers(),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => categoryProductApi.getProducts(),
  });

  const { data: menusData, isLoading: menusLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menuApi.getMenus(),
  });

  // İstatistikler
  const companiesCount = companiesData?.companies?.length || 0;
  const branchesCount = branchesData?.branches?.length || 0;
  const categoriesCount = categoriesData?.categories?.length || 0;
  const usersCount = usersData?.users?.length || 0;
  const productsCount = productsData?.products?.length || 0;
  const menusCount = menusData?.menus?.length || 0;
  
  // Aktif kayıtlar
  const activeCompanies = companiesData?.companies?.filter(c => c.isActive !== false)?.length || 0;
  const activeBranches = branchesData?.branches?.filter(b => b.isActive !== false)?.length || 0;
  const activeCategories = categoriesData?.categories?.filter(c => c.isActive !== false)?.length || 0;
  const activeProducts = productsData?.products?.filter(p => p.isActive !== false)?.length || 0;

  const isLoading = companiesLoading || branchesLoading || categoriesLoading || usersLoading || productsLoading || menusLoading;

  const stats = [
      {
        name: 'Şirketler',
        value: companiesCount.toString(),
        active: activeCompanies.toString(),
        icon: Building2,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        link: '/companies',
      },
      {
        name: 'Şubeler',
        value: branchesCount.toString(),
        active: activeBranches.toString(),
        icon: MapPin,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        link: '/branches',
      },
      {
        name: 'Kategoriler',
        value: categoriesCount.toString(),
        active: activeCategories.toString(),
        icon: Package,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        link: '/categories',
      },
      {
        name: 'Ürünler',
        value: productsCount.toString(),
        active: activeProducts.toString(),
        icon: ShoppingBag,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        link: '/products',
      },
      {
        name: 'Menüler',
        value: menusCount.toString(),
        icon: MenuIcon,
        color: 'text-pink-600 dark:text-pink-400',
        bgColor: 'bg-pink-100 dark:bg-pink-900/30',
        link: '/menus',
      },
      {
        name: 'Kullanıcılar',
        value: usersCount.toString(),
        icon: Users,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        link: '/users',
      },
  ];

  // Son eklenenler (en yeni 5 kayıt)
  const recentCompanies = companiesData?.companies
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    ?.slice(0, 5) || [];
  
  const recentBranches = branchesData?.branches
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    ?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hoş geldiniz, {user?.name}!
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hoş geldiniz, <span className="font-semibold text-gray-700 dark:text-gray-300">{user?.name}</span>!
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Activity className="h-4 w-4" />
            <span>Son Güncelleme: {new Date().toLocaleTimeString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.link}
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate mb-1">
                        {stat.name}
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      {stat.active && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="text-green-600 dark:text-green-400 font-semibold">{stat.active}</span> aktif
                        </p>
                      )}
                    </div>
                    <div className={`flex-shrink-0 p-2 sm:p-3 rounded-lg ${stat.bgColor} ml-3`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Son Eklenen Şirketler ve Şubeler */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Son Eklenenler</h3>
            <TrendingUp className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Şirketler</h4>
                  <Link to="/companies" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Tümünü Gör
                  </Link>
                </div>
                {recentCompanies.length > 0 ? (
                  <ul className="space-y-2">
                    {recentCompanies.map((company) => (
                      <li
                        key={company._id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-sm text-gray-900 dark:text-white truncate flex-1">
                          {company.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {new Date(company.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    Henüz şirket eklenmemiş.
                  </p>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Şubeler</h4>
                  <Link to="/branches" className="text-xs text-green-600 dark:text-green-400 hover:underline">
                    Tümünü Gör
                  </Link>
                </div>
                {recentBranches.length > 0 ? (
                  <ul className="space-y-2">
                    {recentBranches.map((branch) => (
                      <li
                        key={branch._id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-sm text-gray-900 dark:text-white truncate flex-1">
                          {branch.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {new Date(branch.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    Henüz şube eklenmemiş.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hızlı İşlemler */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Hızlı İşlemler</h3>
            <Plus className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/companies"
                className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors group"
              >
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="ml-3 text-sm font-medium text-blue-900 dark:text-blue-200 group-hover:underline">
                  Şirket Ekle
                </span>
                <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link
                to="/branches"
                className="flex items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors group"
              >
                <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="ml-3 text-sm font-medium text-green-900 dark:text-green-200 group-hover:underline">
                  Şube Ekle
                </span>
                <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link
                to="/categories"
                className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors group"
              >
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="ml-3 text-sm font-medium text-purple-900 dark:text-purple-200 group-hover:underline">
                  Kategori Ekle
                </span>
                <ArrowRight className="h-4 w-4 text-purple-600 dark:text-purple-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link
                to="/products"
                className="flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors group"
              >
                <ShoppingBag className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <span className="ml-3 text-sm font-medium text-indigo-900 dark:text-indigo-200 group-hover:underline">
                  Ürün Ekle
                </span>
                <ArrowRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
