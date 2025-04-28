import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, MoreVertical } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import BlockedUsersPanel from "./BlockedUsersPanel";

const Sidebar = () => {
  const {
    getUsers,
    getGroups,
    selectedUser,
    selectedGroup,
    setSelectedUser,
    setSelectedGroup,
    isUsersLoading,
    clearSelectedUser,
    clearSelectedGroup,
    contacts,
    refreshVersion,               // 🟢 ADDED: pulling refreshVersion
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showBlockedUsersPanel, setShowBlockedUsersPanel] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, user: null });
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const contextMenuRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  // 🟢 Click outside handling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu({ visible: false, x: 0, y: 0, user: null });
      }
      if (showDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu.visible, showDropdown]);

  const contactIds = contacts.map((c) => c._id);
  const onlineContactCount = onlineUsers.filter((id) => contactIds.includes(id)).length;

  const filteredItems = showOnlineOnly
    ? contacts.filter((chat) => chat.type === "group" || chat.isOnline)
    : contacts;

  const handleBlockUser = async () => {
    try {
      await axiosInstance.post(`/users/block/${contextMenu.user._id}`);
      toast.success(`Blocked ${contextMenu.user.name} successfully!`);
      setContextMenu({ visible: false, x: 0, y: 0, user: null });
      setShowBlockConfirm(false);
      getUsers(); 
    } catch (error) {
      console.error("Failed to block user:", error);
      toast.error("Failed to block user.");
    }
  };

  const handleContextMenu = (e, user) => {
    e.preventDefault();
    setShowBlockConfirm(false);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      user,
    });
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 relative">
      <div className="border-b border-base-300 w-full p-5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Chats</span>
        </div>
        <div ref={dropdownRef} className="relative">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowDropdown((prev) => !prev)}>
            <MoreVertical className="w-5 h-5" />
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-base-100 border border-base-300 rounded shadow z-50">
              <button
                className="block w-full px-4 py-2 text-left hover:bg-base-200"
                onClick={() => {
                  setShowCreateGroupModal(true);
                  setShowDropdown(false);
                }}
              >
                Create Group
              </button>
              <button
                className="block w-full px-4 py-2 text-left hover:bg-base-200"
                onClick={() => {
                  setShowBlockedUsersPanel(true);
                  setShowDropdown(false);
                }}
              >
                Blocked Users
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 hidden lg:flex items-center gap-2 px-5">
        <label className="cursor-pointer flex items-center gap-2">
          <input
            type="checkbox"
            checked={showOnlineOnly}
            onChange={(e) => setShowOnlineOnly(e.target.checked)}
            className="checkbox checkbox-sm"
          />
          <span className="text-sm">Show online only</span>
        </label>
        <span className="text-xs text-zinc-500">({onlineContactCount} online)</span>
      </div>

      <div className="overflow-y-auto w-full py-3" key={refreshVersion}> 
        {filteredItems.map((item) => {
          const isSelected =
            (item.type === "user" && selectedUser?._id === item._id) ||
            (item.type === "group" && selectedGroup?._id === item._id);
          const isValidObjectId = item._id && typeof item._id === "string" && item._id.length === 24;

          return (
            <button
              key={`${item.type}-${item._id}`}
              onClick={async () => {
                if (!isValidObjectId) {
                  console.error("❌ Invalid ID detected:", item._id);
                  alert("Invalid group/user ID detected.");
                  return;
                }
                if (item?.type === "group") {
                  clearSelectedUser();
                  await setSelectedGroup({ ...item.raw, _id: item._id });
                  // toast.success(`✅ Group selected: ${item.name}`);
                } else {
                  clearSelectedGroup();
                  await setSelectedUser({ ...item.raw, type: item.type });
                  // toast.success(`✅ User selected: ${item.name}`);
                }
              }}
              onContextMenu={(e) => {
                if (item.type === "user") {
                  handleContextMenu(e, item);
                }
              }}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                isSelected ? "bg-base-300 ring-1 ring-base-300" : ""
              }`}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={item.profilePic || "/avatar.png"}
                  alt={item.name}
                  className="size-12 object-cover rounded-full"
                />
                {item.type === "user" && item.isOnline && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <div className={`truncate ${item.isUnread ? "font-bold" : "font-medium"}`}>
                  {item.name}
                </div>
                {item.lastMessage?.text && (
                  <div className="text-xs text-zinc-500 truncate mt-1">{item.lastMessage.text}</div>
                )}
              </div>
            </button>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No chats available</div>
        )}
      </div>

      <CreateGroupModal isOpen={showCreateGroupModal} onClose={() => setShowCreateGroupModal(false)} />

      {/* ✅ Right-click Context Menu */}
      {contextMenu.visible && contextMenu.user && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-base-100 border border-base-300 rounded shadow-md"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="block w-full px-4 py-2 text-left hover:bg-base-200"
            onClick={() => {
              setShowBlockConfirm(true);
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            Block "{contextMenu.user.name}"
          </button>
        </div>
      )}

      {/* ✅ Confirmation Modal */}
      {showBlockConfirm && contextMenu.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-base-100 p-6 rounded-xl shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4">
              Are you sure you want to block "{contextMenu.user.name}"?
            </h2>
            <div className="flex justify-between mt-6">
              <button className="btn btn-outline" onClick={() => setShowBlockConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleBlockUser}>
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {showBlockedUsersPanel && (
        <BlockedUsersPanel onClose={() => setShowBlockedUsersPanel(false)} />
      )}
    </aside>
  );
};

export default Sidebar;