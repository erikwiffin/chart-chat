import { useMutation, useQuery, useSubscription } from "@apollo/client/react";
import { useEffect, useState } from "react";
import type { GetProjectMessagesQuery } from "../../__generated__/graphql";
import {
  GetProjectMessagesDocument,
  MessageAddedDocument,
  ProjectNameUpdatedDocument,
  SendMessageDocument,
  StatusUpdateDocument,
  StopGenerationDocument,
} from "../../__generated__/graphql";
import { ChatPanelView } from "./ChatPanelView";

type Props = {
  projectId: string;
  projectName: string;
  onHome: () => void;
  activeChartId: string | null;
};

export function ChatPanel({
  projectId,
  projectName,
  onHome,
  activeChartId,
}: Props) {
  const [input, setInput] = useState("");
  const [displayedName, setDisplayedName] = useState(projectName);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useSubscription(ProjectNameUpdatedDocument, {
    variables: { projectId },
    onData: ({ data }) => {
      const name = data.data?.projectNameUpdated?.name;
      if (name) setDisplayedName(name);
    },
  });

  useSubscription(StatusUpdateDocument, {
    variables: { projectId },
    onData: ({ data }) => {
      const update = data.data?.statusUpdate;
      if (update) {
        setIsGenerating(update.isGenerating);
        setStatusMessage(update.isGenerating ? update.message : null);
      }
    },
  });

  const { data: messagesData, subscribeToMore } = useQuery(
    GetProjectMessagesDocument,
    {
      variables: { projectId },
    },
  );

  useEffect(() => {
    return subscribeToMore({
      document: MessageAddedDocument,
      variables: { projectId },
      updateQuery: (prev, { subscriptionData }): GetProjectMessagesQuery => {
        const newMessage = subscriptionData.data?.messageAdded;
        if (!newMessage || !prev.project)
          return prev as GetProjectMessagesQuery;
        const existing = prev.project.messages ?? [];
        if (existing.some((m) => m.id === newMessage.id))
          return prev as GetProjectMessagesQuery;
        return {
          ...prev,
          project: {
            ...prev.project,
            messages: [...existing, newMessage],
          },
        } as GetProjectMessagesQuery;
      },
    });
  }, [projectId, subscribeToMore]);

  const [sendMessage] = useMutation(SendMessageDocument);

  const [stopGeneration] = useMutation(StopGenerationDocument);

  const messages = messagesData?.project?.messages ?? [];

  const handleSend = async () => {
    if (!input.trim()) return;
    setIsGenerating(true);
    await sendMessage({
      variables: { projectId, content: input.trim(), activeChartId },
    });
    setInput("");
  };

  const handleStop = async () => {
    await stopGeneration({ variables: { projectId } });
  };

  return (
    <ChatPanelView
      projectName={displayedName}
      onHome={onHome}
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSend={handleSend}
      isGenerating={isGenerating}
      statusMessage={statusMessage}
      onStop={handleStop}
    />
  );
}
