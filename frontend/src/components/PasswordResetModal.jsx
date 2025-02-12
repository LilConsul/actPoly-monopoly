import React, {useState} from "react";
import axios from "axios";
import {useToast} from "@/hooks/use-toast";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Alert, AlertDescription} from '@/components/ui/alert';

import {Loader2, Mail} from "lucide-react";

export const PasswordResetModal = ({ onClose, onSwitchView }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('https://localhost/api/user/password-reset', { email });
      setSuccess(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for instructions to reset your password"
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send password reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Reset Your Password</DialogTitle>
          <DialogDescription>
            We'll send you an email with a link to reset your password
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Check your inbox</h3>
            <p className="text-sm text-muted-foreground">
              We've sent a password reset link to <span className="font-medium">{email}</span>
            </p>
            <Button onClick={onClose} className="mt-4 w-full">
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2 pt-4">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onSwitchView("login")}
                disabled={isLoading}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
