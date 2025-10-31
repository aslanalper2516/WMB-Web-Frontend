import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  MapPin, 
  Package, 
  ChefHat, 
  Shield, 
  Users,
  Ruler,
  User,
  Menu as MenuIcon,
  ShoppingCart,
  FlaskConical
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Şirketler', href: '/companies', icon: Building2 },
  { name: 'Şubeler', href: '/branches', icon: MapPin },
  { name: 'Kategoriler', href: '/categories', icon: Package },
  { name: 'Ürünler', href: '/products', icon: Package },
  { name: 'Malzemeler', href: '/ingredients', icon: FlaskConical },
  { name: 'Mutfaklar', href: '/kitchens', icon: ChefHat },
  { name: 'Menüler', href: '/menus', icon: MenuIcon },
  { name: 'Birimler', href: '/units', icon: Ruler },
  { name: 'Satış Yöntemleri', href: '/sales-methods', icon: ShoppingCart },
  { name: 'Roller', href: '/roles', icon: Shield },
  { name: 'İzinler', href: '/permissions', icon: Shield },
  { name: 'Kullanıcılar', href: '/users', icon: Users },
  { name: 'Profil', href: '/profile', icon: User },
];

export const Sidebar: React.FC = () => {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow pt-5 bg-gray-50 dark:bg-gray-800 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center flex-shrink-0 px-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menü</h2>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};
