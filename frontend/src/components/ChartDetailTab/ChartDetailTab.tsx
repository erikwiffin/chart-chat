import { ChartCard } from "../ChartCard/ChartCard";

type Props = {
  title: string;
  spec: string;
};

export function ChartDetailTab({ title, spec }: Props) {
  return (
    <div className="overflow-y-auto h-full">
      <ChartCard title={title} spec={spec} />
    </div>
  );
}
