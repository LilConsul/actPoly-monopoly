import React, {useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Badge} from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {AlertCircle, Dices, Play, Copy, CheckCircle2} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useToast} from '@/hooks/use-toast';

export const GameComponent = () => {
    const {game_uuid} = useParams();
    const [boardTiles, setBoardTiles] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedTile, setSelectedTile] = useState(null);
    const [copied, setCopied] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const ws = useRef(null);
    const {toast} = useToast();

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
        sendMessage({type: 'game', content: 'start'});
    };

    const handleRollDice = () => {
        sendMessage({type: 'game', content: 'roll'});
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
                                style={{backgroundColor: property.group.color}}
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

    const formatCurrency = (value) => {
        return `$${value}`;
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

    const getTileByIndex = (index) => {
        return boardTiles.find((tile) => tile.index === index);
    };

    const isCornerTile = (index) => {
        return [0, 10, 20, 30].includes(index);
    };

    const getTileStyle = (tile) => {
        if (!tile) return {color: '#FFFFFF'};

        let color = '#FFFFFF';
        let textColor = 'text-gray-900';

        if (tile.type === 'property' && tile.property?.group?.color) {
            color = tile.property.group.color;
            // Use white text for dark colored properties
            if (['#1e3f76', '#1fb25a', '#952d2d'].includes(tile.property.group.color)) {
                textColor = 'text-white';
            }
        } else if (tile.type === 'company') {
            color = '#E6F4EA';
        } else if (tile.type === 'railway') {
            color = '#FCE8E8';
        } else if (tile.type === 'special') {
            color = '#F1F3F4';
        }

        return {color, textColor};
    };

    const renderTileLabel = (tile, isVertical = false) => {
        if (!tile) return null;

        const {textColor} = getTileStyle(tile);
        let label = '';
        let price = null;

        switch (tile.type) {
            case 'company':
                label = tile.company?.name || 'Company';
                price = tile.company?.price;
                break;
            case 'railway':
                label = tile.railway?.name || 'Railway';
                price = tile.railway?.price;
                break;
            case 'property':
                label = tile.property?.name || 'Property';
                price = tile.property?.price;
                break;
            case 'special':
                label = tile.special?.type || 'Special';
                break;
        }

        return (
            <div className={`flex flex-col items-center ${isVertical ? 'writing-vertical' : ''}`}>
        <span className={`text-xs font-medium text-center ${textColor}`}>
          {label}
        </span>
                {price && (
                    <span className="text-xs mt-1 text-gray-600">
            ${price}
          </span>
                )}
            </div>
        );
    };

    const renderCornerTile = (index) => {
        const tile = getTileByIndex(index);
        const cornerLabels = {
            0: 'GO',
            10: 'JAIL',
            20: 'FREE PARKING',
            30: 'GO TO JAIL'
        };

        return (
            <div
                key={`corner-${index}`}
                className="border border-gray-300 flex items-center justify-center bg-gray-50 cursor-pointer w-32 h-32 p-2 hover:bg-gray-100 transition-colors duration-200"
                onClick={() => {
                    setSelectedTile(tile);
                    setDialogOpen(true);
                }}
            >
        <span className="font-bold text-sm text-center text-gray-800">
          {cornerLabels[index]}
        </span>
            </div>
        );
    };

    const renderTopRow = () => {
        const cells = [];
        for (let i = 20; i <= 30; i++) {
            if (isCornerTile(i)) {
                cells.push(renderCornerTile(i));
                continue;
            }

            const tile = getTileByIndex(i);
            const {color} = getTileStyle(tile);

            cells.push(
                <div
                    key={`top-${i}`}
                    className="border border-gray-300 flex flex-col relative bg-white cursor-pointer hover:bg-gray-50 transition-colors duration-200 w-24 h-32 p-1"
                    onClick={() => {
                        setSelectedTile(tile);
                        setDialogOpen(true);
                    }}
                >
                    <div
                        className="absolute top-0 left-0 right-0 h-8"
                        style={{backgroundColor: color}}
                    />
                    <div className="mt-10 flex-1 flex items-center justify-center">
                        {renderTileLabel(tile)}
                    </div>
                </div>
            );
        }
        return <div className="flex">{cells}</div>;
    };

    const renderBottomRow = () => {
        const cells = [];
        for (let i = 10; i >= 0; i--) {
            if (isCornerTile(i)) {
                cells.push(renderCornerTile(i));
                continue;
            }

            const tile = getTileByIndex(i);
            const {color} = getTileStyle(tile);

            cells.push(
                <div
                    key={`bottom-${i}`}
                    className="border border-gray-300 flex flex-col relative bg-white cursor-pointer hover:bg-gray-50 transition-colors duration-200 w-24 h-32 p-1"
                    onClick={() => {
                        setSelectedTile(tile);
                        setDialogOpen(true);
                    }}
                >
                    <div className="mt-2 flex-1 flex items-center justify-center">
                        {renderTileLabel(tile)}
                    </div>
                    <div
                        className="absolute bottom-0 left-0 right-0 h-8"
                        style={{backgroundColor: color}}
                    />
                </div>
            );
        }
        return <div className="flex">{cells}</div>;
    };

    const renderSideColumn = (start, end, isLeft = true) => {
        const cells = [];
        const range = isLeft ? Array.from({length: Math.abs(start - end) + 1}, (_, i) => start - i)
            : Array.from({length: Math.abs(end - start) + 1}, (_, i) => start + i);

        for (const i of range) {
            const tile = getTileByIndex(i);
            const {color} = getTileStyle(tile);

            cells.push(
                <div
                    key={`${isLeft ? 'left' : 'right'}-${i}`}
                    className="border border-gray-300 flex relative bg-white cursor-pointer hover:bg-gray-50 transition-colors duration-200 h-24 w-32 p-1"
                    onClick={() => {
                        setSelectedTile(tile);
                        setDialogOpen(true);
                    }}
                >
                    <div
                        className={`absolute ${isLeft ? 'left-0' : 'right-0'} top-0 bottom-0 w-8`}
                        style={{backgroundColor: color}}
                    />
                    <div className={`flex-1 flex items-center justify-center ${isLeft ? 'ml-10' : 'mr-10'}`}>
                        {renderTileLabel(tile, true)}
                    </div>
                </div>
            );
        }
        return <div className="flex flex-col">{cells}</div>;
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <div className="flex-1">Monopoly Game</div>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={handleCopyGameId}>
                            <Badge variant="outline" className="text-sm font-normal">
                                {game_uuid}
                            </Badge>
                            {copied ? (
                                <CheckCircle2 size={16} className="text-green-500"/>
                            ) : (
                                <Copy size={16} className="text-gray-500"/>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-6">
                        <Button onClick={handleStartGame} className="flex items-center gap-2">
                            <Play size={16}/>
                            Start Game
                        </Button>
                        <Button onClick={handleRollDice} variant="secondary" className="flex items-center gap-2">
                            <Dices size={16}/>
                            Roll Dice
                        </Button>
                    </div>

                    <div className="border-2 border-gray-900 rounded-lg shadow-lg bg-white mx-auto max-w-fit">
                        {renderTopRow()}
                        <div className="flex">
                            {renderSideColumn(19, 11, true)}
                            <div className="flex-1 flex items-center justify-center p-4 min-w-[400px]">
                                <div className="text-center text-4xl font-bold text-gray-200 rotate-45 tracking-widest">
                                    MONOPOLY
                                </div>
                            </div>
                            {renderSideColumn(31, 39, false)}
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
                                    <AlertCircle size={24} className="mb-2"/>
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
                                            <Separator className="my-2"/>
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
