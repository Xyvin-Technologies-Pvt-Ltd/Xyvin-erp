import { useEffect, useState } from "react";
import { testConnection } from "../api/authService";
import { toast } from "react-hot-toast";

const TestConnection = () => {
  const [status, setStatus] = useState("Testing connection...");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await testConnection();
        setStatus("Connected: " + result.message);
        toast.success("Backend connection successful!");
      } catch (error) {
        setStatus("Connection failed");
        toast.error(
          "Backend connection failed. Please check the console for details."
        );
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-sm font-medium text-gray-900">API Status</h3>
      <p
        className={`text-sm ${
          status.includes("Connected") ? "text-green-600" : "text-red-600"
        }`}
      >
        {status}
      </p>
    </div>
  );
};

export default TestConnection;
