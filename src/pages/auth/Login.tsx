import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        setError('Backend sunucusuna bağlanılamıyor. Lütfen backend\'in çalıştığından emin olun.');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Giriş yapılırken bir hata oluştu');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Logo/Brand Area */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-4">
            <LogIn className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Hoş Geldiniz
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Hesabınıza giriş yaparak devam edin
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-md shadow-sm animate-shake">
                  <div className="flex items-center">
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    E-posta
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="ornek@email.com"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Şifre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none"
                loading={isLoading}
                disabled={isLoading}
              >
                {!isLoading && (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Giriş Yap
                  </span>
                )}
                {isLoading && <span>Giriş yapılıyor...</span>}
              </Button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hesabınız yok mu?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                  >
                    Yeni hesap oluşturun
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Decorative Elements */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 WMB Tracker. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
};
