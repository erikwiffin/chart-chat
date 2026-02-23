import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";
import type { GetProjectMessagesQuery } from "../../__generated__/graphql";
import {
  CreateProjectDocument,
  GetProjectMessagesDocument,
  GetProjectsDocument,
  MessageAddedDocument,
  SendMessageDocument,
} from "../../__generated__/graphql";
import { ChatPanelView } from "./ChatPanelView";

export function ChatPanel() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const { data: projectsData } = useQuery(GetProjectsDocument);
  const { data: messagesData, subscribeToMore } = useQuery(GetProjectMessagesDocument, {
    variables: { projectId: selectedProjectId ?? "" },
    skip: !selectedProjectId,
  });

  useEffect(() => {
    if (!selectedProjectId) return;
    return subscribeToMore({
      document: MessageAddedDocument,
      variables: { projectId: selectedProjectId },
      updateQuery: (prev, { subscriptionData }): GetProjectMessagesQuery => {
        const newMessage = subscriptionData.data?.messageAdded;
        if (!newMessage || !prev.project) return prev as GetProjectMessagesQuery;
        return {
          ...prev,
          project: {
            ...prev.project,
            messages: [...(prev.project.messages ?? []), newMessage],
          },
        } as GetProjectMessagesQuery;
      },
    });
  }, [selectedProjectId, subscribeToMore]);

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
