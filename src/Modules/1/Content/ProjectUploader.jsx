import React, { useState } from "react";
import axios from "axios";

const POST_PROJECT_URL = "http://localhost:5555/auth/api/ngo/post/postProject";
const POST_PROJECT_DETAILS_URL =
  "http://localhost:5555/auth/api/ngo/post/postProjectDetails";

export default function ProjectUploader() {
  // Form 1 - project
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Form 2 - details
  const [projectId, setProjectId] = useState(null);
  const [projectDescription, setProjectDescription] = useState("");

  // UI state
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // File constraints
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB (matches backend limits)
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];

  const resetMessages = () => {
    setMessage(null);
    setError(null);
  };

  // handle file selection & preview
  const handleFileChange = (e) => {
    resetMessages();
    const f = e.target.files && e.target.files[0];
    if (!f) {
      setFile(null);
      setFilePreview(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Only JPG/PNG/PDF files are allowed.");
      e.target.value = null;
      return;
    }

    if (f.size > MAX_FILE_SIZE) {
      setError("File size must be less than 2 MB.");
      e.target.value = null;
      return;
    }

    setFile(f);

    // show preview for images, otherwise show filename for PDFs
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setFilePreview({ type: "image", url });
    } else {
      setFilePreview({ type: "file", name: f.name });
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const submitProject = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    try {
      setIsSubmittingProject(true);

      const fd = new FormData();
      fd.append("title", title.trim());
      if (file) fd.append("file_name", file);

      const res = await axios.post(POST_PROJECT_URL, fd, {
        timeout: 30000,
      });

      if (res?.data?.status === "Success" || res?.status === 201) {
        const insertedId = res?.data?.insertedId || res?.data?.data?.id || null;
        setMessage("Project created successfully.");
        setProjectId(insertedId);
        setTitle("");
        setFile(null);
        setFilePreview(null);
      } else {
        const errMsg =
          res?.data?.error ||
          res?.data?.message ||
          "Unexpected response from server.";
        setError(String(errMsg));
      }
    } catch (err) {
      console.error("submitProject error:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Network or server error";
      setError(String(msg));
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const submitProjectDetails = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!projectId) {
      setError("Project ID is missing. Create a project first.");
      return;
    }
    if (!projectDescription.trim()) {
      setError("Project description is required.");
      return;
    }

    try {
      setIsSubmittingDetails(true);
      const url = `${POST_PROJECT_DETAILS_URL}/${projectId}`;
      const res = await axios.post(
        url,
        { project_description: projectDescription.trim() },
        { timeout: 20000 }
      );

      if (res?.data?.status === "Success" || res?.status === 201) {
        setMessage("Project details saved successfully.");
        setProjectDescription("");
        setProjectId(null);
      } else {
        const errMsg =
          res?.data?.error ||
          res?.data?.message ||
          "Unexpected response from server.";
        setError(String(errMsg));
      }
    } catch (err) {
      console.error("submitProjectDetails error:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Network or server error";
      setError(String(msg));
    } finally {
      setIsSubmittingDetails(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Create Project</h2>
        <p className="text-sm text-gray-500 mb-4">
          Add a project title and optional file (image/pdf). File limit: 2MB.
        </p>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-3 rounded bg-green-50 text-green-800 border border-green-100">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-800 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={submitProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                resetMessages();
              }}
              placeholder="Enter project title"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File (optional)
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                key={file ? file.name : "file-input"} // allow re-select same file by using key trick
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="block w-full sm:w-auto text-sm text-gray-600"
              />

              {filePreview && (
                <div className="flex items-center gap-3">
                  {filePreview.type === "image" ? (
                    <img
                      src={filePreview.url}
                      alt="preview"
                      className="w-28 h-20 object-cover rounded border"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded border text-sm">
                      {filePreview.name}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={removeFile}
                    // className="text-sm text-red-600 hover:underline"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-400 text-white rounded hover:bg-red-500"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Allowed: JPG, PNG, PDF. Max 2MB.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmittingProject}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-60"
            >
              {isSubmittingProject ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setTitle("");
                setFile(null);
                setFilePreview(null);
                resetMessages();
              }}
              className="px-3 py-2 border rounded text-sm"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Project Details - show when we have a projectId returned */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h3 className="text-md font-semibold mb-2">Add Project Details</h3>
        <p className="text-sm text-gray-500 mb-3">
          After creating a project you'll get an ID. Enter description and
          submit.
        </p>

        <div className="mb-3">
          <label className="block text-sm text-gray-700 mb-1">Project ID</label>
          <input
            type="text"
            value={projectId ?? ""}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Project ID (will be filled automatically)"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <form onSubmit={submitProjectDetails} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => {
                setProjectDescription(e.target.value);
                resetMessages();
              }}
              rows={5}
              placeholder="Write detailed description..."
              className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmittingDetails}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
            >
              {isSubmittingDetails ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Details"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setProjectDescription("");
                resetMessages();
              }}
              className="px-3 py-2 border rounded text-sm"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Helpful tips */}
      <div className="mt-4 text-xs text-gray-500">
        <p>
          Tip: If server returns insertedId in response it will appear in
          Project ID field automatically.
        </p>
      </div>
    </div>
  );
}
