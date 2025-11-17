import React from "react";
import { Bell } from "lucide-react";

const NotificationsContent = () => {
  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Notifications</h3>
        </div>
        <div className="divide-y">
          {[
            {
              title: "New user registered",
              desc: "Priya Sharma just created an account",
              time: "5 min ago",
              unread: true,
            },
            {
              title: "Document uploaded",
              desc: "Project Report.pdf has been uploaded",
              time: "1 hour ago",
              unread: true,
            },
            {
              title: "Meeting reminder",
              desc: "Team meeting starts in 30 minutes",
              time: "2 hours ago",
              unread: true,
            },
            {
              title: "System update",
              desc: "System maintenance scheduled for tonight",
              time: "5 hours ago",
              unread: false,
            },
            {
              title: "New comment",
              desc: "Someone commented on your post",
              time: "1 day ago",
              unread: false,
            },
            {
              title: "Payment received",
              desc: "Payment of ₹5,000 received successfully",
              time: "2 days ago",
              unread: false,
            },
          ].map((notif, i) => (
            <div
              key={i}
              className={`p-4 flex items-start gap-4 ${
                notif.unread ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="text-purple-600" size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{notif.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{notif.desc}</p>
                    <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
                  </div>
                  {notif.unread && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default NotificationsContent;
