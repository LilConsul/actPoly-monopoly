import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AlertCircle, Dices, Play, Copy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const GameComponent = () => {
  const { game_uuid } = useParams();
  const [boardTiles, setBoardTiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const ws = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (game_uuid) {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      ws.current = new WebSocket(
        `${protocol}://${window.location.host}/api/ws/game/${game_uuid}`
      );

      ws.current.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'game' && Array.isArray(data.content)) {
            const sortedTiles = data.content.sort((a, b) => a.index - b.index);
            setBoardTiles(sortedTiles);
          } else {
            setMessages((prev) => [...prev, data]);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return () => {
        if (ws.current) ws.current.close();
      };
    }
  }, [game_uuid]);

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected.');
    }
  };

  const handleStartGame = () => {
    sendMessage({ type: 'game', content: 'start' });
  };

  const handleRollDice = () => {
    sendMessage({ type: 'game', content: 'roll' });
  };

  const handleCopyGameId = () => {
    navigator.clipboard.writeText(game_uuid);
    setCopied(true);
    toast({
      title: 'Copied',
      description: 'Game ID copied to clipboard',
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getTileByIndex = (targetIndex) => {
    return boardTiles.find((tile) => tile.index === targetIndex);
  };

  const isCornerTile = (index) => {
    return [0, 10, 20, 30].includes(index);
  };

  const getTileStyle = (tile) => {
    if (!tile) return { className: 'bg-white' };

    let color = '#FFFFFF';
    if (tile.type === 'property' && tile.property?.group?.color) {
      color = tile.property.group.color;
    } else if (tile.type === 'company') {
      color = '#E6F4EA'; // Light green for companies
    } else if (tile.type === 'railway') {
      color = '#FCE8E8'; // Light red for railways
    } else if (tile.type === 'special') {
      color = '#F1F3F4'; // Light gray for special
    }

    return { color };
  };

  const renderTileLabel = (tile) => {
    if (!tile) return null;

    const label = (() => {
      switch (tile.type) {
        case 'company':
          return tile.company?.name || 'Company';
        case 'railway':
          return tile.railway?.name || 'Railway';
        case 'property':
          return tile.property?.name || 'Property';
        case 'special':
          return tile.special?.type || 'Special';
        default:
          return 'Tile';
      }
    })();

    return (
      <span className="text-xs font-medium text-center truncate">
        {label}
      </span>
    );
  };

  // ─── BOARD RENDERERS WITH TAILWIND CLASSES ───────────────────────────────

  // Top row: horizontal cells (except corners)
  const renderTopRow = () => {
    const cells = [];
    for (let i = 20; i <= 30; i++) {
      const tile = getTileByIndex(i);
      const tileStyle = getTileStyle(tile);
      const isCorner = isCornerTile(i);
      const cellClasses = isCorner
        ? 'border border-black flex flex-col items-center justify-center relative bg-white cursor-pointer overflow-hidden w-28 h-28 p-2'
        : 'border border-black flex flex-col items-center justify-center relative bg-white cursor-pointer overflow-hidden w-20 h-28 p-1';
      cells.push(
        <div
          key={`top-${i}`}
          className={cellClasses}
          onClick={() => {
            setSelectedTile(tile);
            setDialogOpen(true);
          }}
        >
          {/* For top cells, the color strip appears at the top */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: tileStyle.color }}
          ></div>
          <div className="mt-4">{renderTileLabel(tile)}</div>
        </div>
      );
    }
    return <div className="flex">{cells}</div>;
  };

  // Bottom row: horizontal cells (except corners) with color strip at the bottom
  const renderBottomRow = () => {
    const cells = [];
    for (let i = 10; i >= 0; i--) {
      const tile = getTileByIndex(i);
      const tileStyle = getTileStyle(tile);
      const isCorner = isCornerTile(i);
      const cellClasses = isCorner
        ? 'border border-black flex flex-col items-center justify-center relative bg-white cursor-pointer overflow-hidden w-28 h-28 p-2'
        : 'border border-black flex flex-col items-center justify-center relative bg-white cursor-pointer overflow-hidden w-20 h-28 p-1';
      cells.push(
        <div
          key={`bottom-${i}`}
          className={cellClasses}
          onClick={() => {
            setSelectedTile(tile);
            setDialogOpen(true);
          }}
        >
          {/* For bottom cells, the color strip appears at the bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ backgroundColor: tileStyle.color }}
          ></div>
          <div className="mt-4">{renderTileLabel(tile)}</div>
        </div>
      );
    }
    return <div className="flex">{cells}</div>;
  };

  // Left column: vertical cells (non-corner) with color strip on the left side.
  const renderLeftColumn = () => {
    const cells = [];
    for (let i = 19; i >= 11; i--) {
      const tile = getTileByIndex(i);
      const tileStyle = getTileStyle(tile);
      const cellClasses =
        'border border-black flex flex-col items-center justify-center relative bg-white cursor-pointer overflow-hidden w-28 h-20 p-1';
      cells.push(
        <div
          key={`left-${i}`}
          className={cellClasses}
          onClick={() => {
            setSelectedTile(tile);
            setDialogOpen(true);
          }}
          // Use inline style to preserve the vertical text orientation
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: tileStyle.color }}
          ></div>
          <div className="mt-2">{renderTileLabel(tile)}</div>
        </div>
      );
    }
    return <div className="flex flex-col">{cells}</div>;
  };

  // Right column: vertical cells (non-corner) with color strip on the right side.
  const renderRightColumn = () => {
    const cells = [];
    for (let i = 31; i <= 39; i++) {
      const tile = getTileByIndex(i);
      const tileStyle = getTileStyle(tile);
      const cellClasses =
        'border border-black flex flex-col items-center justify-center relative bg-white cursor-pointer overflow-hidden w-28 h-20 p-1';
      cells.push(
        <div
          key={`right-${i}`}
          className={cellClasses}
          onClick={() => {
            setSelectedTile(tile);
            setDialogOpen(true);
          }}
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: tileStyle.color }}
          ></div>
          <div className="mt-2">{renderTileLabel(tile)}</div>
        </div>
      );
    }
    return <div className="flex flex-col">{cells}</div>;
  };

  // Helper function to format currency values
  const formatCurrency = (value) => {
    return `$${value}`;
  };

  const renderTileDetails = () => {
    if (!selectedTile) return null;

    let details = null;

    switch (selectedTile.type) {
      case 'property':
        const property = selectedTile.property;
        details = (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: property.group.color }}
              ></div>
              <span className="font-medium">{property.group.name} Group</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Price:</div>
              <div className="font-medium">{formatCurrency(property.price)}</div>

              <div>Mortgage Value:</div>
              <div className="font-medium">{formatCurrency(property.mortgage)}</div>

              <div>House Price:</div>
              <div className="font-medium">{formatCurrency(property.house_price)}</div>

              <div>Hotel Price:</div>
              <div className="font-medium">{formatCurrency(property.hotel_price)}</div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Rent</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>No buildings:</div>
                <div className="font-medium">
                  {formatCurrency(property.rent_0_house)}
                </div>

                <div>1 House:</div>
                <div className="font-medium">
                  {formatCurrency(property.rent_1_house)}
                </div>

                <div>2 Houses:</div>
                <div className="font-medium">
                  {formatCurrency(property.rent_2_house)}
                </div>

                <div>3 Houses:</div>
                <div className="font-medium">
                  {formatCurrency(property.rent_3_house)}
                </div>

                <div>4 Houses:</div>
                <div className="font-medium">
                  {formatCurrency(property.rent_4_house)}
                </div>

                <div>Hotel:</div>
                <div className="font-medium">
                  {formatCurrency(property.rent_hotel)}
                </div>
              </div>
            </div>
          </div>
        );
        break;

      case 'railway':
        const railway = selectedTile.railway;
        details = (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Price:</div>
              <div className="font-medium">{formatCurrency(railway.price)}</div>

              <div>Mortgage Value:</div>
              <div className="font-medium">{formatCurrency(railway.mortgage)}</div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Rent</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>1 Railway:</div>
                <div className="font-medium">{formatCurrency(railway.rent_1)}</div>

                <div>2 Railways:</div>
                <div className="font-medium">{formatCurrency(railway.rent_2)}</div>

                <div>3 Railways:</div>
                <div className="font-medium">{formatCurrency(railway.rent_3)}</div>

                <div>4 Railways:</div>
                <div className="font-medium">{formatCurrency(railway.rent_4)}</div>
              </div>
            </div>
          </div>
        );
        break;

      case 'company':
        const company = selectedTile.company;
        details = (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Price:</div>
              <div className="font-medium">{formatCurrency(company.price)}</div>

              <div>Mortgage Value:</div>
              <div className="font-medium">{formatCurrency(company.mortgage)}</div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Rent</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>1 Company:</div>
                <div className="font-medium">{company.rent_1}× dice roll</div>

                <div>2 Companies:</div>
                <div className="font-medium">{company.rent_2}× dice roll</div>
              </div>
            </div>
          </div>
        );
        break;

      case 'special':
        const special = selectedTile.special;
        details = (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Special Type:</div>
              <div className="font-medium capitalize">
                {special.type}
              </div>
            </div>
          </div>
        );
        break;
    }

    return details;
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <div className="flex-1">Monopoly Game</div>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={handleCopyGameId}
            >
              <Badge variant="outline" className="text-sm font-normal">
                {game_uuid}
              </Badge>
              {copied ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <Copy size={16} className="text-gray-500" />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={handleStartGame} className="flex items-center gap-2">
              <Play size={16} />
              Start Game
            </Button>
            <Button
              onClick={handleRollDice}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Dices size={16} />
              Roll Dice
            </Button>
          </div>

          {/* Board container – using an explicit width (944px) so the overall board is larger */}
          <div className="border-2 border-black w-[944px] mx-auto">
            {renderTopRow()}
            <div className="flex">
              {renderLeftColumn()}
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-2xl font-bold text-gray-300 rotate-45">
                  MONOPOLY
                </div>
              </div>
              {renderRightColumn()}
            </div>
            {renderBottomRow()}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Game Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <AlertCircle size={24} className="mb-2" />
                  <p>No messages yet</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="mb-2 last:mb-0">
                    {msg.timestamp && (
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    {index < messages.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTile?.property?.name ||
                selectedTile?.railway?.name ||
                selectedTile?.company?.name ||
                (selectedTile?.special?.type &&
                  `${selectedTile.special.type.charAt(0).toUpperCase()}${selectedTile.special.type.slice(
                    1
                  )}`) ||
                'Tile Details'}
            </DialogTitle>
            <DialogDescription>
              Position: {selectedTile?.index}
            </DialogDescription>
          </DialogHeader>
          {renderTileDetails()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
