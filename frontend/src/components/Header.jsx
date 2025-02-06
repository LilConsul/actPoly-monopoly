import React, {useState} from 'react';
import {useUserStore} from '../store/userStore.js';
import {LoginModal} from './LoginModal';
import {RegisterModal} from './RegisterModal';
import {useToast} from "@/hooks/use-toast";
import {Toaster} from "@/components/ui/toaster";
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import axios from "axios";

export const Header = () => {
    const {user, clearUser} = useUserStore();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const {toast} = useToast();

    const handleLogout = () => {
        axios.post('/api/user/logout').then(() => {
            clearUser();
            toast({
                title: "Logged Out",
                description: "You have been successfully logged out."
            });
        }).catch((e) => {
            toast({
                title: "Error",
                description: e.response.data.message,
                variant: "destructive"
            });
        });
    };

    return (
        <>
            <header className="bg-white shadow py-4 relative">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">ActPoly</h1>
                    <div className="flex items-center space-x-3">
                        {user ? (
                            <div className="flex items-center space-x-3">
                                <span className="text-gray-700 font-medium">{user.username}</span>
                                <Avatar className="w-10 h-10">
                                    <AvatarImage
                                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`}
                                        alt={user.username}
                                    />
                                    <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="ml-2 hover:bg-red-500 hover:text-white"
                                >
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <div className="space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowLogin(true)}
                                >
                                    Login
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => setShowRegister(true)}
                                >
                                    Register
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {showLogin && (
                    <LoginModal
                        onClose={() => setShowLogin(false)}
                    />
                )}

                {showRegister && (
                    <RegisterModal
                        onClose={() => setShowRegister(false)}
                    />
                )}
            </header>
            <Toaster/>
        </>
    );
};