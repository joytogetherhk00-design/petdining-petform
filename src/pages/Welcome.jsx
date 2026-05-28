import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function Welcome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [userType, setUserType] = useState(null);
  const [checking, setChecking] = useState(false);
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);

  // 檢查是否有預覽視角參數或管理員登入
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam) {
      // 管理員預覽模式，直接跳轉
      if (viewParam === 'business') {
        navigate('/products');
      } else if (viewParam === 'general') {
        navigate('/courses');
      }
    }
    checkUser();
  }, []);

  useEffect(() => {
    if (user && !checking) {
      // 管理員直接跳轉到後台
      if (user.role === 'admin') {
        navigate('/admin');
      }
    }
  }, [user, checking]);

  const checkUser = async () => {
    try {
      setChecking(true);
      const isLoggedIn = await base44.auth.isAuthenticated();
      if (isLoggedIn) {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // 檢查是否為商業客戶
        const customers = await base44.entities.Customers.filter({ user_email: userData.email });
        if (customers.length > 0) {
          setCustomer(customers[0]);
        }
      }
    } catch (error) {
      console.error('Check user error:', error);
    } finally {
      setChecking(false);
    }
  };

  const updateUserTypeMutation = useMutation({
    mutationFn: async (type) => {
      if (!user) throw new Error('用戶未登入');
      console.log('Updating user type to:', type);
      await base44.entities.User.update(user.id, { 
        user_type: type,
        customer_id: type === 'business' && customer ? customer.customer_id : null
      });
      console.log('User type updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('用戶類型已更新');
    },
    onError: (error) => {
      console.error('Update user type error:', error);
      toast.error('更新失敗：' + error.message);
    },
  });

  const handleSelectType = async (type) => {
    setUserType(type);
  };

  const handleContinue = async () => {
    if (!userType) return;
    
    try {
      const isLoggedIn = await base44.auth.isAuthenticated();
      
      if (!isLoggedIn) {
        // 未登入，先引導登入
        await base44.auth.redirectToLogin();
        return;
      }
      
      // 更新用戶類型並等待完成
      await new Promise((resolve, reject) => {
        updateUserTypeMutation.mutate(userType, {
          onSuccess: resolve,
          onError: reject
        });
      });
      
      // 根據類型跳轉
      if (userType === 'general') {
        navigate('/courses');
      } else if (userType === 'business') {
        if (customer) {
          if (customer.status === 'active') {
            navigate('/products');
          } else if (customer.status === 'pending') {
            navigate('/pending');
          } else {
            navigate('/apply');
          }
        } else {
          navigate('/apply');
        }
      }
    } catch (error) {
      console.error('Continue error:', error);
      toast.error('操作失敗');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">🐾 PetDining PetForm</CardTitle>
          <CardDescription className="text-base">
            請選擇您的用戶類型
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!userType ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectType('general')}
                className="group p-6 rounded-xl border-2 border-input hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">🐾 一般客戶</h3>
                    <p className="text-sm text-muted-foreground mt-2 space-y-1 block">
                      <span className="block">只需註冊，無需審批</span>
                      <span className="block">只可報讀課程</span>
                      <span className="block">Stripe 全費支付</span>
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              <button
                onClick={() => handleSelectType('business')}
                className="group p-6 rounded-xl border-2 border-input hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                    <Building2 className="h-8 w-8 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">🏢 商業客戶</h3>
                    <p className="text-sm text-muted-foreground mt-2 space-y-1 block">
                      <span className="block">需要審批，享有多功能</span>
                      <span className="block">包括課程及產品訂貨</span>
                      <span className="block">月費 Plan 包含課程名額</span>
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {userType === 'general' ? (
                    <Users className="h-5 w-5 text-primary" />
                  ) : (
                    <Building2 className="h-5 w-5 text-secondary" />
                  )}
                  <span className="font-medium">
                    {userType === 'general' ? '一般客戶' : '商業客戶'}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setUserType(null)}>
                  重新選擇
                </Button>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold">
                  {userType === 'general' ? '一般客戶須知' : '商業客戶須知'}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {userType === 'general' ? (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        只需註冊賬戶，無需審批
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        可報讀所有公開課程
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        Stripe 全費支付
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        需要填寫申請表並等待審批
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        審批後可使用產品訂貨功能
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        月費 Plan 包含課程名額
                      </li>
                    </>
                  )}
                </ul>

                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setUserType(null)}
                  >
                    返回
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleContinue}
                  >
                    繼續
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}