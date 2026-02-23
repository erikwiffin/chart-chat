import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { CREATE_PROJECT, SEND_MESSAGE } from "../../graphql/mutations";
import { GET_PROJECTS, GET_PROJECT_MESSAGES } from "../../graphql/queries";
import { ChatPanelView } from "./ChatPanelView";

type Project = { id: string; name: string };
type Message = { id: string; content: string; role: string; createdAt: string };

export function ChatPanel() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const { data: projectsData } = useQuery<{ projects: Project[] }>(GET_PROJECTS);
  const { data: messagesData } = useQuery<{ project: { id: string; messages: Message[] } | null }>(GET_PROJECT_MESSAGES, {
    variables: { projectId: selectedProjectId },
    skip: !selectedProjectId,
  });

  const [createProject] = useMutation<{ createProject: Project }>(CREATE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS }],
  });

  const [sendMessage] = useMutation(SEND_MESSAGE, {
    refetchQueries: [
      { query: GET_PROJECT_MESSAGES, variables: { projectId: selectedProjectId } },
    ],
  });

  const projects: Project[] = projectsData?.projects ?? [];
  const messages: Message[] = messagesData?.project?.messages ?? [];

  const handleSend = async () => {
    if (!input.trim() || !selectedProjectId) return;
    await sendMessage({ variables: { projectId: selectedProjectId, content: input.trim() } });
    setInput("");
  };

  const handleCreateProject = async (name: string) => {
    const result = await createProject({ variables: { name } });
    const newId = result.data?.createProject?.id;
    if (newId) setSelectedProjectId(newId);
  };

  return (
    <ChatPanelView
      projects={projects}
      selectedProjectId={selectedProjectId}
      onProjectSelect={setSelectedProjectId}
      onCreateProject={handleCreateProject}
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSend={handleSend}
    />
  );
}
