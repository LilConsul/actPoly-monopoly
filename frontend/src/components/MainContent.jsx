import React from 'react';
import { Card } from '@/components/ui/card'; // Adjust the path as needed
import { Button } from '@/components/ui/button'; // Adjust the path as needed

export const MainContent = () => {
  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <Card className="p-6 shadow-md rounded-lg">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">
          Welcome to Monopoly!
        </h2>
        <p className="text-gray-600">
          Experience the classic game of Monopoly with a modern twist. Start a new game, join an existing room, or check out your stats!
        </p>
        <div className="mt-6">
          <Button variant="primary" size="lg">
            Start Game
          </Button>
        </div>
      </Card>
    </main>
  );
};
