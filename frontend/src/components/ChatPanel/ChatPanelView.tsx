import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

type Message = { id: string; content: string; role: string };

type Props = {
  projectName: string;
  onHome: () => void;
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export function ChatPanelView({
  projectName,
  onHome,
  messages,
  input,
  onInputChange,
  onSend,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-base-300 flex items-center gap-2">
        <button
          className="btn btn-sm btn-ghost"
          onClick={onHome}
          title="Home"
          aria-label="Go home"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7A1 1 0 003 11h1v6a1 1 0 001 1h4a1 1 0 001-1v-4h2v4a1 1 0 001 1h4a1 1 0 001-1v-6h1a1 1 0 00.707-1.707l-7-7z" />
          </svg>
        </button>
        {projectName ? (
          <span className="font-medium text-base-content truncate">{projectName}</span>
        ) : (
          <span className="font-medium text-base-content/50 truncate italic">Generating name…</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-base-content/50 mt-8">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-bubble">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-base-300">
        <textarea
          className="textarea w-full resize-none"
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
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
