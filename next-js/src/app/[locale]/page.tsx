"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/Button";
import { CustomCard, CustomCardContent } from "@/components/ui/CardWrapper";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";
import { ResponsiveHeatMap } from "@nivo/heatmap";

export default function RFMAnalysisPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [rfmData, setRfmData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "text/csv": [".csv"] },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 2) {
        setFiles(acceptedFiles);
      } else {
        alert("Пожалуйста, загрузите два CSV-файла.");
      }
    },
  });

  const handleUpload = async () => {
    if (files.length !== 2) {
      alert("Необходимо загрузить 2 CSV-файла.");
      return;
    }

    const formData = new FormData();
    formData.append("transactions_file", files[0]);
    formData.append("customers_file", files[1]);

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8001/upload/", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.rfm_analysis && Array.isArray(data.rfm_analysis)) {
        setRfmData(data.rfm_analysis);
      } else {
        console.error("Неверный формат данных rfm_analysis:", data);
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setLoading(false);
    }
  };

  // Для тепловой карты преобразуем CustomerID в строку
  const heatmapData = rfmData.map(item => ({
    id: String(item.CustomerID),
    data: [
      { x: "Recency", y: item.Recency },
      { x: "Frequency", y: item.Frequency },
      { x: "Monetary", y: item.Monetary }
    ]
  }));
  

  return (
    <div className="p-6 mt-12  text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 ">RFM Анализ</h1>
      
      {/* Блок загрузки файлов */}
      <div className="mb-6">
        <p className="mb-2 text-lg">Загрузите два CSV-файла для анализа:</p>
        <div
          {...getRootProps()}
          className="border-dashed border-2 border-gray-600 p-6 cursor-pointer text-center bg-gray-800 rounded-md"
        >
          <input {...getInputProps()} />
          <p>Перетащите файлы сюда или кликните для выбора</p>
        </div>
        {files.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-400">
              Выбранные файлы: {files.map(file => file.name).join(", ")}
            </p>
          </div>
        )}
      </div>

      <Button className="mb-6" onClick={handleUpload} disabled={loading}>
        {loading ? "Обработка..." : "Загрузить и Анализировать"}
      </Button>


      {rfmData && rfmData.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Графики RFM</h2>

          {/* Гистограммы RFM */}
          <CustomCard>
            <CustomCardContent>
              <h3 className="text-lg font-semibold">Гистограммы RFM</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Гистограмма Recency */}
                <div>
                  <h4 className="text-md font-medium mb-2">Recency</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={rfmData}>
                      <XAxis dataKey="CustomerID" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="Recency" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Гистограмма Frequency */}
                <div>
                  <h4 className="text-md font-medium mb-2">Frequency</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={rfmData}>
                      <XAxis dataKey="CustomerID" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="Frequency" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Гистограмма Monetary */}
                <div>
                  <h4 className="text-md font-medium mb-2">Monetary</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={rfmData}>
                      <XAxis dataKey="CustomerID" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="Monetary" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CustomCardContent>
          </CustomCard>

          {/* RFM-матрица (Тепловая карта) */}
          <CustomCard className="mt-4">
            <CustomCardContent>
              <h3 className="text-lg font-semibold">RFM-Матрица</h3>
              <div className="h-96">
                <ResponsiveHeatMap
                  data={heatmapData}
                  keys={["Recency", "Frequency", "Monetary"]}
                  indexBy="CustomerID"
                  margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
                  valueFormat=">-.2s"
                  axisTop={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -90,
                    legend: "",
                    legendOffset: 46,
                    truncateTickAt: 0,
                  }}
                  axisRight={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "country",
                    legendPosition: "middle",
                    legendOffset: 70,
                    truncateTickAt: 0,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "country",
                    legendPosition: "middle",
                    legendOffset: -72,
                    truncateTickAt: 0,
                  }}
                  colors={{
                    type: "diverging",
                    scheme: "red_yellow_blue",
                    divergeAt: 0.5,
                    minValue: -100000,
                    maxValue: 100000,
                  }}
                  emptyColor="#555555"
                  legends={[
                    {
                      anchor: "bottom",
                      translateX: 0,
                      translateY: 30,
                      length: 400,
                      thickness: 8,
                      direction: "row",
                      tickPosition: "after",
                      tickSize: 3,
                      tickSpacing: 4,
                      tickOverlap: false,
                      tickFormat: ">-.2s",
                      title: "Value →",
                      titleAlign: "start",
                      titleOffset: 4,
                    },
                  ]}
                />
              </div>
            </CustomCardContent>
          </CustomCard>

          {/* Кластеры клиентов (ScatterChart) */}
          <CustomCard className="mt-4">
            <CustomCardContent>
              <h3 className="text-lg font-semibold">Кластеры клиентов</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <XAxis type="number" dataKey="Recency" name="Recency" />
                  <YAxis type="number" dataKey="Monetary" name="Monetary" />
                  <ZAxis type="number" dataKey="Frequency" name="Frequency" range={[100, 400]} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={rfmData} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CustomCardContent>
          </CustomCard>
        </div>
      )}
    </div>
  );
}
