import React, {useState} from 'react';
import {useUserStore} from '../store/userStore.js';
import {useToast} from "@/hooks/use-toast";
import {Toaster} from "@/components/ui/toaster";
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {useNavigate} from 'react-router';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {Settings, LogOut} from 'lucide-react';
import axios from "axios";

import {LoginModal} from './LoginModal';
import {RegisterModal} from './RegisterModal';
import {PasswordResetModal} from './PasswordResetModal';

export const Header = () => {
    const {user, clearUser} = useUserStore();
    const {toast} = useToast();
    const navigate = useNavigate();
    const [view, setView] = useState(null);

    const switchView = (newView) => setView(newView);

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
                description: e.response.data.detail,
                variant: "destructive"
            });
        });
    };

    const handleSettings = () => {
        navigate('/settings');
    };


    return (
        <>
            <header className="bg-white shadow py-4 relative">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <h1
                        className="text-2xl font-bold text-gray-800 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        ActPoly
                    </h1>
                    <div className="flex items-center space-x-3">
                        {user ? (
                            <div className="flex items-center space-x-3">
                                <span className="text-gray-700 font-medium">{user.username}</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="outline-none">
                                        <Avatar
                                            className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-gray-200 transition-all">
                                            <AvatarImage
                                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`}
                                                alt={user.username}
                                            />
                                            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem
                                            className="cursor-pointer flex items-center"
                                            onClick={handleSettings}
                                        >
                                            <Settings className="mr-2 h-4 w-4"/>
                                            Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator/>
                                        <DropdownMenuItem
                                            className="cursor-pointer text-red-600 flex items-center"
                                            onClick={handleLogout}
                                        >
                                            <LogOut className="mr-2 h-4 w-4"/>
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ) : (
                            <div className="space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setView("login")}
                                >
                                    Login
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => setView("register")}
                                >
                                    Register
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {view === "login" && (
                    <LoginModal onClose={() => setView(null)} onSwitchView={switchView}/>
                )}

                {view === "register" && (
                    <RegisterModal onClose={() => setView(null)} onSwitchView={switchView}/>
                )}

                {view === "passwordReset" && (
                    <PasswordResetModal onClose={() => setView(null)} onSwitchView={switchView}/>
                )}

            </header>
            <Toaster/>
        </>
    );
};
