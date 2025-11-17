import { XCircle } from "lucide-react";
import BaseAlert from "./BaseAlert";

const ErrorAlert = ({ message, onClose }) => {
  const config = {
    icon: XCircle,
    primary: "#ef4444",
    secondary: "#f87171",
    shadow: "rgba(239,68,68,0.4)",
    gradient: "linear-gradient(135deg, #ef4444, #f87171)",
  };
  return <BaseAlert config={config} message={message} onClose={onClose} />;
};

export default ErrorAlert;
