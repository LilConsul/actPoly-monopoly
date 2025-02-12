import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const VerifyUser = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your account...');

  useEffect(() => {
    const verifyAccount = async () => {
      try {
        if (!token) {
          setStatus('error');
          setMessage('Verification token is missing.');
          return;
        }

        const response = await axios.post('https://localhost/api/user/verify', { token });

        if (response.status === 200) {
          setStatus('success');
          setMessage('Email confirmed. You can now log in!');
          toast({ title: 'Success', description: 'Email confirmed. You can now log in!' });
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.detail || 'Invalid or expired token.');
        toast({
          title: 'Verification Failed',
          description: error.response?.data?.detail || 'Invalid or expired token.',
          variant: 'destructive',
        });
      }
    };

    verifyAccount();
  }, [token, toast]);

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <Loader2 className="h-16 w-16 animate-spin text-primary" />;
      case 'success':
        return (
          <div className="rounded-full bg-green-100 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="rounded-full bg-red-100 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Account Verification</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 py-6">
          {getStatusIcon()}
          <p className="text-center text-lg font-medium mt-4">{message}</p>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button
            onClick={() => navigate('/')}
            variant={status === 'success' ? 'default' : 'outline'}
            className="w-full max-w-xs"
          >
            {status === 'success' ? 'Go to Login' : 'Back to Homepage'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyUser;