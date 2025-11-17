// ContactUsHistory.jsx (replace PaymentHistory)
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Search, X } from "lucide-react";
import InputField from "../../../Components/InputField";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout as logoutAction } from "./../../../Redux/user/userSlice";

const API_URL = "https://ngo-admin.doaguru.com/auth/api/ngo/get/getAllQuerys";
const CHUNK_SIZE = 8;

const ContactUsHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const reduxToken = useSelector((state) => state.user.token);

  const [allQueries, setAllQueries] = useState([]);
  const [displayed, setDisplayed] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  const observerTarget = useRef(null);
  const filteredRef = useRef([]);
  const displayedRef = useRef([]);

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

  const fetchQueries = useCallback(async () => {
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

      // Expecting something like: { status: "Success", data: [ {id,name,email,phone,subject,message,created_at}, ... ] }
      if (res?.data?.status === "Success" && Array.isArray(res.data.data)) {
        const queries = res.data.data.map((q) => ({
          ...q,
          createdDate: q.created_at ? q.created_at.slice(0, 10) : null,
        }));
        setAllQueries(queries);
        // init refs & displayed chunk
        filteredRef.current = queries;
        displayedRef.current = queries.slice(0, CHUNK_SIZE);
        setFiltered(queries);
        setDisplayed(queries.slice(0, CHUNK_SIZE));
        setHasMore(queries.length > CHUNK_SIZE);
      } else {
        // accept other shapes such as res.data.queries or res.data.data === undefined
        const alt = Array.isArray(res?.data?.queries)
          ? res.data.queries
          : Array.isArray(res?.data?.querys)
          ? res.data.querys
          : null;
        if (Array.isArray(alt)) {
          const queries = alt.map((q) => ({
            ...q,
            createdDate: q.created_at ? q.created_at.slice(0, 10) : null,
          }));
          setAllQueries(queries);
          filteredRef.current = queries;
          displayedRef.current = queries.slice(0, CHUNK_SIZE);
          setFiltered(queries);
          setDisplayed(queries.slice(0, CHUNK_SIZE));
          setHasMore(queries.length > CHUNK_SIZE);
        } else {
          setError("API returned unexpected data.");
          setAllQueries([]);
          setFiltered([]);
          setDisplayed([]);
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      handleAuthError(err);
      setError(err?.response?.data?.message || err.message || "Network error");
      setAllQueries([]);
      setFiltered([]);
      setDisplayed([]);
      setHasMore(false);
    } finally {
      setIsFetching(false);
    }
  }, [dispatch, navigate, reduxToken]);

  useEffect(() => {
    fetchQueries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Apply search & date filters
  useEffect(() => {
    let list = allQueries.slice();

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((item) => {
        const name = String(item.name || "").toLowerCase();
        const phone = String(item.phone || "").toLowerCase();
        const email = String(item.email || "").toLowerCase();
        const subject = String(item.subject || "").toLowerCase();
        const message = String(item.message || "").toLowerCase();
        return (
          name.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          subject.includes(q) ||
          message.includes(q)
        );
      });
    }

    if (dateFilter) {
      list = list.filter((item) => item.createdDate === dateFilter);
    }

    filteredRef.current = list;
    displayedRef.current = list.slice(0, CHUNK_SIZE);

    setFiltered(list);
    setDisplayed(list.slice(0, CHUNK_SIZE));
    setHasMore(list.length > CHUNK_SIZE);
  }, [allQueries, searchTerm, dateFilter]);

  // Load more chunk
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
        setDisplayed(updated);
        setHasMore(updated.length < filteredRef.current.length);
      } else {
        setHasMore(false);
      }
      setIsLoading(false);
    }, 300);
  }, [isLoading, hasMore]);

  // Intersection observer
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

  return (
    <>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Contact Us History
            </h3>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchQueries()}
                disabled={isFetching}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                {isFetching ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4">
            <div className="relative">
              <InputField
                placeholder="Search by name, phone, email, subject or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {(searchTerm || dateFilter) && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <X size={18} />
                  Reset
                </button>
              )}

              <span className="text-sm text-gray-600 ml-auto">
                Showing {displayed.length} of {filtered.length}
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div
          className="overflow-x-auto user-scroll-container"
          style={{ maxHeight: "520px", overflowY: "auto" }}
        >
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {displayed.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm">
                        {q.name ? q.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {q.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {q.id ? `#${q.id}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {q.phone}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {q.email}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    {q.subject || "—"}
                  </td>

                  <td className="px-4 py-3 whitespace-normal text-sm text-gray-700 max-w-[30ch]">
                    <div className="text-sm truncate" title={q.message}>
                      {q.message}
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {q.createdDate || (q.created_at || "").slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* loading */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          )}

          {/* observer target */}
          <div ref={observerTarget} className="h-4 bg-transparent" />

          {/* end message */}
          {!hasMore && displayed.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No more queries to load
            </div>
          )}

          {/* no results */}
          {displayed.length === 0 && !isFetching && (
            <div className="text-center py-8 text-gray-500">
              No queries found
            </div>
          )}

          {/* error */}
          {error && (
            <div className="text-center py-4 text-red-600">{error}</div>
          )}
        </div>
      </div>
    </>
  );
};

export default ContactUsHistory;
