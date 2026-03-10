import { useMutation, useQuery } from "@apollo/client/react";
import { useApolloClient } from "@apollo/client/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreateProjectDocument,
  GetProjectsDocument,
  SendMessageDocument,
} from "../../__generated__/graphql";
import { API_BASE_URL } from "../../config";
import { HomeView } from "./HomeView";

export function Home() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const client = useApolloClient();

  const { data: projectsData } = useQuery(GetProjectsDocument, { fetchPolicy: "cache-and-network" });
  const [createProject, { loading: isCreating }] = useMutation(CreateProjectDocument);
  const [sendMessage] = useMutation(SendMessageDocument);

  const projects = projectsData?.projects ?? [];
  const canSubmit = Boolean(input.trim() && file && !isCreating && !isUploading);

  const handleSubmit = async () => {
    if (!input.trim() || !file || isCreating || isUploading) return;
    setUploadError(null);

    const content = input.trim();

    // 1. Create project (no message yet, so no LLM run)
    const createResult = await createProject({
      variables: { name: "New project" },
    });
    const project = createResult.data?.createProject;
    if (!project) return;

    // 2. Upload file so the data source exists before the LLM runs
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${project.id}/upload`,
        { method: "POST", body: formData }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      await client.refetchQueries({ include: ["GetProjectDataSources"] });

      // 3. Send the prompt as the first message (LLM now sees the data source)
      await sendMessage({
        variables: { projectId: project.id, content },
      });

      navigate(`/project/${project.id}`);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <HomeView
      input={input}
      onInputChange={setInput}
      file={file}
      onFileSelect={setFile}
      onFileClear={() => {
        setFile(null);
        setUploadError(null);
      }}
      canSubmit={canSubmit}
      onSubmit={handleSubmit}
      projects={projects}
      onProjectSelect={(id, _name) => navigate(`/project/${id}`)}
      isCreating={isCreating}
      isUploading={isUploading}
      uploadError={uploadError}
    />
  );
}
