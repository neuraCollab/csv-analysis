import { ResponsiveHeatMap } from "@nivo/heatmap";

const data = [
  { id: "A", data: [{ x: "Recency", y: 10 }, { x: "Frequency", y: 2 }, { x: "Monetary", y: 3 }] },
  { id: "B", data: [{ x: "Recency", y: 4 }, { x: "Frequency", y: 5 }, { x: "Monetary", y: 8 }] },
];

export default function HeatmapChart() {
  return (
    <div className="h-96">
      <ResponsiveHeatMap
        data={data}
        keys={["Recency", "Frequency", "Monetary"]}
        indexBy="id"
        colors="blues"
        margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
        axisLeft={{ legend: "Клиенты", legendPosition: "middle", legendOffset: -40 }}
        axisBottom={{ legend: "Параметры RFM", legendPosition: "middle", legendOffset: 30 }}
      />
    </div>
  );
}
