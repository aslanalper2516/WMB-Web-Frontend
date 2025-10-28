import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Building2, MapPin, Package, Users } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Şirketler',
      value: '0',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Şubeler',
      value: '0',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Kategoriler',
      value: '0',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Kullanıcılar',
      value: '0',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hoş geldiniz, {user?.name}!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent>
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-md ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Son Aktiviteler</h3>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              Henüz aktivite bulunmuyor.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Hızlı İşlemler</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/companies"
                className="block p-3 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="ml-3 text-sm font-medium text-blue-900">
                    Şirket Ekle
                  </span>
                </div>
              </a>
              <a
                href="/branches"
                className="block p-3 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="ml-3 text-sm font-medium text-green-900">
                    Şube Ekle
                  </span>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
