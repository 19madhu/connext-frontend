import { useState } from "react";
import { useChatStore } from "../store/useChatStore";

const SelectMembers = ({ selectedUsers, setSelectedUsers, onNext, onClose }) => {
  const { users } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");

  const handleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Add Members to Group</h2>

      <input
        type="text"
        placeholder="Search contacts"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="input input-bordered w-full mb-3"
      />

      <div className="max-h-40 overflow-y-auto border p-2 rounded-lg mb-4">
        {filteredUsers.map((user) => (
          <label key={user._id} className="flex items-center gap-2 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedUsers.includes(user._id)}
              onChange={() => handleUserSelection(user._id)}
              className="checkbox checkbox-sm"
            />
            <span>{user.fullName}</span>
          </label>
        ))}
      </div>

      <div className="flex justify-between mt-4">
        <button onClick={onClose} className="btn btn-sm btn-outline">
          Cancel
        </button>
        <button
          onClick={onNext}
          disabled={selectedUsers.length === 0}
          className={`btn btn-sm btn-primary ${selectedUsers.length === 0 ? "btn-disabled opacity-50" : ""}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SelectMembers;