import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import {
  CreateProjectFromPromptDocument,
  GetProjectsDocument,
} from "../../__generated__/graphql";
import { HomeView } from "./HomeView";

type Props = {
  onProjectOpen: (projectId: string, projectName: string) => void;
};

export function Home({ onProjectOpen }: Props) {
  const [input, setInput] = useState("");

  const { data: projectsData } = useQuery(GetProjectsDocument, { fetchPolicy: "cache-and-network" });
  const [createProjectFromPrompt, { loading: isCreating }] = useMutation(
    CreateProjectFromPromptDocument
  );

  const projects = projectsData?.projects ?? [];

  const handleInputSubmit = async () => {
    if (!input.trim() || isCreating) return;
    const result = await createProjectFromPrompt({ variables: { content: input.trim() } });
    const project = result.data?.createProjectFromPrompt;
    if (project) {
      onProjectOpen(project.id, project.name);
    }
  };

  return (
    <HomeView
      input={input}
      onInputChange={setInput}
      onInputSubmit={handleInputSubmit}
      projects={projects}
      onProjectSelect={(id, name) => onProjectOpen(id, name)}
      isCreating={isCreating}
    />
  );
}
