"use client";
import { useState } from "react";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun } from "docx";




export default function ZTestCalculator() {
  const [formData, setFormData] = useState({
    sample_mean: "",
    population_mean: "",
    population_std_dev: "",
    sample_size: "",
    significance_level: "",
    test_type: "two-tailed",
    approach: "p_value",
  });

  const downloadReport = async () => {
    if (!results) {
      alert("No results available to download.");
      return;
    }
  
    try {
      const children = [
        new Paragraph({
          text: "Z-Test Results",
          heading: HeadingLevel.TITLE,
          spacing: { after: 200 },
        }),
      ];
  
      // ✅ Fix: Ensure table renders properly
      if (results.table_data && results.table_data.length > 0) {
        children.push(new Paragraph({ text: "Provided Information:", heading: HeadingLevel.HEADING_2 }));
  
        children.push(
          new Table({
            width: { size: 100 }, // ✅ Make table width 100%
            rows: [
              // ✅ Table Header
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Parameter", bold: true })],
                    width: { size: 100},
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Value", bold: true })],
                    width: { size: 100 },
                  }),
                ],
              }),
  
              // ✅ Table Data Rows
              ...results.table_data.map((item) =>
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph(item?.Parameter?.toString() || `Row ${index + 1}`)],
                      width: { size: 100, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph(item?.Value?.toString() || "N/A")],
                      width: { size: 100, type: WidthType.PERCENTAGE },
                    }),
                  ],
                })
              ),
            ],
          })
        );
      }
  
      // ✅ Other Sections
      const sections = [
        { title: "Null & Alternative Hypothesis", text: results.null_alternative },
        { title: "Test Type", text: results.test_type },
        { title: "Rejection Region", text: results.rejection_region },
        { title: "Z-Statistic Computation", text: results.z_statistic_computation?.formula },
        { title: "Computation", text: results.z_statistic_computation?.computation },
        { title: "Decision", text: results.decision?.explanation },
        { title: "Conclusion", text: results.conclusion },
        { title: "Confidence Interval Formula", text: results.confidence_interval?.formula },
        { title: "Confidence Interval Computation", text: results.confidence_interval?.computation },
      ];
  
      sections.forEach((section) => {
        if (section.text) {
          children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2 }));
          children.push(new Paragraph(section.text));
        }
      });
  
      // If graph is available, add it
      if (results.graph_image) {
        const imageBuffer = Uint8Array.from(atob(results.graph_image), (c) => c.charCodeAt(0));
  
        children.push(
          new Paragraph({ text: "Graph:", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: { width: 500, height: 300 },
              }),
            ],
          })
        );
      }
  
      // ✅ Create and Save DOCX File
      const doc = new Document({
        sections: [{ properties: {}, children }],
      });
  
      const blob = await Packer.toBlob(doc);
      saveAs(blob, "Z-Test-Results.docx");
    } catch (error) {
      console.error("Error generating the document:", error);
      alert("An error occurred while generating the document.");
    }
  };

  const [results, setResults] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const response = await fetch("http://127.0.0.1:5000/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    setResults(data);
  };

  return (
    <div className={`h-screen flex items-center justify-center transition-all duration-500 text-black ${submitted ? "px-10" : ""}`}>
      {!submitted ? (
        /** Centered Form Before Submission */
        <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
          <h1 className="text-2xl font-bold mb-6 text-center">Z-Test Calculator</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Sample Mean</label>
              <input
                type="number"
                name="sample_mean"
                value={formData.sample_mean}
                onChange={handleChange}
                className="mt-1 p-2 w-full border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Population Mean</label>
              <input
                type="number"
                name="population_mean"
                value={formData.population_mean}
                onChange={handleChange}
                className="mt-1 p-2 w-full border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Population Standard Deviation</label>
              <input
                type="number"
                name="population_std_dev"
                value={formData.population_std_dev}
                onChange={handleChange}
                className="mt-1 p-2 w-full border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sample Size</label>
              <input
                type="number"
                name="sample_size"
                value={formData.sample_size}
                onChange={handleChange}
                className="mt-1 p-2 w-full border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Significance Level (alpha)</label>
              <input
                type="number"
                name="significance_level"
                value={formData.significance_level}
                onChange={handleChange}
                className="mt-1 p-2 w-full border rounded"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Alternative Hypothesis</label>
                <div className="flex space-x-4">
                  <label>
                    <input
                      type="radio"
                      name="test_type"
                      value="two-tailed"
                      checked={formData.test_type === "two-tailed"}
                      onChange={handleChange}
                    />
                    Two-Tailed
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="test_type"
                      value="left-tailed"
                      checked={formData.test_type === "left-tailed"}
                      onChange={handleChange}
                    />
                    Left-Tailed
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="test_type"
                      value="right-tailed"
                      checked={formData.test_type === "right-tailed"}
                      onChange={handleChange}
                    />
                    Right-Tailed
                  </label>
                </div>
              </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Approach</label>
                <div className="flex space-x-4">
                  <label>
                    <input
                      type="radio"
                      name="approach"
                      value="p_value"
                      checked={formData.approach === "p_value"}
                      onChange={handleChange}
                    />
                    P-Value
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="approach"
                      value="critical_value"
                      checked={formData.approach === "critical_value"}
                      onChange={handleChange}
                    />
                    Critical Value
                  </label>
                </div>
              </div>

            <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
              Calculate Z-Test
            </button>
          </form>
        </div>
      ) : (
        /** Two-Column Layout After Submission */
        <div className="flex w-full h-full text-black">
          {/* Left: Form */}
          <div className="w-1/2 p-8 bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-6 text-center">Z-Test Calculator</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sample Mean</label>
                <input
                  type="number"
                  name="sample_mean"
                  value={formData.sample_mean}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Population Mean</label>
                <input
                  type="number"
                  name="population_mean"
                  value={formData.population_mean}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Population Standard Deviation</label>
                <input
                  type="number"
                  name="population_std_dev"
                  value={formData.population_std_dev}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sample Size</label>
                <input
                  type="number"
                  name="sample_size"
                  value={formData.sample_size}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Significance Level (alpha)</label>
                <input
                  type="number"
                  name="significance_level"
                  value={formData.significance_level}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Alternative Hypothesis</label>
                <div className="flex space-x-4">
                  <label>
                    <input
                      type="radio"
                      name="test_type"
                      value="two-tailed"
                      checked={formData.test_type === "two-tailed"}
                      onChange={handleChange}
                    />
                    Two-Tailed
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="test_type"
                      value="left-tailed"
                      checked={formData.test_type === "left-tailed"}
                      onChange={handleChange}
                    />
                    Left-Tailed
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="test_type"
                      value="right-tailed"
                      checked={formData.test_type === "right-tailed"}
                      onChange={handleChange}
                    />
                    Right-Tailed
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Approach</label>
                <div className="flex space-x-4">
                  <label>
                    <input
                      type="radio"
                      name="approach"
                      value="p_value"
                      checked={formData.approach === "p_value"}
                      onChange={handleChange}
                    />
                    P-Value
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="approach"
                      value="critical_value"
                      checked={formData.approach === "critical_value"}
                      onChange={handleChange}
                    />
                    Critical Value
                  </label>
                </div>
              </div>

              <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
                Recalculate
              </button>
            </form>
          </div>

          {/* Right: Results */}
          <div className="w-1/2 p-8 bg-gray-50 shadow-lg rounded-lg overflow-auto">
            <h2 className="text-xl font-bold mb-4">Results</h2>
            {results && (
              <div className="text-black">
              <h2 className="text-xl font-bold mb-4">Provided Information</h2>
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Parameter</th>
                    <th className="px-4 py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {results.table_data.map((item) => (
                    <tr key={item.Parameter}>
                      <td className="px-4 py-2">{item.Parameter}</td>
                      <td className="px-4 py-2">{item.Value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
  
              <h2 className="text-xl font-bold my-4">Null & Alternative Hypothesis</h2>
              <p>{results.null_alternative}</p>
              <p>{results.test_type}</p>
  
              <h2 className="text-xl font-bold my-4">Rejection Region</h2>
              <p>{results.rejection_region}</p>
  
              <h2 className="text-xl font-bold my-4">Z-Statistic Computation</h2>
              <p>{results.z_statistic_computation.formula}</p>
              <p>{results.z_statistic_computation.computation}</p>
  
              <h2 className="text-xl font-bold my-4">Decision</h2>
              <p>{results.decision.explanation}</p>
  
              <h2 className="text-xl font-bold my-4">Conclusion</h2>
              <p>{results.conclusion}</p>
  
              <h2 className="text-xl font-bold my-4">Confidence Interval</h2>
              <p>{results.confidence_interval.formula}</p>
              <p>{results.confidence_interval.computation}</p>
  
              <h2 className="text-xl font-bold my-4">Graph</h2>
              <img src={`data:image/png;base64,${results.graph_image}`} alt="Z-Test Graph" />
              <button onClick={downloadReport} className="bg-green-500 text-white p-2 rounded mt-4">
            Download Report (DOCX)
            </button>
            </div>
            
            
            )}
          </div>
        </div>
      )}
    </div>
  );
}
