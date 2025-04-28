// frontend/src/components/CreateGroupModal.jsx

import { useState, useEffect } from "react";
import SelectMembers from "./SelectMembers";
import GroupInfoSetup from "./GroupInfoSetup";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Select Members, 2: Group Info
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState(null);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep(1);
    setSelectedUsers([]);
    setGroupName("");
    setGroupImage(null);
  };

  // Ensure modal is not rendered if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 p-6 rounded-xl w-96 space-y-4">
        {step === 1 ? (
          <SelectMembers
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
            onNext={() => setStep(2)}
            onClose={() => {
              resetForm();
              onClose();
            }}
          />
        ) : (
          <GroupInfoSetup
            selectedUsers={selectedUsers}
            groupName={groupName}
            setGroupName={setGroupName}
            groupImage={groupImage}
            setGroupImage={setGroupImage}
            onBack={() => setStep(1)}
            onClose={() => {
              resetForm();
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CreateGroupModal;