import React, {useState} from 'react';
import axios from 'axios';
import {useUserStore} from '../store/userStore.js';
import {useToast} from "@/hooks/use-toast";
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {Label} from '@/components/ui/label';
import {Loader2, User, Lock} from 'lucide-react';
import {Alert, AlertDescription} from '@/components/ui/alert';

export const LoginModal = ({onClose, onSwitchView}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const {setUser} = useUserStore();
    const {toast} = useToast();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!username.trim()) {
            setError('Username is required');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post('/api/user/login', {username, password});

            if (response.data.data) {
                setUser(response.data.data);
                toast({
                    title: "Welcome back!",
                    description: "You've successfully logged in to ActPoly"
                });
                onClose();
            } else {
                setError('Invalid login response');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Welcome to ActPoly</DialogTitle>
                    <DialogDescription>Sign in to your account</DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleLogin} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                disabled={isLoading}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                disabled={isLoading}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="flex flex-row pt-4 space-x-6">
                        <Button type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isLoading}
                                className="w-full"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                    Logging in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </div>
                    <div className="flex flex-row pt-4 space-x-6">
                        <Button
                            type="button"
                            variant="link"
                            onClick={() => onSwitchView("passwordReset")}
                            className="px-0 h-auto font-normal text-sm text-muted-foreground hover:text-primary"
                        >
                            Forgot your password?
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <Button
                                type="button"
                                variant="link"
                                onClick={() => onSwitchView("register")}
                                className="px-0 h-auto font-medium text-primary hover:text-primary/80"
                            >
                                Register now
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
