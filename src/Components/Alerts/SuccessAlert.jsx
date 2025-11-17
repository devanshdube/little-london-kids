import { CheckCircle } from "lucide-react";
import BaseAlert from "./BaseAlert";

const SuccessAlert = ({ message, onClose }) => {
  const config = {
    icon: CheckCircle,
    primary: "#10b981",
    secondary: "#34d399",
    shadow: "rgba(16, 185, 129, 0.4)",
    gradient: "linear-gradient(135deg, #10b981, #34d399)",
  };
  return <BaseAlert config={config} message={message} onClose={onClose} />;
};

export default SuccessAlert;
