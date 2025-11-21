import React, { useState, useEffect, useRef, useCallback } from "react";
import { Edit, Trash2, UserPlus, Search, X } from "lucide-react";
import InputField from "../../../Components/InputField";
import axios from "axios";
import AddUserModal from "./AddUserModal";
import { useSelector, useDispatch } from "react-redux";
import { logout as logoutAction } from "./../../../Redux/user/userSlice";
import { useNavigate } from "react-router-dom";

const API_URL =
  "https://kidschool.futurekidfoundation.org/auth/api/ngo/get/getSchoolNoticeQuerys";
const DELETE_URL_BASE =
  "https://kidschool.futurekidfoundation.org/auth/api/ngo/delete/deleteSchoolNotice";
const CHUNK_SIZE = 5;

const NoticeBoard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const reduxToken = useSelector((state) => state.user.token);

  const [users, setUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const observerTarget = useRef(null);
  const filteredUsersRef = useRef([]);
  const displayedUsersRef = useRef([]);

  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
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

  const fetchUsers = useCallback(async () => {
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

      if (res?.data?.status === "Success" && Array.isArray(res.data.data)) {
        const getAllUsers = res.data.data.map((p) => ({
          ...p,
          // ensure createdDate is yyyy-mm-dd for easier filtering
          createdDate: p.created_at ? p.created_at.slice(0, 10) : null,
        }));
        setUsers(getAllUsers);

        // initialize filtered/displayed helpers
        filteredUsersRef.current = getAllUsers;
        displayedUsersRef.current = getAllUsers.slice(0, CHUNK_SIZE);
        setFilteredUsers(getAllUsers);
        setDisplayedUsers(getAllUsers.slice(0, CHUNK_SIZE));
        setHasMore(getAllUsers.length > CHUNK_SIZE);
      } else {
        setError("API returned unexpected data.");
        setUsers([]);
        setFilteredUsers([]);
        setDisplayedUsers([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      handleAuthError(err);
      setError(err?.response?.data?.message || err.message || "Network error");
      setUsers([]);
      setFilteredUsers([]);
      setDisplayedUsers([]);
      setHasMore(false);
    } finally {
      setIsFetching(false);
    }
  }, [dispatch, navigate, reduxToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    let filtered = users.slice();

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const title = String(p.title || "").toLowerCase();
        return title.includes(q);
      });
    }

    if (dateFilter) {
      filtered = filtered.filter((user) => user.createdDate === dateFilter);
    }

    filteredUsersRef.current = filtered;
    displayedUsersRef.current = filtered.slice(0, CHUNK_SIZE);

    setFilteredUsers(filtered);
    setDisplayedUsers(filtered.slice(0, CHUNK_SIZE));
    setHasMore(filtered.length > CHUNK_SIZE);
  }, [users, searchTerm, dateFilter]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    setTimeout(() => {
      const currentLen = displayedUsersRef.current.length;
      const nextChunk = filteredUsersRef.current.slice(
        currentLen,
        currentLen + CHUNK_SIZE
      );
      if (nextChunk.length > 0) {
        const updated = [...displayedUsersRef.current, ...nextChunk];
        displayedUsersRef.current = updated;
        setDisplayedUsers(updated);
        setHasMore(updated.length < filteredUsersRef.current.length);
      } else {
        setHasMore(false);
      }
      setIsLoading(false);
    }, 350);
  }, [isLoading, hasMore]);

  useEffect(() => {
    const scrollContainer = document.querySelector(".user-scroll-container");
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

  const handleDeleteUser = async (userId) => {
    if (!userId) return;
    const confirmed = window.confirm(
      "Are you sure you want to DELETE this user? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeletingId(userId);

      setDisplayedUsers((prev) => prev.filter((u) => u.id !== userId));
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setFilteredUsers((prev) => prev.filter((u) => u.id !== userId));
      displayedUsersRef.current = displayedUsersRef.current.filter(
        (u) => u.id !== userId
      );
      filteredUsersRef.current = filteredUsersRef.current.filter(
        (u) => u.id !== userId
      );

      const url = `${DELETE_URL_BASE}/${userId}`;
      const res = await axios.delete(url, { timeout: 15000 });

      if (res?.data?.status === "Success") {
        setHasMore(
          displayedUsersRef.current.length < filteredUsersRef.current.length
        );
      } else {
        throw new Error(res?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      await fetchUsers();
      alert(
        err?.response?.data?.message || err.message || "Failed to delete user"
      );
    } finally {
      setDeletingId(null);
    }
  };

  console.log(isFetching);
  console.log(error);

  return (
    <>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">All Users</h3>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <UserPlus size={20} />
              Add Notice
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <InputField
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {hasActiveFilters && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <X size={18} />
                  Reset
                </button>
              )}

              <span className="text-sm text-gray-600 ml-auto">
                Showing {displayedUsers.length} of {filteredUsers.length} users
              </span>
            </div>
          </div>
        </div>

        {showAddUserModal && (
          <AddUserModal
            onClose={() => setShowAddUserModal(false)}
            onUserAdded={() => {
              setShowAddUserModal(false);
              fetchUsers();
            }}
          />
        )}

        {/* Table */}
        <div
          className="overflow-x-auto user-scroll-container"
          style={{ maxHeight: "450px", overflowY: "auto" }}
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
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {displayedUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{user.title}</span>
                    </div>
                  </td>

                  {/* <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {user.description}
                  </td> */}

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {(user.created_at || "").slice(0, 10)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        className="p-1 text-red-600 hover:bg-red-50 rounded flex items-center justify-center"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deletingId === user.id}
                        title="Delete user"
                      >
                        {deletingId === user.id ? (
                          <svg
                            className="animate-spin h-4 w-4 text-red-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
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
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          )}

          {/* Intersection observer target */}
          <div ref={observerTarget} className="h-4 bg-transparent" />

          {/* End of results message */}
          {!hasMore && displayedUsers.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No more users to load
            </div>
          )}

          {/* No results message */}
          {displayedUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching your filters
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NoticeBoard;
