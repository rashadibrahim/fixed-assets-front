import React, { useState } from 'react';
import { Shield, User, Lock, Eye, EyeOff, Building2, Package, Warehouse } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import heroBuilding from '../assets/hero-building.jpg';
import warehouseInterior from '../assets/warehouse-interior.jpg';

const Login = () => {
  const { login, demoLogin, loading, connectionError } = useAuth();
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
      await login(formData);
      toast.success('Login successful!');
      // No need to navigate - the AuthContext will automatically show Dashboard
    } catch (error) {
      console.error('Login failed:', error);
      
      // Handle specific error types
      let errorMessage;
      if (error.message.includes('Cannot connect to server')) {
        errorMessage = 'Cannot connect to the server. Please ensure the backend service is running and try again.';
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Invalid request. Please check your input and try again.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.response?.data?.detail || 
                      error.response?.data?.message || 
                      error.message || 
                      'Login failed. Please check your credentials and try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    demoLogin();
    toast.success('Demo login successful!');
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
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-lg space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-foreground mb-6">
                Assets Pro
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Complete Fixed Assets Management Solution for modern organizations
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 gradient-primary rounded-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Asset Tracking</h3>
                    <p className="text-muted-foreground">Track and manage all your fixed assets with ease</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Warehouse className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Warehouse Management</h3>
                    <p className="text-muted-foreground">Organize assets across multiple warehouse locations</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Multi-Branch Support</h3>
                    <p className="text-muted-foreground">Manage assets across different branch locations</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src={warehouseInterior} 
                alt="Modern warehouse interior" 
                className="rounded-xl shadow-glass"
              />
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile Header */}
            <div className="text-center space-y-4 lg:hidden">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 gradient-primary rounded-2xl shadow-primary">
                  <Building2 className="h-12 w-12 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Assets Pro</h1>
                <p className="text-lg text-muted-foreground mt-2">Fixed Assets Management</p>
              </div>
            </div>

            {/* Login Card */}
            <Card className="glass-card shadow-glass">
              <CardHeader className="text-center pb-6">
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Sign In</span>
                </CardTitle>
                {connectionError && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">Connection Issue:</span> Unable to connect to the server. 
                      You can try the demo login below or wait for the backend service to become available.
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="admin@example.com"
                        className="pl-10 transition-smooth"
                        required
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
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      type="submit" 
                      className="w-full btn-primary transition-bounce"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full transition-bounce"
                      onClick={handleDemoLogin}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Demo Login
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Demo Info */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <h3 className="font-semibold text-foreground">Demo Access</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Click "Demo Login" to explore the system with sample data.</p>
                    <div className="space-y-1">
                      <p><strong>Features included:</strong></p>
                      <ul className="text-xs space-y-1 text-left">
                        <li>• Complete asset lifecycle management</li>
                        <li>• Multi-warehouse & branch operations</li>
                        <li>• Role-based user permissions</li>
                        <li>• Real-time analytics dashboard</li>
                        <li>• Multi-language support (EN/AR)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground">
              <p>Built with React • JavaScript • Tailwind CSS</p>
              <p className="mt-1">Enterprise-grade Asset Management</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;