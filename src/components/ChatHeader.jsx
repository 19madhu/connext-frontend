import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";
import GroupInfoPanel from "./GroupInfoPanel";

const ChatHeader = () => {
  const {
    selectedUser,
    selectedGroup,
    setSelectedUser,
    setSelectedGroup,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const isGroup = Boolean(selectedGroup);

  // ✅ Handle undefined members safely:
  const onlineMemberCount = isGroup
    ? (selectedGroup.members || []).filter((member) =>
        onlineUsers.includes(member._id)
      ).length
    : null;

  const handleCloseChat = (e) => {
    e.stopPropagation(); // ✅ Prevent triggering group info opening when clicking close button
    setSelectedUser(null);
    setSelectedGroup(null);
  };

  const handleOpenGroupInfo = () => {
    if (isGroup) {
      setShowGroupInfo(true);
    }
  };

  // ✅ Safety: Prevent rendering if no chat is selected
  if (!selectedUser && !selectedGroup) return null;

  return (
    <>
      <div
        className={`p-2.5 border-b border-base-300 ${
          isGroup ? "cursor-pointer" : ""
        }`}
        onClick={isGroup ? handleOpenGroupInfo : undefined}
      >
        <div className="flex items-center justify-between">
          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img
                  src={
                    isGroup
                      ? selectedGroup.groupImage || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt={isGroup ? selectedGroup.name : selectedUser.fullName}
                />
              </div>
            </div>

            {/* Chat info */}
            <div>
              <h3 className="font-medium">
                {isGroup ? selectedGroup.name : selectedUser.fullName}
              </h3>
              <p className="text-sm text-base-content/70">
                {isGroup
                  ? `${onlineMemberCount} online`
                  : onlineUsers.includes(selectedUser._id)
                  ? "Online"
                  : "Offline"}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleCloseChat}
            className="btn btn-ghost btn-sm"
          >
            <X />
          </button>
        </div>
      </div>

      {/* ✅ Group Info Panel */}
      {isGroup && showGroupInfo && (
        <GroupInfoPanel onClose={() => setShowGroupInfo(false)} />
      )}
    </>
  );
};

export default ChatHeader;