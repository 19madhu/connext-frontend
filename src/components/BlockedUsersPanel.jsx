import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";

const BlockedUsersPanel = ({ onClose }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const { getUsers } = useChatStore();

  const fetchBlockedUsers = async () => {
    try {
      const res = await axiosInstance.get("/users/blocked");
      setBlockedUsers(res.data);
    } catch (error) {
      console.error("Failed to load blocked users:", error);
      toast.error("Failed to fetch blocked users.");
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await axiosInstance.post(`/users/unblock/${userId}`);
      toast.success("User unblocked successfully!");
      fetchBlockedUsers();  // Refresh blocked list
      getUsers();           // Refresh contact list after unblocking
    } catch (error) {
      console.error("Failed to unblock user:", error);
      toast.error("Failed to unblock user.");
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
      <div className="bg-base-100 w-80 h-full p-4 shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Blocked Users</h2>
          <button onClick={onClose} className="btn btn-sm btn-circle">
            <X />
          </button>
        </div>

        {blockedUsers.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center mt-10">No blocked users found.</p>
        ) : (
          <div className="space-y-3 overflow-y-auto">
            {blockedUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span>{user.fullName}</span>
                </div>
                <button
                  className="btn btn-xs btn-success"
                  onClick={() => handleUnblock(user._id)}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedUsersPanel;