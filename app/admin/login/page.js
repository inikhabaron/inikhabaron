'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Newspaper } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store admin session and normalize role casing
      localStorage.setItem('admin_session', JSON.stringify({
        ...data.admin,
        role: data.admin.role?.toString().trim().toLowerCase(),
      }));
      localStorage.setItem('admin_token', data.token);
      
      toast.success('Logged in successfully!');
      
      // Redirect to admin dashboard
      router.push('/admin');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="border-2">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <Newspaper className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">NewsDesk Admin</CardTitle>
            <CardDescription>Sign in to access the admin panel</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@newsdesk.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Demo Credentials:
              </p>
              <div className="space-y-2 text-xs">
                <div className="bg-muted p-2 rounded">
                  <p><strong>Admin:</strong> admin@newsdesk.com / admin123</p>
                </div>
                <div className="bg-muted p-2 rounded">
                  <p><strong>Editor:</strong> editor@newsdesk.com / editor123</p>
                </div>
                <div className="bg-muted p-2 rounded">
                  <p><strong>Reporter:</strong> reporter@newsdesk.com / reporter123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          For production, use proper credential management
        </p>
      </div>
    </div>
  );
}
