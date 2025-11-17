import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Eye, Edit, Trash2 } from "lucide-react";
import InputField from "../../../Components/InputField";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout as logoutAction } from "./../../../Redux/user/userSlice";

const API_URL = "https://ngo-admin.doaguru.com/auth/api/ngo/get/getAllProjects";
const DELETE_PROJECT_URL_BASE =
  "https://ngo-admin.doaguru.com/auth/api/ngo/delete/deleteProject";
const CHUNK_SIZE = 5;

const ProjectsContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const reduxToken = useSelector((state) => state.user.token);
  // data state
  const [projects, setProjects] = useState([]);
  const [displayedProjects, setDisplayedProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);

  // filters / UI
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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

  // modal for viewing project details
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeProject, setActiveProject] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRefs = useRef(new Map());

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

  // fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setIsFetching(true);
      setError(null);

      const token = getToken();
      if (!token) {
        // no token -> redirect to signin
        dispatch(logoutAction());
        localStorage.removeItem("token");
        navigate("/signin", { replace: true });
        return;
      }

      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      const res = await axios.get(API_URL, { ...authHeader, timeout: 15000 });
      // expecting { status: "Success", count, projects: [...] }
      if (res?.data?.status === "Success" && Array.isArray(res.data.projects)) {
        // map projects to ensure fields we use exist & create createdDate (yyyy-mm-dd)
        const mapped = res.data.projects.map((p) => ({
          ...p,
          createdDate: p.created_at ? p.created_at.slice(0, 10) : null,
          updatedDate: p.updated_at ? p.updated_at.slice(0, 10) : null,
          details: Array.isArray(p.details) ? p.details : [],
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
        // combine all detail descriptions
        const detailsText = proj.details
          .map((d) => String(d.project_description || ""))
          .join(" ")
          .toLowerCase();
        return title.includes(q) || detailsText.includes(q);
      });
    }

    if (statusFilter) {
      // keep projects that have at least one detail with this status
      const sf = statusFilter;
      filtered = filtered.filter((proj) =>
        proj.details.some((d) => String(d.status || "") === sf)
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((proj) => proj.createdDate === dateFilter);
    }

    filteredRef.current = filtered;
    displayedRef.current = filtered.slice(0, CHUNK_SIZE);

    setFilteredProjects(filtered);
    setDisplayedProjects(filtered.slice(0, CHUNK_SIZE));
    setHasMore(filtered.length > CHUNK_SIZE);
  }, [projects, searchTerm, statusFilter, dateFilter]);

  // load more chunk
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
    setStatusFilter("");
    setDateFilter("");
  };

  const hasActiveFilters = searchTerm || statusFilter || dateFilter;

  // open details modal
  const openDetails = (proj) => {
    setActiveProject(proj);
    setShowDetailModal(true);
  };

  useEffect(() => {
    const onDocClick = (e) => {
      // if click is outside any open menu, close it
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
      "Are you sure you want to DELETE this project and all its details? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeletingId(projectId);

      // call backend delete
      const url = `${DELETE_PROJECT_URL_BASE}/${projectId}`;
      const res = await axios.delete(url, { timeout: 20000 });

      if (res?.data?.status !== "Success") {
        throw new Error(res?.data?.message || "Delete failed on server");
      }

      // Remove project from UI lists (immutable updates)
      setProjects((prev) => prev.filter((p) => p.project_id !== projectId));
      setFilteredProjects((prev) =>
        prev.filter((p) => p.project_id !== projectId)
      );
      setDisplayedProjects((prev) =>
        prev.filter((p) => p.project_id !== projectId)
      );

      // If activeProject modal is opened for this project, close it
      if (activeProject && activeProject.project_id === projectId) {
        setShowDetailModal(false);
        setActiveProject(null);
      }

      // Also update refs used for infinite scroll
      filteredRef.current = filteredRef.current.filter(
        (p) => p.project_id !== projectId
      );
      displayedRef.current = displayedRef.current.filter(
        (p) => p.project_id !== projectId
      );

      // adjust hasMore
      setHasMore(displayedRef.current.length < filteredRef.current.length);

      // optional toast
      // alert("Project deleted successfully");
    } catch (err) {
      console.error("Delete project error:", err);
      alert(
        err?.response?.data?.message ||
          err.message ||
          "Failed to delete project"
      );
      // optionally refetch to re-sync
      // await fetchProjects();
    } finally {
      setDeletingId(null);
    }
  };

  // add near other handlers in the component scope
  const handleDeleteDetail = async (detailId, projectId) => {
    if (!detailId) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this project detail?"
    );
    if (!confirmed) return;

    try {
      // optimistic UI: remove from activeProject immediately for snappy UX
      setActiveProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          details: prev.details.filter((d) => d.detail_id !== detailId),
        };
      });

      // also update main lists so table reflects change
      setProjects((prev) =>
        prev.map((p) =>
          p.project_id === projectId
            ? {
                ...p,
                details: p.details.filter((d) => d.detail_id !== detailId),
              }
            : p
        )
      );

      setDisplayedProjects((prev) =>
        prev.map((p) =>
          p.project_id === projectId
            ? {
                ...p,
                details: p.details.filter((d) => d.detail_id !== detailId),
              }
            : p
        )
      );

      setFilteredProjects((prev) =>
        prev.map((p) =>
          p.project_id === projectId
            ? {
                ...p,
                details: p.details.filter((d) => d.detail_id !== detailId),
              }
            : p
        )
      );

      // call backend
      const url = `https://ngo-admin.doaguru.com/auth/api/ngo/delete/deleteProjectDetail/${detailId}`;
      const res = await axios.delete(url, { timeout: 15000 });

      if (!(res?.data?.status === "Success")) {
        // backend didn't return success — revert by refetching projects
        await fetchProjects();
        alert(res?.data?.message || "Delete failed on server");
      } else {
        // success — optional toast
        // console.log("Detail deleted");
      }
    } catch (err) {
      console.error("Delete detail error:", err);
      // revert by refetching server data to be safe
      await fetchProjects();
      alert(
        err?.response?.data?.message || err.message || "Failed to delete detail"
      );
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">All Projects</h3>
            {/* <div className="text-sm text-gray-600">
              Source: <span className="font-mono">/get/getAllProjects</span>
            </div> */}
          </div>

          {/* Search & Filters */}
          <div className="space-y-4">
            <div className="relative">
              <InputField
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="Approve">Approve</option>
                <option value="Not Approve">Not Approve</option>
              </select>

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
                projects
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
                  Project ID
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
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Updated
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Approved
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {displayedProjects.map((proj) => {
                // const approvedCount = proj.details.filter((d) => d.status === "Approve").length;
                const detailsCount = proj.details.length;
                return (
                  <tr key={proj.project_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-center whitespace-nowrap max-w-xs">
                      <div className="text-sm font-medium text-gray-900">
                        {proj.project_id}
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
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {proj.updatedDate || "-"}
                    </td> */}

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                        {detailsCount}
                      </span>
                    </td>

                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-sm">
                        {approvedCount}
                      </span>
                    </td> */}

                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetails(proj)}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          title="View details"
                        >
                          <Eye size={16} /> View
                        </button>
                      </div>
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap relative">
                      <div className="flex items-center gap-2">
                        {/* Trigger button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === proj.project_id
                                ? null
                                : proj.project_id
                            );
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none"
                          aria-expanded={openMenuId === proj.project_id}
                          aria-haspopup="menu"
                          title="Actions"
                        >
                          Actions
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06-.02L10 10.585l3.71-3.396a.75.75 0 111.02 1.1l-4.25 3.892a.75.75 0 01-1.02 0L5.25 8.29a.75.75 0 01-.02-1.08z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>

                        {/* Dropdown menu */}
                        {openMenuId === proj.project_id && (
                          <div
                            ref={(el) => {
                              if (el) menuRefs.current.set(proj.project_id, el);
                              else menuRefs.current.delete(proj.project_id);
                            }}
                            className="absolute right-2 top-full mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50"
                            role="menu"
                            aria-label="Project actions"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                openDetails(proj);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              role="menuitem"
                            >
                              <Eye size={14} /> View
                            </button>

                            {/* <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              role="menuitem"
                            >
                              <Edit size={14} /> Edit
                            </button> */}

                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                // call handler
                                await handleDeleteProject(proj.project_id);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                              role="menuitem"
                              disabled={deletingId === proj.project_id}
                            >
                              {deletingId === proj.project_id ? (
                                <svg
                                  className="animate-spin h-4 w-4 text-red-600"
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
                          </div>
                        )}
                      </div>
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
              No more projects to load
            </div>
          )}

          {!isFetching && displayedProjects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No projects found matching your filters
            </div>
          )}

          {isFetching && (
            <div className="text-center py-8 text-gray-500">
              Loading projects...
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-red-700 bg-red-50 m-4 rounded">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Simple Details Modal */}
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
                  {/* <div className="text-sm text-gray-600">
                    Updated: {activeProject.updatedDate || "-"}
                  </div> */}
                  <div className="text-sm text-gray-600 mt-2">
                    Details: {activeProject.details.length}
                  </div>
                  {/* <div className="text-sm text-emerald-700 mt-1">
                    Approved:{" "}
                    {
                      activeProject.details.filter(
                        (d) => d.status === "Approve"
                      ).length
                    }
                  </div> */}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Project Details</h5>
                {activeProject.details.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No details available for this project.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {activeProject.details.map((d) => (
                      <li key={d.detail_id} className="p-3 border rounded">
                        {/* Description */}
                        <div className="text-sm text-gray-800 mb-3">
                          {d.project_description}
                        </div>

                        {/* Bottom row: status • date • delete button (right aligned) */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            {/* <span
                              className={`px-2 py-0.5 rounded-full font-medium ${
                                d.status === "Approve"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {d.status}
                            </span> */}
                            {/* Delete button */}
                            <div>
                              <button
                                onClick={() =>
                                  handleDeleteDetail(
                                    d.detail_id,
                                    activeProject.project_id
                                  )
                                }
                                className="inline-flex items-center gap-2 px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                                title="Delete detail"
                              >
                                <svg
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M3 6h18v2H3V6zm2 3h14l-1 11H6L5 9zm3-6h6l1 2H7l1-2z" />
                                </svg>
                                Delete
                              </button>
                            </div>

                            <span className="text-gray-400 font-medium">•</span>

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

export default ProjectsContent;
