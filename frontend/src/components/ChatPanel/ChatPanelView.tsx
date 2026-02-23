type Message = {
  id: string;
  text: string;
  sender: "user" | "assistant";
};

type Props = {
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export function ChatPanelView({ messages, input, onInputChange, onSend }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-base-300">
        <h2 className="font-semibold text-lg">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat ${msg.sender === "user" ? "chat-end" : "chat-start"}`}
          >
            <div className="chat-bubble">{msg.text}</div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-base-300">
        <textarea
          className="textarea textarea-bordered w-full resize-none"
          placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
          rows={3}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
      </div>
    </div>
  );
}
