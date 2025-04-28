import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    selectedGroup,
    subscribeToMessages,
    unsubscribeFromMessages,
    clearSelectedUser,
    clearSelectedGroup,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const isGroup = Boolean(selectedGroup);
  const chatData = isGroup ? selectedGroup : selectedUser;

  // ✅ Auto-close chat if no selection (e.g., after block)
  useEffect(() => {
    if (!selectedUser && !selectedGroup) {
      console.log("❌ ChatContainer closing → No user/group selected.");
      return;
    }

    const chatId = selectedGroup?._id || selectedUser?._id;
    const isGroupChat = Boolean(selectedGroup);

    if (chatId) {
      getMessages(chatId, isGroupChat);
    }

    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, selectedGroup, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  // ✅ Auto-scroll to the latest message
  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ✅ If chatData becomes null (e.g., after block), don't render chat
  if (!chatData) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center text-zinc-400">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isMessagesLoading ? (
          <>
            <MessageSkeleton />
            <p className="text-center text-zinc-400">Loading messages...</p>
          </>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="flex flex-col justify-center items-center text-zinc-400 mt-10">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              Object.entries(
                messages.reduce((acc, message) => {
                  const msgDate = new Date(message.createdAt);
                  let label = format(msgDate, "yyyy-MM-dd");
                  if (isToday(msgDate)) label = "Today";
                  else if (isYesterday(msgDate)) label = "Yesterday";
                  if (!acc[label]) acc[label] = [];
                  acc[label].push(message);
                  return acc;
                }, {})
              ).map(([dateLabel, msgs]) => (
                <div key={dateLabel}>
                  {/* ✅ Date Divider */}
                  <div className="text-center text-sm text-zinc-500 mb-4">
                    <span className="px-4 py-1 bg-base-200 rounded-full">{dateLabel}</span>
                  </div>

                  {msgs.map((message) => (
                    <div
                      key={message._id}
                      className={`chat ${
                        (message.senderId._id || message.senderId) === authUser._id ? "chat-end" : "chat-start"
                      }`}
                      ref={messageEndRef}
                    >
                      <div className="chat-image avatar">
                        <div className="size-10 rounded-full border">
                          <img
                            src={
                              (message.senderId._id || message.senderId) === authUser._id
                                ? authUser.profilePic || "/avatar.png"
                                : message.sender?.profilePic || "/avatar.png"
                            }
                            alt="profile pic"
                          />
                        </div>
                      </div>
                      <div className="chat-header mb-1">
                        <span className="font-medium text-xs">
                          {isGroup && message.sender ? message.sender.fullName : ""}
                        </span>
                        <time className="text-xs opacity-50 ml-1">
                          {formatMessageTime(message.createdAt)}
                        </time>
                      </div>
                      <div className="chat-bubble flex flex-col">
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Attachment"
                            className="sm:max-w-[200px] rounded-md mb-2"
                          />
                        )}
                        {message.text && <p>{message.text}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </>
        )}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;