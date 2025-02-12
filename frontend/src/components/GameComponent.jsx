import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertCircle, Dices, Play } from "lucide-react"

export const GameComponent = () => {
  const { game_uuid } = useParams()
  const [boardTiles, setBoardTiles] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedTile, setSelectedTile] = useState(null)
  const ws = useRef(null)

  useEffect(() => {
    if (game_uuid) {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws"
      ws.current = new WebSocket(`${protocol}://${window.location.host}/api/ws/game/${game_uuid}`)

      ws.current.onopen = () => {
        console.log("WebSocket connected")
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "game" && Array.isArray(data.content)) {
            const sortedTiles = data.content.sort((a, b) => a.index - b.index)
            setBoardTiles(sortedTiles)
          } else {
            setMessages((prev) => [...prev, data])
          }
        } catch (error) {
          console.error("Error parsing message:", error)
        }
      }

      ws.current.onclose = () => {
        console.log("WebSocket disconnected")
      }

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error)
      }

      return () => {
        if (ws.current) ws.current.close()
      }
    }
  }, [game_uuid])

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.error("WebSocket is not connected.")
    }
  }

  const handleStartGame = () => {
    sendMessage({ type: "game", content: "start" })
  }

  const handleRollDice = () => {
    sendMessage({ type: "game", content: "roll" })
  }

  const getTileByIndex = (targetIndex) => {
    return boardTiles.find((tile) => tile.index === targetIndex)
  }

  const getTileStyle = (tile) => {
    if (!tile) return { backgroundColor: "bg-white" }

    if (tile.type === "property" && tile.property?.group?.color) {
      // Convert hex to Tailwind color when possible, fallback to inline style
      return {
        style: { backgroundColor: tile.property.group.color },
      }
    } else if (tile.type === "company") {
      return { className: "bg-green-100" }
    } else if (tile.type === "railway") {
      return { className: "bg-red-100" }
    } else if (tile.type === "special") {
      return { className: "bg-gray-100" }
    }
    return { className: "bg-white" }
  }

  const renderTileLabel = (tile) => {
    if (!tile) return null

    const label = (() => {
      switch (tile.type) {
        case "company":
          return tile.company?.name || "Company"
        case "railway":
          return tile.railway?.name || "Railway"
        case "property":
          return tile.property?.name || "Property"
        case "special":
          return tile.special?.type || "Special"
        default:
          return "Tile"
      }
    })()

    return <span className="text-xs font-medium text-center truncate">{label}</span>
  }

  // Board section renderers
  const renderTopRow = () => {
    const cells = []
    for (let i = 20; i <= 30; i++) {
      const tile = getTileByIndex(i)
      const tileStyle = getTileStyle(tile)
      cells.push(
        <div
          key={`top-${i}`}
          className={`tile-cell ${tileStyle.className || ""}`}
          style={tileStyle.style}
          onClick={() => setSelectedTile(tile)}
        >
          {renderTileLabel(tile)}
        </div>,
      )
    }
    return <div className="flex">{cells}</div>
  }

  const renderBottomRow = () => {
    const cells = []
    for (let i = 10; i >= 0; i--) {
      const tile = getTileByIndex(i)
      const tileStyle = getTileStyle(tile)
      cells.push(
        <div
          key={`bottom-${i}`}
          className={`tile-cell ${tileStyle.className || ""}`}
          style={tileStyle.style}
          onClick={() => setSelectedTile(tile)}
        >
          {renderTileLabel(tile)}
        </div>,
      )
    }
    return <div className="flex">{cells}</div>
  }

  const renderLeftColumn = () => {
    const cells = []
    for (let i = 19; i >= 11; i--) {
      const tile = getTileByIndex(i)
      const tileStyle = getTileStyle(tile)
      cells.push(
        <div
          key={`left-${i}`}
          className={`tile-cell vertical ${tileStyle.className || ""}`}
          style={tileStyle.style}
          onClick={() => setSelectedTile(tile)}
        >
          {renderTileLabel(tile)}
        </div>,
      )
    }
    return <div className="flex flex-col">{cells}</div>
  }

  const renderRightColumn = () => {
    const cells = []
    for (let i = 31; i <= 39; i++) {
      const tile = getTileByIndex(i)
      const tileStyle = getTileStyle(tile)
      cells.push(
        <div
          key={`right-${i}`}
          className={`tile-cell vertical ${tileStyle.className || ""}`}
          style={tileStyle.style}
          onClick={() => setSelectedTile(tile)}
        >
          {renderTileLabel(tile)}
        </div>,
      )
    }
    return <div className="flex flex-col">{cells}</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <div className="flex-1">Monopoly Game</div>
            <Badge variant="outline" className="text-sm font-normal">
              ID: {game_uuid}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={handleStartGame} className="flex items-center gap-2">
              <Play size={16} />
              Start Game
            </Button>
            <Button onClick={handleRollDice} variant="secondary" className="flex items-center gap-2">
              <Dices size={16} />
              Roll Dice
            </Button>
          </div>

          <div className="board-container border-2 border-black w-full max-w-2xl mx-auto">
            {renderTopRow()}
            <div className="flex">
              {renderLeftColumn()}
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-2xl font-bold text-gray-300 rotate-45">MONOPOLY</div>
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
                    {index < messages.length - 1 && <Separator className="my-2" />}
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Dialog>
          <DialogTrigger asChild>
            <span className="sr-only">View tile details</span>
          </DialogTrigger>
          {selectedTile && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{renderTileLabel(selectedTile)}</DialogTitle>
                <DialogDescription>Tile Index: {selectedTile.index}</DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Tile Details</h3>
                {selectedTile.type === "property" && (
                  <div>
                    <p>Price: £{selectedTile.property.price}</p>
                    <p>Rent: £{selectedTile.property.rent_0_house}</p>
                    <p>Mortgage: £{selectedTile.property.mortgage}</p>
                    <p>Color: {selectedTile.property.group.name}</p>
                  </div>
                )}
                {selectedTile.type === "railway" && (
                  <div>
                    <p>Price: £{selectedTile.railway.price}</p>
                    <p>Rent (1 railway): £{selectedTile.railway.rent_1}</p>
                    <p>Rent (4 railways): £{selectedTile.railway.rent_4}</p>
                    <p>Mortgage: £{selectedTile.railway.mortgage}</p>
                  </div>
                )}
                {selectedTile.type === "company" && (
                  <div>
                    <p>Price: £{selectedTile.company.price}</p>
                    <p>Rent Multiplier: {selectedTile.company.rent_1}x dice roll</p>
                    <p>Mortgage: £{selectedTile.company.mortgage}</p>
                  </div>
                )}
                {selectedTile.type === "special" && (
                  <div>
                    <p>Type: {selectedTile.special.type}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>

      <style jsx>{`
        .tile-cell {
          flex: 1;
          border: 1px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          margin: 1px;
          min-height: 50px;
          cursor: pointer;
          overflow: hidden;
        }
        .tile-cell.vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          min-height: 60px;
          padding: 4px;
        }
      `}</style>
    </div>
  )
}

