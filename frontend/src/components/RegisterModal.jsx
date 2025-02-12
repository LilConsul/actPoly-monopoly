import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export const RegisterModal = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!username.trim()) {
      toast({ title: "Error", description: "Username is required", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast({ title: "Error", description: "Valid email is required", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      await axios.post('/api/user/register', { username, email, password, confirm_password: repeatPassword });

      toast({ title: "Success", description: "Account Created! Check email to verify your account" });
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: err.response?.data?.detail || 'Registration failed',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register for ActPoly</DialogTitle>
          <DialogDescription>Create a new account to start playing</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repeat-password">Repeat Password</Label>
            <Input
              id="repeat-password"
              type="password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
