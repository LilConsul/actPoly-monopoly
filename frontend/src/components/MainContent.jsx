import React, {useState} from 'react';
import {useNavigate} from 'react-router';
import {v4 as uuidv4} from 'uuid';
import {validate as validateUUID} from 'uuid';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {useToast} from "@/hooks/use-toast";
import {useUserStore} from '@/store/userStore';
import {Dices, Users} from 'lucide-react';

export const MainContent = () => {
    const navigate = useNavigate();
    const {toast} = useToast();
    const {user} = useUserStore();
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [gameId, setGameId] = useState('');

    const handleCreateGame = () => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please login to create a game",
                variant: "destructive"
            });
            return;
        }

        const newGameId = uuidv4();
        navigate(`/game/${newGameId}`);
        toast({
            title: "Game Created",
            description: "Redirecting to your new game room..."
        });
    };

    const handleJoinGame = (e) => {
        e.preventDefault();

        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please login to join a game",
                variant: "destructive"
            });
            return;
        }

        if (!gameId.trim()) {
            toast({
                title: "Error",
                description: "Please enter a game ID",
                variant: "destructive"
            });
            return;
        }

        if (!validateUUID(gameId)) {
            toast({
                title: "Invalid Game ID",
                description: "Please enter a valid game ID",
                variant: "destructive"
            });
            return;
        }

        navigate(`/game/${gameId}`);
        setShowJoinModal(false);
        toast({
            title: "Joining Game",
            description: "Connecting to game room..."
        });
    };

    return (
        <>
            <main className="flex-1 bg-gradient-to-b from-background to-muted/20">
                <div className="container mx-auto px-4 py-16">
                    <Card className="max-w-2xl mx-auto">
                        <div className="p-8 space-y-6">
                            <div className="space-y-2 text-center">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Welcome to ActPoly
                                </h1>
                                <p className="text-muted-foreground">
                                    Experience the classic game of Monopoly with a modern twist. Create a new game room
                                    or join an existing one to start playing!
                                </p>
                            </div>

                            {!user && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <p className="text-sm text-orange-600 text-center">
                                        Please login to create or join games
                                    </p>
                                </div>
                            )}

                            <div className="grid sm:grid-cols-2 gap-6">
                                <Button
                                    size="lg"
                                    onClick={handleCreateGame}
                                    className="h-24 flex items-center"
                                >
                                    <Dices style={{width: '32px', height: '32px'}} className="mr-4"/>
                                    <div className="text-left">
                                        <div className="text-lg font-semibold">Create Game</div>
                                        <div className="text-sm text-muted-foreground">Start a new game room</div>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => {
                                        if (!user) {
                                            toast({
                                                title: "Authentication Required",
                                                description: "Please login to join a game",
                                                variant: "destructive"
                                            });
                                            return;
                                        }
                                        setShowJoinModal(true);
                                    }}
                                    className="h-24 flex items-center"
                                >
                                    <Users style={{width: '32px', height: '32px'}} className="mr-4"/>
                                    <div className="text-left">
                                        <div className="text-lg font-semibold">Join Game</div>
                                        <div className="text-sm text-muted-foreground">Enter an existing room</div>
                                    </div>
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>

            <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Join Existing Game</DialogTitle>
                        <DialogDescription>
                            Enter the game ID provided by the game creator
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleJoinGame} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Input
                                id="gameId"
                                placeholder="Paste game ID here"
                                value={gameId}
                                onChange={(e) => setGameId(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowJoinModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">
                                Join Game
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};
