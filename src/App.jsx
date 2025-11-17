// App.jsx
import { Navigate, Route, Routes } from "react-router-dom";
import { Suspense } from "react";
import { useSelector } from "react-redux";
import Dashboard from "./Modules/1/Dashboard";
import SignIn from "./Modules/Auth/SignIn";
import EmployeeDashboard from "./Modules/2/EmployeeDashboard";
import ForgotPassword from "./Modules/Auth/ForgotPassword";

function App() {
  const { currentUser } = useSelector((state) => state.user);

  const role = currentUser?.designation?.toLowerCase(); // ✅ matches your backend field

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route
          path="/"
          element={
            !currentUser ? (
              <SignIn />
            ) : role === "admin" ? (
              <Dashboard />
            ) : role === "employee" ? (
              <EmployeeDashboard />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            !currentUser ? (
              <ForgotPassword />
            ) : role === "admin" ? (
              <Dashboard />
            ) : role === "employee" ? (
              <EmployeeDashboard />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        {role === "admin" && <Route path="/admin/*" element={<Dashboard />} />}
        {role === "employee" && (
          <Route path="/employee/*" element={<EmployeeDashboard />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;

{
  /* <Dashboard /> */
}
{
  /* <SignIn /> */
}
