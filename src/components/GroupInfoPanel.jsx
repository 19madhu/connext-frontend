import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { X, Trash2, Camera } from "lucide-react";

const GroupInfoPanel = ({ onClose }) => {
  const { selectedGroup, setSelectedGroup, getGroups } = useChatStore();
  const { authUser } = useAuthStore();
  const [groupDetails, setGroupDetails] = useState(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const isAdmin = groupDetails?.admin?._id === authUser._id;
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // ✅ Fetch group details and eligible users
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const res = await axiosInstance.get(`/groups/${selectedGroup._id}`);
        setGroupDetails(res.data);
      } catch (error) {
        toast.error("Failed to load group details");
      }
    };

    const fetchEligibleUsers = async () => {
      try {
        if (showAddUserModal && selectedGroup) {
          const res = await axiosInstance.get(`/groups/${selectedGroup._id}/eligible-users`);
          setEligibleUsers(res.data);
        }
      } catch (error) {
        toast.error("Failed to fetch eligible users");
      }
    };

    if (selectedGroup) {
      fetchGroupDetails();
      if (showAddUserModal) {
        fetchEligibleUsers();
      }
    }
  }, [selectedGroup, showAddUserModal]);

  // 🟢 Corrected Exit Group Logic
  const handleExitGroup = async () => {
    try {
      await axiosInstance.delete(`/groups/${selectedGroup._id}/exit`); // 🟢 FIXED METHOD (DELETE)
      toast.success("Exited group successfully!");
      await getGroups(); // Refresh groups list
      setSelectedGroup(null); // Clear selection
      onClose();
    } catch (error) {
      toast.error("Failed to exit group");
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await axiosInstance.put(`/groups/${selectedGroup._id}/remove-member`, { memberId });
      toast.success("Member removed successfully!");
      const res = await axiosInstance.get(`/groups/${selectedGroup._id}`);
      setGroupDetails(res.data);
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        await axiosInstance.put(`/groups/${selectedGroup._id}/change-image`, { groupImage: reader.result });
        toast.success("Group image updated!");
        const res = await axiosInstance.get(`/groups/${selectedGroup._id}`);
        setGroupDetails(res.data);
      } catch (error) {
        toast.error("Failed to update group image");
      }
    };
  };

  const handleRemoveImage = async () => {
    try {
      await axiosInstance.put(`/groups/${selectedGroup._id}/remove-image`);
      toast.success("Group image removed!");
      const res = await axiosInstance.get(`/groups/${selectedGroup._id}`);
      setGroupDetails(res.data);
    } catch (error) {
      toast.error("Failed to remove group image");
    }
  };

  if (!groupDetails) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-base-100 p-6 rounded-xl w-80 relative">
        <button onClick={onClose} className="absolute top-2 right-2">
          <X />
        </button>

        {/* Group Image and Edit */}
        <div className="flex justify-center relative mb-4">
          <img
            src={groupDetails.groupImage || "/avatar.png"}
            alt="Group"
            className="w-24 h-24 rounded-full object-cover border"
          />
          <button
            onClick={() => setShowImageOptions((prev) => !prev)}
            className="absolute bottom-0 right-0 btn btn-xs btn-primary"
          >
            <Camera className="w-4 h-4" />
          </button>
          {showImageOptions && (
            <div className="absolute top-28 right-0 bg-base-200 border rounded shadow-md p-2 z-50">
              {groupDetails.groupImage ? (
                <>
                  <button onClick={handleRemoveImage} className="block w-full text-left hover:bg-base-300 px-2 py-1">
                    Remove Profile Photo
                  </button>
                  <label className="block w-full text-left hover:bg-base-300 px-2 py-1 cursor-pointer">
                    Change Profile Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      className="hidden"
                    />
                  </label>
                </>
              ) : (
                <label className="block w-full text-left hover:bg-base-300 px-2 py-1 cursor-pointer">
                  Upload Profile Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Group Title */}
        <h2 className="text-lg font-semibold text-center">{groupDetails.name}</h2>

        {/* Members Section */}
        <h3 className="text-sm text-zinc-500 mt-5 mb-2">Members</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          <div className="flex justify-between items-center">
            <div className="font-medium flex items-center gap-2">
              {groupDetails.admin.fullName}
              <span className="text-green-600 text-xs border border-green-600 px-1 rounded">Admin</span>
            </div>
          </div>
          {groupDetails.members
            .filter((m) => m._id !== groupDetails.admin._id)
            .map((member) => (
              <div key={member._id} className="flex justify-between items-center">
                <span>{member.fullName}</span>
                {isAdmin && (
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    className="btn btn-xs btn-error"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
        </div>

        {isAdmin && (
          <button
            className="btn btn-sm bg-green-500 text-white w-full mt-4 hover:bg-green-600"
            onClick={() => setShowAddUserModal(true)}
          >
            Add User
          </button>
        )}

        <button
          onClick={handleExitGroup}
          className="btn btn-sm btn-error w-full mt-5"
        >
          Exit Group
        </button>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Add Users to Group</h2>
              {eligibleUsers.length === 0 ? (
                <p className="text-gray-500">No eligible users available.</p>
              ) : (
                eligibleUsers.map((user) => (
                  <div key={user._id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user._id)}
                      onChange={() => {
                        if (selectedUserIds.includes(user._id)) {
                          setSelectedUserIds(selectedUserIds.filter((id) => id !== user._id));
                        } else {
                          setSelectedUserIds([...selectedUserIds, user._id]);
                        }
                      }}
                      className="mr-2"
                    />
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt="profile"
                      className="w-8 h-8 rounded-full object-cover mr-2"
                    />
                    <span>{user.fullName} ({user.email})</span>
                  </div>
                ))
              )}

              <div className="flex justify-between mt-6">
                <button
                  className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setSelectedUserIds([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                  onClick={async () => {
                    if (selectedUserIds.length === 0) {
                      toast.error("Please select at least one user.");
                      return;
                    }
                    try {
                      await axiosInstance.post(`/groups/${selectedGroup._id}/add-members`, {
                        userIds: selectedUserIds,
                      });
                      toast.success("Users added successfully!");
                      setShowAddUserModal(false);
                      setSelectedUserIds([]);
                      const res = await axiosInstance.get(`/groups/${selectedGroup._id}`);
                      setGroupDetails(res.data);
                    } catch (error) {
                      toast.error("Failed to add users to the group.");
                    }
                  }}
                >
                  Add to Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupInfoPanel;