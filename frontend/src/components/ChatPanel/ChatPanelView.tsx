import { useState } from "react";

type Project = { id: string; name: string };
type Message = { id: string; content: string; role: string };

type Props = {
  projects: Project[];
  selectedProjectId: string | null;
  onProjectSelect: (id: string) => void;
  onCreateProject: (name: string) => void;
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export function ChatPanelView({
  projects,
  selectedProjectId,
  onProjectSelect,
  onCreateProject,
  messages,
  input,
  onInputChange,
  onSend,
}: Props) {
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim());
    setNewProjectName("");
    setShowNewProject(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-base-300 space-y-2">
        <div className="flex items-center gap-2">
          <select
            className="select select-bordered select-sm flex-1"
            value={selectedProjectId ?? ""}
            onChange={(e) => onProjectSelect(e.target.value)}
          >
            <option value="" disabled>Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setShowNewProject((v) => !v)}
            title="New project"
          >
            +
          </button>
        </div>

        {showNewProject && (
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered input-sm flex-1"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              autoFocus
            />
            <button className="btn btn-sm btn-primary" onClick={handleCreateProject}>
              Create
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {!selectedProjectId ? (
          <p className="text-center text-base-content/50 mt-8">
            Select or create a project to start chatting.
          </p>
        ) : messages.length === 0 ? (
          <p className="text-center text-base-content/50 mt-8">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-bubble">{msg.content}</div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-base-300">
        <textarea
          className="textarea textarea-bordered w-full resize-none"
          placeholder={
            selectedProjectId
              ? "Type a message… (Enter to send, Shift+Enter for newline)"
              : "Select a project first"
          }
          rows={3}
          disabled={!selectedProjectId}
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
