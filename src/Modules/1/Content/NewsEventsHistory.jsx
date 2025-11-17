import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Eye, Edit, Trash2 } from "lucide-react";
import InputField from "../../../Components/InputField";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout as logoutAction } from "./../../../Redux/user/userSlice";

// ✅ API CHANGED – NEWS EVENTS
const API_URL =
  "http://localhost:5555/auth/api/ngo/get/getSchoolNewsEventsQuerys";
const DELETE_PROJECT_URL_BASE =
  "http://localhost:5555/auth/api/ngo/delete/deleteSchoolNewsEvents";

const CHUNK_SIZE = 5;

// ✅ COMPONENT NAME CHANGED
const NewsEventsContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const reduxToken = useSelector((state) => state.user.token);
  // data state
  const [projects, setProjects] = useState([]);
  const [displayedProjects, setDisplayedProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);

  // filters / UI
  const [searchTerm, setSearchTerm] = useState("");
  // const [statusFilter, setStatusFilter] = useState(""); // ❌ Removed
  const [dateFilter, setDateFilter] = useState("");

  // chunking / infinite scroll
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef(null);
  const filteredRef = useRef([]);
  const displayedRef = useRef([]);

  // fetching / error
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  // modal for viewing project details (not used for news, but left as-is)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeProject, setActiveProject] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRefs = useRef(new Map());

  const [deletingId, setDeletingId] = useState(null);

  const getToken = () => reduxToken || localStorage.getItem("token");

  const handleAuthError = (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try {
        dispatch(logoutAction());
      } catch (e) {
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

  // ✅ FETCH – now mapped according to school_news_events
  const fetchProjects = useCallback(async () => {
    try {
      setIsFetching(true);
      setError(null);

      const token = getToken();
      if (!token) {
        dispatch(logoutAction());
        localStorage.removeItem("token");
        navigate("/signin", { replace: true });
        return;
      }

      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      const res = await axios.get(API_URL, { ...authHeader, timeout: 15000 });

      // Backend: { status: "Success", data: [...] }
      if (res?.data?.status === "Success" && Array.isArray(res.data.data)) {
        const mapped = res.data.data.map((p) => ({
          ...p,
          project_id: p.id, // to reuse existing code paths
          createdDate: p.created_at ? p.created_at.slice(0, 10) : null,
          updatedDate: null,
          details: [], // news events have no details
        }));
        setProjects(mapped);
      } else {
        setError("API returned unexpected data.");
        setProjects([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      handleAuthError(err);
      setError(err?.response?.data?.message || err.message || "Network error");
      setProjects([]);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // apply filters and reset displayed chunk
  useEffect(() => {
    let filtered = projects.slice();

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((proj) => {
        const title = String(proj.title || "").toLowerCase();
        // details is empty array for news, so this part is harmless
        const detailsText = proj.details
          .map((d) => String(d.project_description || ""))
          .join(" ")
          .toLowerCase();
        return title.includes(q) || detailsText.includes(q);
      });
    }

    if (dateFilter) {
      filtered = filtered.filter((proj) => proj.createdDate === dateFilter);
    }

    filteredRef.current = filtered;
    displayedRef.current = filtered.slice(0, CHUNK_SIZE);

    setFilteredProjects(filtered);
    setDisplayedProjects(filtered.slice(0, CHUNK_SIZE));
    setHasMore(filtered.length > CHUNK_SIZE);
  }, [projects, searchTerm, dateFilter]);

  // load more chunk (infinite scroll)
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    setTimeout(() => {
      const currentLen = displayedRef.current.length;
      const nextChunk = filteredRef.current.slice(
        currentLen,
        currentLen + CHUNK_SIZE
      );
      if (nextChunk.length > 0) {
        const updated = [...displayedRef.current, ...nextChunk];
        displayedRef.current = updated;
        setDisplayedProjects(updated);
        setHasMore(updated.length < filteredRef.current.length);
      } else {
        setHasMore(false);
      }
      setIsLoading(false);
    }, 350);
  }, [isLoading, hasMore]);

  // infinite scroll observer
  useEffect(() => {
    const scrollContainer = document.querySelector(".project-scroll-container");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (hasMore && !isLoading) loadMore();
        }
      },
      { root: scrollContainer, rootMargin: "150px", threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMore]);

  const handleReset = () => {
    setSearchTerm("");
    setDateFilter("");
  };

  const hasActiveFilters = searchTerm || dateFilter;

  useEffect(() => {
    const onDocClick = (e) => {
      if (openMenuId == null) return;
      const ref = menuRefs.current.get(openMenuId);
      if (ref && ref.contains && !ref.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, [openMenuId]);

  const handleDeleteProject = async (projectId) => {
    if (!projectId) return;
    const confirmed = window.confirm(
      "Are you sure you want to DELETE this item? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeletingId(projectId);

      const url = `${DELETE_PROJECT_URL_BASE}/${projectId}`;
      const res = await axios.delete(url, { timeout: 20000 });

      if (res?.data?.status !== "Success") {
        throw new Error(res?.data?.message || "Delete failed on server");
      }

      setProjects((prev) => prev.filter((p) => p.project_id !== projectId));
      setFilteredProjects((prev) =>
        prev.filter((p) => p.project_id !== projectId)
      );
      setDisplayedProjects((prev) =>
        prev.filter((p) => p.project_id !== projectId)
      );

      if (activeProject && activeProject.project_id === projectId) {
        setShowDetailModal(false);
        setActiveProject(null);
      }

      filteredRef.current = filteredRef.current.filter(
        (p) => p.project_id !== projectId
      );
      displayedRef.current = displayedRef.current.filter(
        (p) => p.project_id !== projectId
      );

      setHasMore(displayedRef.current.length < filteredRef.current.length);
    } catch (err) {
      console.error("Delete project error:", err);
      alert(
        err?.response?.data?.message || err.message || "Failed to delete item"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">News & Events</h3>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4">
            <div className="relative">
              <InputField
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {/* ❌ Status filter removed */}

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {hasActiveFilters && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <X size={16} />
                  Reset
                </button>
              )}

              <span className="text-sm text-gray-600 ml-auto">
                Showing {displayedProjects.length} of {filteredProjects.length}{" "}
                items
              </span>
            </div>
          </div>
        </div>

        {/* Table container with scroll for IntersectionObserver */}
        <div
          className="overflow-x-auto project-scroll-container"
          style={{ maxHeight: "520px", overflowY: "auto" }}
        >
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Index
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                {/* ❌ Details column removed */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {displayedProjects.map((proj, index) => {
                return (
                  <tr key={proj.project_id} className="hover:bg-gray-50">
                    {/* ✅ Index instead of Project ID */}
                    <td className="px-6 py-4 text-center whitespace-nowrap max-w-xs">
                      <div className="text-sm font-medium text-gray-900">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap max-w-xs">
                      <div className="text-sm font-medium text-gray-900">
                        {proj.title}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {proj.file_name ? (
                        <img
                          src={proj.file_name}
                          alt={proj.title}
                          className="w-20 h-12 object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-image.png";
                          }}
                        />
                      ) : (
                        <div className="w-20 h-12 flex items-center justify-center bg-gray-100 text-gray-400 rounded">
                          No
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {proj.createdDate}
                    </td>

                    {/* ✅ Actions dropdown – only Delete */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteProject(proj.project_id)}
                        disabled={deletingId === proj.project_id}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        {deletingId === proj.project_id ? (
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="3"
                              className="opacity-25"
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
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Loading indicator (chunk load) */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* observer target */}
          <div ref={observerTarget} className="h-4 bg-transparent" />

          {/* messages */}
          {!hasMore && displayedProjects.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No more items to load
            </div>
          )}

          {!isFetching && displayedProjects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No items found matching your filters
            </div>
          )}

          {isFetching && (
            <div className="text-center py-8 text-gray-500">
              Loading items...
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-red-700 bg-red-50 m-4 rounded">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Details modal still present (not really used for News Events, but harmless) */}
      {/* Aap chaho to isko bhi delete kar sakte ho */}
      {showDetailModal && activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => setShowDetailModal(false)}
          />
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 z-10 overflow-auto max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="text-lg font-semibold">{activeProject.title}</h4>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-sm text-gray-600 px-3 py-1"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-4 items-start">
                {activeProject.file_name ? (
                  <img
                    src={activeProject.file_name}
                    alt={activeProject.title}
                    className="w-40 h-28 object-cover rounded border"
                  />
                ) : (
                  <div className="w-40 h-28 bg-gray-100 flex items-center justify-center rounded text-gray-400">
                    No Image
                  </div>
                )}

                <div>
                  <div className="text-sm text-gray-600">
                    Created: {activeProject.createdDate}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Details: {activeProject.details.length}
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Project Details</h5>
                {activeProject.details.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No details available for this item.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {activeProject.details.map((d) => (
                      <li key={d.detail_id} className="p-3 border rounded">
                        <div className="text-sm text-gray-800 mb-3">
                          {d.project_description}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                              {d.created_at?.slice(0, 10)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-100 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsEventsContent;
