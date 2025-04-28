import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react"; // npm i emoji-picker-react

const GroupInfoSetup = ({
  selectedUsers,
  groupName,
  setGroupName,
  groupImage,
  setGroupImage,
  onBack,
  onClose,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setGroupImage(reader.result); // ✅ Store base64 image directly
      };
    }
  };

  const handleEmojiClick = (emojiData) => {
    setGroupName((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required.");
      return;
    }

    setIsCreating(true);
    try {
      const processedImage = groupImage || null;

      // ✅ Corrected API endpoint to match backend route: POST /api/groups
      await axiosInstance.post("/groups", {
        name: groupName,
        members: selectedUsers,
        groupImage: processedImage,
      });

      toast.success("Group created successfully!");
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error(error.response?.data?.message || "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Set Group Info</h2>

      {/* Group Image Preview and Upload */}
      <div className="flex justify-center mb-4">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2">
          <img
            src={groupImage || "/avatar.png"} // ✅ fallback to /avatar.png
            alt="Group"
            className="w-full h-full object-cover"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Group Name Input with Emoji */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="input input-bordered w-full"
        />
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="btn btn-sm"
        >
          😊
        </button>
      </div>

      {showEmojiPicker && (
        <div className="mb-4">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}

      <div className="flex justify-between mt-4">
        <button onClick={onBack} className="btn btn-sm btn-outline">
          Back
        </button>
        <button
          onClick={handleCreateGroup}
          disabled={isCreating}
          className={`btn btn-sm btn-primary ${isCreating ? "opacity-50 pointer-events-none" : ""}`}
        >
          {isCreating ? "Creating..." : "Create Group"}
        </button>
      </div>
    </div>
  );
};

export default GroupInfoSetup;