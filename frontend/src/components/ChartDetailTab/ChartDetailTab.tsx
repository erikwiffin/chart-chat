import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { compile } from "vega-lite";
import { UpdateChartDocument } from "../../__generated__/graphql";
import { ChartDetailTabView } from "./ChartDetailTabView";

type Props = {
  chartId: string;
  title: string;
  spec: string;
};

export function ChartDetailTab({ chartId, title, spec }: Props) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editTitle, setEditTitle] = useState(title);
  const [editSpec, setEditSpec] = useState(
    JSON.stringify(JSON.parse(spec), null, 4),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const [updateChart, { loading: isSaving }] = useMutation(UpdateChartDocument);

  function validate(value: string): string | null {
    try {
      const parsed = JSON.parse(value);
      compile(parsed);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }

  function handleTitleChange(newValue: string) {
    setEditTitle(newValue);
  }

  function handleSpecChange(newValue: string) {
    setEditSpec(newValue);
    setValidationError(validate(newValue));
  }

  function handleEdit() {
    setMode("edit");
  }

  async function handleSave() {
    const error = validate(editSpec);
    if (error) {
      setValidationError(error);
      return;
    }
    await updateChart({
      variables: { chartId, title: editTitle, spec: editSpec },
    });
    setMode("view");
  }

  function handleCancel() {
    setMode("view");
    setEditSpec(spec);
    setValidationError(null);
  }

  function handlePrettify() {
    try {
      const prettified = JSON.stringify(JSON.parse(editSpec), null, 4);
      handleSpecChange(prettified);
    } catch {
      // invalid JSON — do nothing
    }
  }

  return (
    <ChartDetailTabView
      title={title}
      editTitle={editTitle}
      committedSpec={spec}
      editSpec={editSpec}
      mode={mode}
      validationError={validationError}
      isSaving={isSaving}
      onEdit={handleEdit}
      onTitleChange={handleTitleChange}
      onSpecChange={handleSpecChange}
      onSave={handleSave}
      onCancel={handleCancel}
      onPrettify={handlePrettify}
    />
  );
}
