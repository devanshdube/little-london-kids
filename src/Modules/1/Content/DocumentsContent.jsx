import React from "react";
import { FileText, Plus, Download } from "lucide-react";

const DocumentsContent = () => {
  return (
    <>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">My Documents</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Plus size={20} />
            New Document
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "Project Report.pdf",
                size: "2.4 MB",
                date: "12 Oct 2025",
              },
              {
                name: "Presentation.pptx",
                size: "5.1 MB",
                date: "10 Oct 2025",
              },
              {
                name: "Budget Sheet.xlsx",
                size: "890 KB",
                date: "08 Oct 2025",
              },
              {
                name: "Meeting Notes.docx",
                size: "1.2 MB",
                date: "05 Oct 2025",
              },
              {
                name: "Design Mockups.fig",
                size: "12 MB",
                date: "03 Oct 2025",
              },
              {
                name: "Client Contract.pdf",
                size: "650 KB",
                date: "01 Oct 2025",
              },
            ].map((doc, i) => (
              <div
                key={i}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <FileText className="text-purple-600" size={32} />
                  <button className="text-gray-400 hover:text-gray-600">
                    <Download size={18} />
                  </button>
                </div>
                <h4 className="font-medium text-gray-800 mb-1">{doc.name}</h4>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{doc.size}</span>
                  <span>{doc.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentsContent;
