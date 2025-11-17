// Content/DashboardContent.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Users, BarChart3, FileText, ImageIcon } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout as logoutAction } from "./../../../Redux/user/userSlice";

const API_USERS = "https://ngo-admin.doaguru.com/auth/api/ngo/get/getAllUser";
const API_PAYMENTS =
  "https://ngo-admin.doaguru.com/auth/api/ngo/get/getPaymentTransactions";
const API_PROJECTS =
  "https://ngo-admin.doaguru.com/auth/api/ngo/get/getAllProjects";
const API_GALLERY =
  "https://ngo-admin.doaguru.com/auth/api/ngo/get/getGalleryImages";
const API_ADMINS = "https://ngo-admin.doaguru.com/auth/api/ngo/get/getAllAdmin";

function useKolkataDate() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);
  const optsDate = {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  };
  const optsTime = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: "Asia/Kolkata",
  };
  const optsHour = { hour: "2-digit", hour12: false, timeZone: "Asia/Kolkata" };
  const dateStr = new Intl.DateTimeFormat("en-GB", optsDate).format(now);
  const timeStr = new Intl.DateTimeFormat("en-US", optsTime).format(now);
  const hourStr = new Intl.DateTimeFormat("en-GB", optsHour).format(now);
  const hour = Number(hourStr);
  return { dateStr, timeStr, hour };
}

export default function DashboardContent() {
  const { dateStr, timeStr, hour } = useKolkataDate();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Prefer token from Redux (persisted), fallback to localStorage
  const reduxToken = useSelector((state) => state.user.token);
  const currentUser = useSelector((state) => state.user.currentUser);

  const greeting = useMemo(() => {
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Hello";
  }, [hour]);

  const displayName = currentUser?.name ?? "User";

  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    users: null,
    payments: null,
    projects: null,
    gallery: null,
  });
  const [errors, setErrors] = useState({
    users: null,
    payments: null,
    projects: null,
    gallery: null,
  });

  // admins state
  const [admins, setAdmins] = useState([]);
  const [adminsError, setAdminsError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // decide token: redux first, then localStorage
    const token = reduxToken || localStorage.getItem("token");

    // if no token, force sign-in
    if (!token) {
      try {
        dispatch(logoutAction());
      } catch (e) {
        console.log(e);
      }
      localStorage.removeItem("token");
      navigate("/signin", { replace: true });
      return () => {};
    }

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    const handleAuthError = (err) => {
      const status = err?.response?.status;
      if (status === 401) {
        // session expired or invalid token
        try {
          dispatch(logoutAction());
        } catch (e) {
          console.log(e);
        }
        localStorage.removeItem("token");
        navigate("/signin", { replace: true });
      }
    };

    // fetch all required endpoints (including admins)
    const calls = [
      axios
        .get(API_USERS, authHeader)
        .then((r) => ({ key: "users", ok: true, res: r }))
        .catch((e) => {
          handleAuthError(e);
          return { key: "users", ok: false, err: e };
        }),

      axios
        .get(API_PAYMENTS, authHeader)
        .then((r) => ({ key: "payments", ok: true, res: r }))
        .catch((e) => {
          handleAuthError(e);
          return { key: "payments", ok: false, err: e };
        }),

      axios
        .get(API_PROJECTS, authHeader)
        .then((r) => ({ key: "projects", ok: true, res: r }))
        .catch((e) => {
          handleAuthError(e);
          return { key: "projects", ok: false, err: e };
        }),

      axios
        .get(API_GALLERY, authHeader)
        .then((r) => ({ key: "gallery", ok: true, res: r }))
        .catch((e) => {
          handleAuthError(e);
          return { key: "gallery", ok: false, err: e };
        }),

      // NEW: admins
      axios
        .get(API_ADMINS, authHeader)
        .then((r) => ({ key: "admins", ok: true, res: r }))
        .catch((e) => {
          handleAuthError(e);
          return { key: "admins", ok: false, err: e };
        }),
    ];

    Promise.all(calls)
      .then((results) => {
        if (!isMounted) return;

        const nextCounts = {
          users: null,
          payments: null,
          projects: null,
          gallery: null,
        };
        const nextErrors = {
          users: null,
          payments: null,
          projects: null,
          gallery: null,
        };

        let nextAdmins = [];
        let nextAdminsError = null;

        results.forEach((r) => {
          if (!r) return;
          const k = r.key;
          if (!r.ok) {
            const msg =
              r.err?.response?.data?.message || r.err?.message || "Failed";
            if (k === "admins") {
              nextAdminsError = msg;
            } else {
              nextErrors[k] = msg;
              nextCounts[k] = null;
            }
            return;
          }

          const data = r.res?.data;
          if (k === "users") {
            const arr = Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.users)
              ? data.users
              : null;
            nextCounts.users = Array.isArray(arr)
              ? arr.length
              : typeof data?.count === "number"
              ? data.count
              : null;
            if (nextCounts.users === null)
              nextErrors.users = "Unexpected response";
          } else if (k === "payments") {
            const arrP = Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.payments)
              ? data.payments
              : null;
            nextCounts.payments = Array.isArray(arrP)
              ? arrP.length
              : typeof data?.count === "number"
              ? data.count
              : null;
            if (nextCounts.payments === null)
              nextErrors.payments = "No payments API";
          } else if (k === "projects") {
            const arrPr = Array.isArray(data?.projects)
              ? data.projects
              : Array.isArray(data?.data)
              ? data.data
              : null;
            nextCounts.projects = Array.isArray(arrPr)
              ? arrPr.length
              : typeof data?.count === "number"
              ? data.count
              : null;
            if (nextCounts.projects === null)
              nextErrors.projects = "Unexpected response";
          } else if (k === "gallery") {
            const arrG = Array.isArray(data?.images)
              ? data.images
              : Array.isArray(data?.data)
              ? data.data
              : null;
            nextCounts.gallery = Array.isArray(arrG)
              ? arrG.length
              : typeof data?.count === "number"
              ? data.count
              : null;
            if (nextCounts.gallery === null)
              nextErrors.gallery = "Unexpected response";
          } else if (k === "admins") {
            // expecting { status: "Success", data: [...] } or similar
            const arrA = Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.admins)
              ? data.admins
              : null;
            if (Array.isArray(arrA)) {
              nextAdmins = arrA;
            } else if (typeof data?.count === "number" && data?.count === 0) {
              nextAdmins = [];
            } else {
              nextAdminsError = "Unexpected admins response";
            }
          }
        });

        setCounts(nextCounts);
        setErrors(nextErrors);
        setAdmins(nextAdmins);
        setAdminsError(nextAdminsError);
      })
      .catch((e) => {
        console.error("Fetch dashboard data error:", e);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reduxToken, dispatch, navigate]);

  const StatCard = ({
    title,
    value,
    icon,
    colorClass = "bg-blue-100 text-blue-600",
    hint,
    onView,
  }) => (
    <div className="bg-white rounded-lg shadow p-5 flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            {value ?? (loading ? "…" : "—")}
          </p>
        </div>
        <div
          className={`w-12 h-12 ${colorClass
            .split(" ")
            .slice(0, 2)
            .join(" ")} rounded-lg flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">{hint}</div>
        <div>
          {onView && (
            <button
              onClick={onView}
              className="px-3 py-1 bg-indigo-600 text-white rounded text-xs"
            >
              View
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const to = (subpath) => {
    if (subpath === "" || subpath === "/") return navigate("/admin");
    return navigate(`/admin/${subpath}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">Welcome back</div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              {greeting}, <span className="text-indigo-600">{displayName}</span>
            </h1>
            <div className="text-sm text-gray-500">
              • {timeStr} (Asia/Kolkata)
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-1">{dateStr}</div>
        </div>

        <div className="flex gap-3 items-center">
          <div className="text-xs text-gray-500 text-right">
            <div>Quick overview</div>
            <div className="text-sm font-medium text-gray-800">
              {counts.users ?? "—"} users
            </div>
          </div>
          <div>
            <button
              onClick={() => to("")}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Users"
          value={counts.users}
          icon={<Users size={20} />}
          colorClass="bg-blue-100 text-blue-600"
          hint={
            errors.users ? `Error: ${errors.users}` : "Total registered users"
          }
          onView={() => to("users")}
        />
        <StatCard
          title="Payments"
          value={counts.payments}
          icon={<BarChart3 size={20} />}
          colorClass="bg-green-100 text-green-600"
          hint={
            errors.payments
              ? `Error: ${errors.payments}`
              : "Total recorded payments"
          }
          onView={() => to("payment")}
        />
        <StatCard
          title="Projects"
          value={counts.projects}
          icon={<FileText size={20} />}
          colorClass="bg-purple-100 text-purple-600"
          hint={
            errors.projects
              ? `Error: ${errors.projects}`
              : "Active projects & entries"
          }
          onView={() => to("project-list")}
        />
        <StatCard
          title="Gallery"
          value={counts.gallery}
          icon={<ImageIcon size={20} />}
          colorClass="bg-rose-100 text-rose-600"
          hint={errors.gallery ? `Error: ${errors.gallery}` : "Uploaded images"}
          onView={() => to("gallery")}
        />
      </div>

      {/* All Admins (replaces Recent Activity) */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">All Admins</h3>
          <div className="text-sm text-gray-500">{admins.length} admins</div>
        </div>

        {loading && admins.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : adminsError ? (
          <div className="text-sm text-red-600">{adminsError}</div>
        ) : admins.length === 0 ? (
          <div className="text-sm text-gray-500">No admins found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {admins.map((a) => (
              <div
                key={a.id || a.email}
                className="p-3 bg-gray-50 rounded flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
                  {a.name ? a.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">
                        {a.name || a.fullname || "Admin"}
                      </div>
                      <div className="text-xs text-gray-500">{a.email}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {a.designation || "Admin"}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                    {a.mobile && <div>📞 {a.mobile}</div>}
                    {a.status && (
                      <div
                        className={
                          String(a.status).toLowerCase() === "active"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {a.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
