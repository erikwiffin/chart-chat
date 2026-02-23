import { useState } from "react";
import { ChatPanelView } from "./ChatPanelView";

type Message = {
  id: string;
  text: string;
  sender: "user" | "assistant";
};

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: input, sender: "user" },
    ]);
    setInput("");
  };

  return (
    <ChatPanelView
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSend={handleSend}
    />
  );
}
