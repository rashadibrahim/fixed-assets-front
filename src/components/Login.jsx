import React, { useState } from 'react';
import { Shield, User, Lock, Eye, EyeOff, Building2, Package, Warehouse, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import heroBuilding from '../assets/hero-building.jpg';
import warehouseInterior from '../assets/warehouse-interior.jpg';

const Login = () => {
  const { login, loading, connectionError } = useAuth();
  const { handleError, handleSuccess } = useErrorHandler();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(formData.email, formData.password);
      handleSuccess('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (error.message?.includes('Network') || error.isNetworkError) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (error.status === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.status === 404 || error.message?.includes('404')) {
        errorMessage = 'Service unavailable. Please contact your system administrator.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      handleError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0">
        <img 
          src={heroBuilding} 
          alt="Modern office building" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Hero Content */}
        <div className="hidden lg:flex lg:w-2/5 items-center justify-center p-10">
          <div className="max-w-lg space-y-7">
            <div>
              <h1 className="text-5xl font-bold text-foreground mb-5">
                Assets Pro
              </h1>
              <p className="text-xl text-muted-foreground mb-7">
                Professional Fixed Assets Management Solution
              </p>
              
              <div className="space-y-5">
                <div className="flex items-start space-x-4">
                  <div className="p-2 gradient-primary rounded-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-base">Asset Tracking</h3>
                    <p className="text-muted-foreground text-base">Track and manage fixed assets efficiently</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Warehouse className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-base">Warehouse Management</h3>
                    <p className="text-muted-foreground text-base">Organize assets across locations</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-base">Multi-Branch Support</h3>
                    <p className="text-muted-foreground text-base">Manage assets across branches</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src={warehouseInterior} 
                alt="Modern warehouse interior" 
                className="rounded-xl shadow-glass h-52 w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-3/5 flex items-center justify-center p-8">
          <div className="w-full max-w-xl space-y-5">
            {/* Mobile Header */}
            <div className="text-center space-y-4 lg:hidden">
              <div className="flex items-center justify-center mb-5">
                <div className="p-4 gradient-primary rounded-2xl shadow-primary">
                  <Building2 className="h-11 w-11 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Assets Pro</h1>
                <p className="text-lg text-muted-foreground mt-2">Fixed Assets Management</p>
              </div>
            </div>

            {/* Login Card */}
            <Card className="glass-card shadow-glass">
              <CardHeader className="text-center pb-5">
                <CardTitle className="flex items-center justify-center space-x-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Sign In</span>
                </CardTitle>
                {connectionError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Unable to connect to the server. Please contact your system administrator or try again later.
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email address"
                        className="pl-10 transition-smooth"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 transition-smooth"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full btn-primary transition-bounce"
                    disabled={isLoading || loading}
                  >
                    {isLoading || loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* System Status */}
            {connectionError && (
              <Card className="glass-card border-yellow-200 bg-yellow-50/50">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 text-sm">System Notice</h4>
                      <p className="text-xs text-yellow-700 mt-1">
                        If you're experiencing connection issues, please contact your system administrator.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;