import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import { validate as validateUUID } from 'uuid';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { useUserStore } from '@/store/userStore';

export const MainContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserStore();
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
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="p-6 shadow-md rounded-lg">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">
            Welcome to Monopoly!
          </h2>
          <p className="text-gray-600 mb-8">
            Experience the classic game of Monopoly with a modern twist. Create a new game room or join an existing one to start playing!
            {!user && (
              <span className="block mt-2 text-sm text-orange-600">
                * Please login to create or join games
              </span>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="default"
              size="lg"
              onClick={handleCreateGame}
              className="flex-1"
            >
              Create New Game
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
              className="flex-1"
            >
              Join Game
            </Button>
          </div>
        </Card>
      </main>

      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Game</DialogTitle>
            <DialogDescription>
              Enter the game ID to join an existing game
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleJoinGame} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="gameId"
                placeholder="Enter game ID"
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