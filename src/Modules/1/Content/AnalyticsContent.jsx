import React from "react";
import { Users, BarChart3, TrendingUp, Download } from "lucide-react";

const AnalyticsContent = () => {
  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="mx-auto text-blue-600 mb-2" size={32} />
            <p className="text-2xl font-bold text-gray-800">85%</p>
            <p className="text-sm text-gray-600">Growth Rate</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <BarChart3 className="mx-auto text-green-600 mb-2" size={32} />
            <p className="text-2xl font-bold text-gray-800">1.2M</p>
            <p className="text-sm text-gray-600">Page Views</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Users className="mx-auto text-purple-600 mb-2" size={32} />
            <p className="text-2xl font-bold text-gray-800">15K</p>
            <p className="text-sm text-gray-600">Active Users</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Download className="mx-auto text-orange-600 mb-2" size={32} />
            <p className="text-2xl font-bold text-gray-800">450</p>
            <p className="text-sm text-gray-600">Downloads</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Report</h3>
        <div className="space-y-3">
          {["January", "February", "March", "April"].map((month, i) => (
            <div
              key={month}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <span className="font-medium">{month}</span>
              <div className="flex items-center gap-4">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(i + 1) * 20}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold">{(i + 1) * 20}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AnalyticsContent;
