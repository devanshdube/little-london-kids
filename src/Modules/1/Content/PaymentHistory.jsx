import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Edit, Trash2, UserPlus, Search, X } from "lucide-react";
import InputField from "../../../Components/InputField";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout as logoutAction } from "./../../../Redux/user/userSlice";

const API_URL =
  "https://ngo-admin.doaguru.com/auth/api/ngo/get/getPaymentTransactions";
const CHUNK_SIZE = 5;

const PaymentHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const reduxToken = useSelector((state) => state.user.token);
  const [allPayments, setAllPayments] = useState([]);
  const [displayedPayments, setDisplayedPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
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

  const fetchPayments = useCallback(async () => {
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
        const payments = res.data.data.map((p) => ({
          ...p,
          createdDate: p.created_at ? p.created_at.slice(0, 10) : null,
        }));
        setAllPayments(payments);
      } else {
        setError("API returned unexpected data.");
        setAllPayments([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      handleAuthError(err);
      setError(err?.response?.data?.message || err.message || "Network error");
      setAllPayments([]);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Apply filters whenever data or filter inputs change
  useEffect(() => {
    // start from allPayments
    let filtered = allPayments.slice();

    // search: name, phone, amount
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const name = String(p.name || "").toLowerCase();
        const phone = String(p.phone || "").toLowerCase();
        const amount = String(p.amount || "").toLowerCase();
        return name.includes(q) || phone.includes(q) || amount.includes(q);
      });
    }

    // payment method filter (exact match)
    if (methodFilter) {
      filtered = filtered.filter((p) => p.paymentMethod === methodFilter);
    }

    // date filter (createdDate is yyyy-mm-dd)
    if (dateFilter) {
      filtered = filtered.filter((p) => p.createdDate === dateFilter);
    }

    filteredRef.current = filtered;
    displayedRef.current = filtered.slice(0, CHUNK_SIZE);

    setFilteredPayments(filtered);
    setDisplayedPayments(filtered.slice(0, CHUNK_SIZE));
    setHasMore(filtered.length > CHUNK_SIZE);
  }, [allPayments, searchTerm, methodFilter, dateFilter]);

  // Load more data (append next chunk)
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
        setDisplayedPayments(updated);
        setHasMore(updated.length < filteredRef.current.length);
      } else {
        setHasMore(false);
      }
      setIsLoading(false);
    }, 350); // small debounce to mimic loading
  }, [isLoading, hasMore]);

  // Intersection observer for infinite scroll
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
    };
  }, [hasMore, isLoading, loadMore]);

  const handleReset = () => {
    setSearchTerm("");
    setMethodFilter("");
    setDateFilter("");
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              All Transactions
            </h3>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchPayments()}
                disabled={isFetching}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                {isFetching ? "Refreshing..." : "Refresh"}
              </button>

              {/* <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <UserPlus size={20} />
                Add
              </button> */}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <InputField
                placeholder="Search by name, phone or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Methods</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Net Banking">Net Banking</option>
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {(searchTerm || methodFilter || dateFilter) && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <X size={18} />
                  Reset
                </button>
              )}

              <span className="text-sm text-gray-600 ml-auto">
                Showing {displayedPayments.length} of {filteredPayments.length}
              </span>
            </div>
          </div>
        </div>

        {/* Table container */}
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
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bank / Branch
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  PAN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Receipt
                </th>
                {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th> */}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {displayedPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                        {p.name ? p.name[0] : "U"}
                      </div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          {p.remarks || ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {p.phone}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    ₹{Number(p.amount).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {p.paymentMethod}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {p.bankName ? (
                      <div>
                        <div>{p.bankName}</div>
                        <div className="text-xs text-gray-500">
                          {p.branchName}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">—</div>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {p.panNo || "—"}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {p.createdDate || (p.created_at || "").slice(0, 10)}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {p.screenshot ? (
                      <a
                        href={p.screenshot}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2"
                      >
                        <img
                          src={p.screenshot}
                          alt="receipt"
                          className="w-14 h-10 object-cover rounded border"
                        />
                        <span className="text-xs text-blue-600">View</span>
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No</span>
                    )}
                  </td>

                  {/* <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>

          {/* loading spinner */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          )}

          {/* intersection observer target */}
          <div ref={observerTarget} className="h-4 bg-transparent" />

          {/* end message */}
          {!hasMore && displayedPayments.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No more transactions to load
            </div>
          )}

          {/* no results */}
          {displayedPayments.length === 0 && !isFetching && (
            <div className="text-center py-8 text-gray-500">
              No transactions found
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

export default PaymentHistory;
