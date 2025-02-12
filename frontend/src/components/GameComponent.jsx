import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useUserStore } from "@/store/userStore";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const GameComponent = () => {
  const { game_uuid } = useParams();
  const { user } = useUserStore();
  const { toast } = useToast();

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [wsStatus, setWsStatus] = useState("connecting");

  const wsRef = useRef(null);
  const scrollRef = useRef(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please login to join the chat",
        variant: "destructive",
      });
      return;
    }

    const connectWebSocket = () => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(`wss://localhost/api/ws/game/${game_uuid}`);

      ws.onopen = () => {
        setWsStatus("connected");
        toast({ title: "Connected", description: "Connected to the game chat" });
        reconnectAttempts.current = 0; // Reset attempts on success
      };

      ws.onmessage = (event) => {
        const data = event.data;
        setMessages((prev) => [...prev, { sender: "Server", content: data, timestamp: new Date().toISOString() }]);

        // Auto-scroll
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      };

      ws.onclose = () => {
        setWsStatus("disconnected");
        toast({
          title: "Disconnected",
          description: "Lost connection to the game chat. Reconnecting...",
          variant: "destructive",
        });

        if (reconnectAttempts.current < 5) {
          setTimeout(connectWebSocket, 2000 * reconnectAttempts.current);
          reconnectAttempts.current += 1;
        }
      };

      ws.onerror = () => {
        setWsStatus("error");
        toast({
          title: "Error",
          description: "Failed to connect to the game chat",
          variant: "destructive",
        });
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [game_uuid, user, toast]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Error",
        description: "Connection lost. Please wait while we reconnect.",
        variant: "destructive",
      });
      return;
    }

    const messageData = {
      type: "game",
      content: message,
      timestamp: Math.floor(Date.now() / 1000),
    };

    wsRef.current.send(JSON.stringify(messageData));
    setMessage("");
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Game Chat</span>
          <span
            className={`text-sm px-2 py-1 rounded-full ${
              wsStatus === "connected" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {wsStatus === "connected" ? "Connected" : "Reconnecting..."}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-[450px] pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex items-start gap-2 ${msg.sender === user?.username ? "flex-row-reverse" : ""}`}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${msg.sender}`} alt={msg.sender} />
                  <AvatarFallback>{msg.sender.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[80%] ${
                    msg.sender === user?.username ? "bg-blue-500 text-white" : "bg-gray-100"
                  } rounded-lg p-2`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${msg.sender === user?.username ? "text-blue-50" : "text-gray-600"}`}>
                      {msg.sender}
                    </span>
                    <span className={`text-xs ${msg.sender === user?.username ? "text-blue-100" : "text-gray-400"}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="break-words">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={sendMessage} className="w-full flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={wsStatus !== "connected"}
            className="flex-grow"
          />
          <Button type="submit" disabled={wsStatus !== "connected" || !message.trim()}>
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
