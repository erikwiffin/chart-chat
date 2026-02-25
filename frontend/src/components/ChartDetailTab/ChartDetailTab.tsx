import { useEffect, useRef, useState } from "react";
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
  const [editSpec, setEditSpec] = useState(spec);
  const [validationError, setValidationError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCommittedRef = useRef(spec);

  const [updateChart, { loading: isSaving }] = useMutation(UpdateChartDocument);

  // Sync incoming spec prop when not diverged from the committed spec
  useEffect(() => {
    if (editSpec === prevCommittedRef.current) {
      setEditSpec(spec);
    }
    prevCommittedRef.current = spec;
  }, [spec]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function validate(value: string): string | null {
    try {
      const parsed = JSON.parse(value);
      compile(parsed);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }

  function handleToggleMode() {
    if (mode === "view") {
      setEditSpec(spec);
      setValidationError(null);
      setMode("edit");
    } else {
      handleCancel();
    }
  }

  function handleSpecChange(newValue: string) {
    setEditSpec(newValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setValidationError(validate(newValue));
    }, 1000);
  }

  async function handleSave() {
    const error = validate(editSpec);
    if (error) {
      setValidationError(error);
      return;
    }
    await updateChart({ variables: { chartId, spec: editSpec } });
    setMode("view");
  }

  function handleCancel() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
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
      committedSpec={spec}
      editSpec={editSpec}
      mode={mode}
      validationError={validationError}
      isSaving={isSaving}
      onToggleMode={handleToggleMode}
      onSpecChange={handleSpecChange}
      onSave={handleSave}
      onCancel={handleCancel}
      onPrettify={handlePrettify}
    />
  );
}
