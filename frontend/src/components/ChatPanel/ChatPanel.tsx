import { useMutation, useQuery, useSubscription } from "@apollo/client/react";
import { useEffect, useState } from "react";
import type { GetProjectMessagesQuery } from "../../__generated__/graphql";
import {
  GetProjectMessagesDocument,
  MessageAddedDocument,
  ProjectNameUpdatedDocument,
  SendMessageDocument,
} from "../../__generated__/graphql";
import { ChatPanelView } from "./ChatPanelView";

type Props = {
  projectId: string;
  projectName: string;
  onHome: () => void;
};

export function ChatPanel({ projectId, projectName, onHome }: Props) {
  const [input, setInput] = useState("");
  const [displayedName, setDisplayedName] = useState(projectName);

  useSubscription(ProjectNameUpdatedDocument, {
    variables: { projectId },
    onData: ({ data }) => {
      const name = data.data?.projectNameUpdated?.name;
      if (name) setDisplayedName(name);
    },
  });

  const { data: messagesData, subscribeToMore } = useQuery(GetProjectMessagesDocument, {
    variables: { projectId },
  });

  useEffect(() => {
    return subscribeToMore({
      document: MessageAddedDocument,
      variables: { projectId },
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
  }, [projectId, subscribeToMore]);

  const [sendMessage] = useMutation(SendMessageDocument, {
    refetchQueries: [
      { query: GetProjectMessagesDocument, variables: { projectId } },
    ],
  });

  const messages = messagesData?.project?.messages ?? [];

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage({ variables: { projectId, content: input.trim() } });
    setInput("");
  };

  return (
    <ChatPanelView
      projectName={displayedName}
      onHome={onHome}
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSend={handleSend}
    />
  );
}
