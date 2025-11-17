import React, { useEffect, useState } from "react";
import {
  Home,
  Users,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  IndianRupee,
  CreditCard,
  Folder,
  ClipboardList,
  Images,
  Phone,
  GraduationCap,
  Handshake,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../Redux/user/userSlice";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardContent from "./Content/DashboardContent";
import UsersContent from "./Content/UsersContent";
import PaymentContent from "./Content/PaymentContent";
import PaymentHistory from "./Content/PaymentHistory";
import ProjectUploader from "./Content/ProjectUploader";
import ProjectsContent from "./Content/ProjectsContent";
import GalleryUploader from "./Content/GalleryUploader";
import ContactUsHistory from "./Content/ContactUsHistory";
import AdmissionHistory from "./Content/AdmissionHistory";
import FranchiseHistory from "./Content/FranchiseHistory";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const sub = parts[1] ?? "";
    if (!sub || sub === "") {
      setActiveMenu("dashboard");
    } else {
      setActiveMenu(sub);
    }
  }, [location.pathname]);

  const menuItems = [
    { id: "Contact-History", label: "Contact-History", icon: Phone },
    {
      id: "Admission-History",
      label: "Admission-History",
      icon: GraduationCap,
    },
    { id: "gallery", label: "Gallery", icon: Images },
    { id: "Franchise", label: "Franchise", icon: Handshake },
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "users", label: "Users", icon: Users },
    { id: "payment", label: "Payment", icon: IndianRupee },
    { id: "payment-history", label: "Payment History", icon: CreditCard },
    { id: "project", label: "Create Project", icon: Folder },
    { id: "project-list", label: "Project List", icon: ClipboardList },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case "Contact-History":
        return <ContactUsHistory />;
      case "Admission-History":
        return <AdmissionHistory />;
      case "gallery":
        return <GalleryUploader />;
      case "Franchise":
        return <FranchiseHistory />;
      case "dashboard":
        return <DashboardContent />;
      case "users":
        return <UsersContent />;
      case "payment":
        return <PaymentContent />;
      case "payment-history":
        return <PaymentHistory />;
      case "project":
        return <ProjectUploader />;
      case "project-list":
        return <ProjectsContent />;
      default:
        return <DashboardContent />;
    }
  };

  const currentUser = useSelector((state) => state.user.currentUser);

  const handleLogout = () => {
    setIsLoggingOut(true);

    setTimeout(() => {
      dispatch(logout());
      localStorage.removeItem("token");
      navigate("/signin");
    }, 1200);
  };

  const onMenuClick = (id) => {
    setActiveMenu(id);
    const path = id === "dashboard" ? "/admin" : `/admin/${id}`;
    if (location.pathname !== path) navigate(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-[#0e1726] to-[#0e1726] text-white transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Sidebar Header */}
        <div
          className="p-4 flex items-center justify-between border-b"
          style={{ borderColor: "#0e1726" }}
        >
          {sidebarOpen && <h1 className="text-xl font-bold">Dashboard</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-[#0e1726] transition-colors"
          >
            {sidebarOpen ? (
              <ChevronsLeft size={24} />
            ) : (
              <ChevronsRight size={24} />
            )}
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onMenuClick(item.id)}
                    className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all ${
                      activeMenu === item.id
                        ? "bg-[#805dca] shadow-lg"
                        : "hover:bg-[#1b2e4b]"
                    }`}
                  >
                    <Icon size={24} />
                    {sidebarOpen && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-[#805dca]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#805dca] flex items-center justify-center font-bold">
              {currentUser?.name?.charAt(0) || "U"}
            </div>
            {sidebarOpen && (
              <div>
                <p className="font-medium text-sm">
                  {currentUser?.name || "User"}
                </p>
                <p className="text-xs text-[#4361ee]">{currentUser?.email}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-md transition"
          >
            <ShieldCheck size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div
            className="bg-[#0e1726] p-6 rounded-2xl shadow-xl w-full max-w-sm text-white 
      border border-[#805dca]/40 animate-slideUp"
          >
            <h2 className="text-xl font-semibold mb-2">Are you sure?</h2>
            <p className="text-gray-400 mb-6">
              Do you really want to logout from your account?
            </p>

            <div className="flex justify-end gap-3">
              {/* Cancel */}
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg bg-[#1b2e4b] hover:bg-[#263d63] transition"
              >
                Cancel
              </button>

              {/* Logout + Loading */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`px-4 py-2 rounded-lg transition 
          ${
            isLoggingOut
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-[#805dca] hover:bg-[#6c49b4]"
          }`}
              >
                {isLoggingOut ? "Logging out..." : "Yes, Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm p-4">
          <div className="flex items-center justify-between">
            <h2 className="hidden sm:block text-2xl font-bold text-gray-800 capitalize">
              {activeMenu}
            </h2>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
}
