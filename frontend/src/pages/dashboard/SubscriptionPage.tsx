import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, AlertCircle, Sparkles, Shield, Zap, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/services/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function SubscriptionPage() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = user?.plan === 'pro';

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError('Failed to load Razorpay SDK. Please check your connection.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Call backend create-order
      const response = await api.post('/subscription/razorpay/create-order');
      const { orderId, amount, keyId } = response.data;

      // 2. Open Razorpay checkout options
      const options = {
        key: keyId,
        amount: amount,
        currency: 'INR',
        name: 'PIRAX Pro',
        description: 'One-time upgrade to PIRAX Pro',
        order_id: orderId,
        handler: async (paymentResponse: any) => {
          setIsVerifying(true);
          try {
            // 3. Send payment verification to backend
            await api.post('/subscription/razorpay/verify', {
              orderId: paymentResponse.razorpay_order_id,
              paymentId: paymentResponse.razorpay_payment_id,
              signature: paymentResponse.razorpay_signature,
            });

            setSuccess(true);
            await refreshUser();
          } catch (err: any) {
            setError(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setIsVerifying(false);
            setIsLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#221D17', // Match PIRAX Ink color
        },
        modal: {
          ondismiss: () => {
            setError("Payment wasn't completed. You were not charged for a successful purchase.");
            setIsLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function () {
        setError("Payment wasn't completed. You were not charged for a successful purchase.");
        setIsLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" style={{ color: '#221D17' }}>
            Elevate Your Study Experience
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Get lifetime access to advanced AI study features, personalized tutoring, and infinite workspaces.
          </p>
        </div>

        {/* State Alerts */}
        {success && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">PIRAX Pro activated 🎉</h3>
              <p className="text-sm mt-0.5 text-emerald-700">
                Congratulations! Your account has been upgraded successfully. You now have lifetime access to all Pro features.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg text-rose-900">Payment failed</h3>
              <p className="text-sm mt-0.5 text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {isVerifying && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent" />
            <div>
              <p className="font-medium">Verifying payment signature server-side...</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Free Tier Card */}
          <Card className="flex flex-col border-border relative overflow-hidden bg-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">Free Plan</CardTitle>
              <CardDescription>Basic learning workspace features</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold tracking-tight">₹0</span>
                <span className="ml-1 text-muted-foreground">/ forever</span>
              </div>
              <ul className="space-y-3.5">
                {[
                  '10 AI requests per month',
                  'Up to 3 study sets',
                  '50 flashcards maximum',
                  '50MB PDF/DOCX storage limit',
                  'Basic Focus Pomodoro timer',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-4">
              <Button variant="outline" className="w-full" disabled={!isPro}>
                {isPro ? 'Downgrade not available' : 'Current Plan'}
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Tier Card */}
          <Card className="flex flex-col relative overflow-hidden bg-[#221D17] text-white border-none shadow-xl scale-105 md:scale-100 z-10">
            {/* Ribbon */}
            <div className="absolute top-0 right-0 bg-[#A76352] text-xs font-bold uppercase tracking-wider px-3 py-1 text-white rounded-bl-lg">
              One-Time
            </div>

            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-[#C6B19B] mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Premium Access</span>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">PIRAX Pro</CardTitle>
              <CardDescription className="text-white/60">Complete AI-driven learning tools</CardDescription>
            </CardHeader>

            <CardContent className="flex-grow">
              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-extrabold tracking-tight text-[#C6B19B]">₹99</span>
                <span className="ml-2 text-white/60 text-sm">one-time purchase</span>
              </div>

              <ul className="space-y-3.5">
                {[
                  'Unlimited Smart AI requests',
                  'YouTube-to-Notes generation',
                  'Multi-input AI capture (PDF, DOCX)',
                  'Full adaptive practice and Mistake Bank',
                  'Spaced review scheduled alerts',
                  '10GB cloud document storage',
                  'Future open-source multi-AI integrations',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-white/90">
                    <Check className="w-4 h-4 text-[#C6B19B] flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-4">
              {isPro ? (
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-default" disabled>
                  PIRAX Pro Active
                </Button>
              ) : (
                <Button
                  className="w-full bg-[#A76352] hover:bg-[#8e5243] text-white font-bold"
                  onClick={handleUpgrade}
                  disabled={isLoading || isVerifying}
                >
                  {isLoading ? 'Processing...' : 'Upgrade to PIRAX Pro'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Security badges */}
        <div className="mt-12 flex justify-center gap-6 text-xs text-muted-foreground border-t border-border pt-6">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Secure 256-bit SSL verification</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Server-side verification</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


