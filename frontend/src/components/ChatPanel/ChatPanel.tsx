import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import {
  CreateProjectDocument,
  GetProjectMessagesDocument,
  GetProjectsDocument,
  SendMessageDocument,
} from "../../__generated__/graphql";
import { ChatPanelView } from "./ChatPanelView";

export function ChatPanel() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const { data: projectsData } = useQuery(GetProjectsDocument);
  const { data: messagesData } = useQuery(GetProjectMessagesDocument, {
    variables: { projectId: selectedProjectId ?? "" },
    skip: !selectedProjectId,
  });

  const [createProject] = useMutation(CreateProjectDocument, {
    refetchQueries: [{ query: GetProjectsDocument }],
  });

  const [sendMessage] = useMutation(SendMessageDocument, {
    refetchQueries: [
      { query: GetProjectMessagesDocument, variables: { projectId: selectedProjectId } },
    ],
  });

  const projects = projectsData?.projects ?? [];
  const messages = messagesData?.project?.messages ?? [];

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
