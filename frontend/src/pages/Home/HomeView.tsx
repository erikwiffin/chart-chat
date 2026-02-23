type Project = { id: string; name: string };

type Props = {
  input: string;
  onInputChange: (value: string) => void;
  onInputSubmit: () => void;
  projects: Project[];
  onProjectSelect: (id: string, name: string) => void;
  isCreating: boolean;
};

export function HomeView({
  input,
  onInputChange,
  onInputSubmit,
  projects,
  onProjectSelect,
  isCreating,
}: Props) {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold text-center text-base-content">Chart Chat</h1>

        <textarea
          className="textarea w-full resize-none text-base"
          placeholder="What do you want to explore?"
          rows={4}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onInputSubmit();
            }
          }}
          disabled={isCreating}
        />

        {isCreating && (
          <p className="text-center text-base-content/50 text-sm">Creating project…</p>
        )}
      </div>

      {projects.length > 0 && (
        <div className="w-full max-w-2xl mt-12">
          <h2 className="text-lg font-semibold text-base-content mb-4">Recent projects</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors"
                onClick={() => onProjectSelect(p.id, p.name)}
              >
                <div className="card-body p-4">
                  <p className="font-medium text-base-content line-clamp-2">{p.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
