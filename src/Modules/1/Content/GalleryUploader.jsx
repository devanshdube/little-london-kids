import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { UploadCloud, Trash2, X, ImageIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout as logoutAction } from "./../../../Redux/user/userSlice";

const API_UPLOAD =
  "https://ngo-admin.doaguru.com/auth/api/ngo/post/uploadGalleryImages";
const API_GET =
  "https://ngo-admin.doaguru.com/auth/api/ngo/get/getGalleryImages";
const API_DELETE =
  "https://ngo-admin.doaguru.com/auth/api/ngo/delete/deleteGalleryImage";

const MAX_FILES = 20;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function GalleryUploader() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const reduxToken = useSelector((state) => state.user.token);
  // uploader state
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // gallery state
  const [images, setImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [galleryError, setGalleryError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const getToken = () => reduxToken || localStorage.getItem("token");

  const handleAuthError = (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // token invalid/expired -> clear and redirect to signin
      try {
        dispatch(logoutAction());
      } catch (e) {
        /* ignore */
        console.log(e);
      }
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch (e) {
        console.log(e);
      }
      navigate("/signin", { replace: true });
    }
  };

  // cleanup object URLs on unmount
  useEffect(() => {
    return () =>
      files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
  }, [files]);

  // fetch gallery
  const fetchGallery = useCallback(async () => {
    try {
      setLoadingGallery(true);
      setGalleryError(null);

      const token = getToken();
      if (!token) {
        // no token -> redirect to signin
        dispatch(logoutAction());
        localStorage.removeItem("token");
        navigate("/signin", { replace: true });
        return;
      }

      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      const res = await axios.get(API_GET, { ...authHeader, timeout: 15000 });
      if (res?.data?.status === "Success") {
        setImages(Array.isArray(res.data.images) ? res.data.images : []);
      } else {
        setGalleryError(res?.data?.message || "Failed to fetch gallery");
        setImages([]);
      }
    } catch (err) {
      console.error("Fetch gallery error:", err);
      handleAuthError(err);
      setGalleryError(err?.message || "Network error");
      setImages([]);
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // file selection
  const onFilesSelected = (selectedFiles) => {
    setError(null);
    const incoming = Array.from(selectedFiles);
    if (files.length + incoming.length > MAX_FILES) {
      setError(`You can upload up to ${MAX_FILES} images. Remove some first.`);
      return;
    }

    const processed = incoming.map((file) => {
      let fileError = null;
      if (!file.type.startsWith("image/")) fileError = "Only images allowed";
      else if (file.size > MAX_FILE_SIZE)
        fileError = "File too large (max 2MB)";
      return {
        file,
        previewUrl: fileError ? null : URL.createObjectURL(file),
        error: fileError,
      };
    });

    setFiles((prev) => [...prev, ...processed]);
  };

  // drag/drop
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) onFilesSelected(e.dataTransfer.files);
  };

  const removeFileAt = (idx) => {
    setFiles((prev) => {
      const toRemove = prev[idx];
      if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
      const next = prev.slice();
      next.splice(idx, 1);
      return next;
    });
  };

  const clearAll = () => {
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setError(null);
  };

  // upload
  const handleUpload = async () => {
    setError(null);
    const validFiles = files.filter((f) => !f.error).map((f) => f.file);
    if (validFiles.length === 0) {
      setError("No valid images to upload.");
      return;
    }

    const form = new FormData();
    validFiles.forEach((f) => form.append("file_name", f));

    try {
      setUploading(true);
      setProgress(0);
      const res = await axios.post(API_UPLOAD, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
        },
      });

      if (res?.data?.status === "Success") {
        // cleared uploaded previews
        files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
        setFiles([]);
        // refresh gallery
        await fetchGallery();
      } else {
        setError(res?.data?.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err?.response?.data?.message || err.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // delete gallery image
  const handleDeleteImage = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this image permanently?");
    if (!confirmed) return;

    try {
      if (deletingId) return;
      setDeletingId(id);
      const res = await axios.delete(`${API_DELETE}/${id}`, { timeout: 15000 });
      if (res?.data?.status === "Success") {
        // update UI
        setImages((prev) => prev.filter((it) => it.id !== id));
      } else {
        alert(res?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete gallery image error:", err);
      alert(err?.response?.data?.message || err.message || "Delete failed");
      // optionally refresh
      // await fetchGallery();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Uploader */}
      <div
        className={`border-2 rounded-lg p-5 transition-colors ${
          isDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-dashed border-gray-300 bg-white"
        }`}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded">
                <UploadCloud className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Upload Gallery Images
                </h3>
                <p className="text-sm text-gray-500">
                  Drag & drop images or{" "}
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="text-indigo-600 underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Max {MAX_FILES} files • Max size 2 MB / file • Images only
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onFilesSelected(e.target.files)}
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="px-3 py-2 bg-indigo-600 text-white rounded"
              disabled={uploading}
            >
              Select
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-2 bg-gray-100 rounded"
              disabled={uploading || files.length === 0}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-4">
          {files.length === 0 ? (
            <div className="text-sm text-gray-500">No images selected</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className="relative border rounded overflow-hidden bg-gray-50"
                >
                  {f.previewUrl ? (
                    <img
                      src={f.previewUrl}
                      alt={f.file.name}
                      className="w-full h-28 object-cover"
                    />
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center text-sm text-gray-500 p-2">
                      {f.error || f.file.name}
                    </div>
                  )}
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button
                      onClick={() => removeFileAt(idx)}
                      className="bg-white p-1 rounded shadow text-red-600"
                      type="button"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="p-2 text-xs">
                    <div className="truncate">{f.file.name}</div>
                    <div className="text-gray-400 text-[11px]">
                      {(f.file.size / 1024).toFixed(0)} KB
                    </div>
                    {f.error && (
                      <div className="text-red-500 text-[11px] mt-1">
                        {f.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading || files.filter((f) => !f.error).length === 0}
            className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-60"
          >
            {uploading ? `Uploading ${progress}%` : "Upload"}
          </button>
          <div className="flex-1">
            {uploading && (
              <div className="h-2 bg-gray-100 rounded overflow-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full bg-emerald-500 transition-all"
                />
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {files.filter((f) => !f.error).length} / {MAX_FILES} selected
          </div>
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </div>

      {/* Gallery viewer */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Gallery</h3>
          <div className="text-sm text-gray-500">
            {loadingGallery ? "Loading..." : `${images.length} images`}
          </div>
        </div>

        {galleryError && (
          <div className="text-sm text-red-600 mb-4">{galleryError}</div>
        )}

        {!loadingGallery && images.length === 0 && (
          <div className="text-sm text-gray-500">No images uploaded yet.</div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {images.map((it) => (
            <div
              key={it.id}
              className="relative border rounded overflow-hidden bg-gray-50"
            >
              <img
                src={it.file_name}
                alt={it.file_name}
                className="w-full h-28 object-cover"
              />
              <div className="p-2 text-xs">
                <div className="truncate">{it.file_name.split("/").pop()}</div>
                <div className="text-gray-400 text-[11px]">
                  {it.created_at?.slice(0, 10)}
                </div>
              </div>

              <div className="absolute top-1 right-1 flex gap-1">
                <a
                  href={it.file_name}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white p-1 rounded shadow text-indigo-600"
                  title="Open"
                >
                  <ImageIcon size={14} />
                </a>
                <button
                  onClick={() => handleDeleteImage(it.id)}
                  disabled={deletingId === it.id}
                  className="bg-white p-1 rounded shadow text-red-600"
                  title="Delete"
                >
                  {deletingId === it.id ? (
                    <svg
                      className="animate-spin h-4 w-4 text-red-600"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      ></circle>
                      <path
                        d="M4 12a8 8 0 018-8v8z"
                        fill="currentColor"
                        className="opacity-75"
                      ></path>
                    </svg>
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={fetchGallery}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
