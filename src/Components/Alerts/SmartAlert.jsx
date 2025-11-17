// components/Alerts/SmartAlert.jsx
import React from "react";
import SuccessAlert from "./SuccessAlert";
import ErrorAlert from "./ErrorAlert";
import WarningAlert from "./WarningAlert";
import PendingAlert from "./PendingAlert";
import OfflineAlert from "./OfflineAlert";

/**
 * SmartAlert automatically chooses which alert component to render
 * based on alert.type and positions it at the top-right of the screen.
 */
const SmartAlert = ({ alert, onClose }) => {
  if (!alert || !alert.message) return null;

  const alertStyle = `
    fixed 
    top-5 right-5 
    z-[9999] 
    flex flex-col gap-3
    items-end
  `;

  const renderAlert = () => {
    switch (alert.type) {
      case "success":
        return <SuccessAlert message={alert.message} onClose={onClose} />;
      case "error":
        return <ErrorAlert message={alert.message} onClose={onClose} />;
      case "warning":
        return <WarningAlert message={alert.message} onClose={onClose} />;
      case "pending":
        return <PendingAlert message={alert.message} onClose={onClose} />;
      case "offline":
        return <OfflineAlert message={alert.message} onClose={onClose} />;
      default:
        return <WarningAlert message={alert.message} onClose={onClose} />;
    }
  };

  return <div className={alertStyle}>{renderAlert()}</div>;
};

export default SmartAlert;

// import React from "react";
// import SuccessAlert from "./SuccessAlert";
// import ErrorAlert from "./ErrorAlert";
// import WarningAlert from "./WarningAlert";
// import PendingAlert from "./PendingAlert";
// import OfflineAlert from "./OfflineAlert";

// const SmartAlert = ({ alert, onClose }) => {
//   if (!alert || !alert.message) return null;

//   switch (alert.type) {
//     case "success":
//       return <SuccessAlert message={alert.message} onClose={onClose} />;
//     case "error":
//       return <ErrorAlert message={alert.message} onClose={onClose} />;
//     case "warning":
//       return <WarningAlert message={alert.message} onClose={onClose} />;
//     case "pending":
//       return <PendingAlert message={alert.message} onClose={onClose} />;
//     case "offline":
//       return <OfflineAlert message={alert.message} onClose={onClose} />;
//     default:
//       return <WarningAlert message={alert.message} onClose={onClose} />;
//   }
// };

// export default SmartAlert;
