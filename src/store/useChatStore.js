import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  contacts: [],
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  lastMessages: {},
  unreadMessages: {},
  refreshVersion: 0,  // 🟢 ADDED here!

  incrementRefreshVersion: () => {
    set((state) => ({ refreshVersion: state.refreshVersion + 1 }));
  },

  /** ✅ Fetch Users with Last Messages */
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users-with-last-message");
      const users = res.data;

      const lastMessagesUpdate = {};
      users.forEach((user) => {
        lastMessagesUpdate[user._id] = {
          text: user.lastMessageText || "No messages yet",
          timestamp: new Date(user.lastMessageTimestamp).getTime() || 0,
        };
      });

      set((state) => ({
        users,
        lastMessages: { ...state.lastMessages, ...lastMessagesUpdate },
      }));

      get().prepareContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /** ✅ Fetch Groups with Last Messages */
  getGroups: async () => {
    try {
      const res = await axiosInstance.get("/groups");
      const groups = res.data;
  
      const lastMessagesUpdate = {};
      groups.forEach((group) => {
        lastMessagesUpdate[group._id] = {
          text: group.lastMessage?.text || "No messages yet",
          timestamp: new Date(group.lastMessageTime).getTime(),
        };
      });
  
      // 🟢 Clean up lastMessages properly before setting groups
      const groupIds = groups.map((g) => g._id);
      set((state) => {
        const cleanedLastMessages = Object.fromEntries(
          Object.entries(state.lastMessages).filter(([id]) => groupIds.includes(id))
        );
        return {
          groups,
          lastMessages: { ...cleanedLastMessages, ...lastMessagesUpdate },
        };
      });
  
      get().prepareContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load groups");
    }
  },  
  /** ✅ Get Messages for Selected Chat */
  getMessages: async (chatId, isGroup = false) => {
    if (!chatId) return;
    set({ isMessagesLoading: true });
    try {
      const url = isGroup ? `/groups/messages/${chatId}` : `/messages/${chatId}`;
      const res = await axiosInstance.get(url);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  /** ✅ Send Message Logic */
  sendMessage: async (messageData, isGroup = false) => {
    const { selectedUser, selectedGroup, getUsers, getGroups } = get();
    const receiverId = isGroup ? selectedGroup?._id : selectedUser?._id;

    if (!receiverId) {
      toast.error("❌ No user or group selected! Cannot send message.");
      return;
    }

    try {
      const url = isGroup ? `/groups/send-message/${receiverId}` : `/messages/send/${receiverId}`;
      const res = await axiosInstance.post(url, messageData);
      const message = res.data;

      set((state) => ({
        messages: [...state.messages, message],
        lastMessages: {
          ...state.lastMessages,
          [receiverId]: {
            text: message.text,
            timestamp: new Date(message.createdAt).getTime(),
          },
        },
      }));

      await getUsers();
      await getGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", async (newMessage) => {
      const {
        messages,
        lastMessages,
        unreadMessages,
        selectedUser,
        selectedGroup,
        getGroups,
        getUsers,
        prepareContacts,
      } = get();

      const isGroup = newMessage.groupId !== undefined;
      const chatId = isGroup ? newMessage.groupId : newMessage.senderId;
      const messageTimestamp = new Date(newMessage.createdAt).getTime();

      const isFromCurrentChat =
        (isGroup && selectedGroup?._id?.toString() === chatId.toString()) ||
        (!isGroup && selectedUser?._id?.toString() === chatId.toString());

      if (isFromCurrentChat) {
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      }

      set((state) => ({
        lastMessages: {
          ...state.lastMessages,
          [chatId]: {
            text: newMessage.text || "📎 Image",
            timestamp: messageTimestamp,
          },
        },
        unreadMessages: {
          ...state.unreadMessages,
          [chatId]: isFromCurrentChat ? false : true,
        },
      }));

      if (isGroup) {
        await getGroups();
      } else {
        await getUsers();
      }

      prepareContacts();
    });

    socket.on("groupCreated", (newGroup) => {
      const { groups } = get();
      set({ groups: [...groups, newGroup] });
    });

    // ✅ Handling "user-blocked" event
    socket.on("user-blocked", async ({ blockedBy }) => {
      const {
        selectedUser,
        clearSelectedUser,
        getUsers,
        getGroups,
        prepareContacts,
        incrementRefreshVersion,
      } = get();

      if (selectedUser && selectedUser._id === blockedBy) {
        clearSelectedUser();
        toast.error("You have been blocked by this user.");
      }

      await getUsers();
      await getGroups();
      prepareContacts();
      incrementRefreshVersion(); // ✅ FORCE re-render!
    });

    // ✅ Handling "block-success" event
    socket.on("block-success", async ({ blockedUserId }) => {
      const {
        selectedUser,
        clearSelectedUser,
        getUsers,
        getGroups,
        prepareContacts,
        incrementRefreshVersion,
      } = get();

      if (selectedUser && selectedUser._id === blockedUserId) {
        clearSelectedUser();
        toast.success("Blocked user successfully!");
      }

      await getUsers();
      await getGroups();
      prepareContacts();
      incrementRefreshVersion(); // ✅ FORCE re-render!
    });

    socket.on("memberExited", async ({ groupId, memberId }) => {
      const authUser = useAuthStore.getState().authUser;
      const { getGroups, setSelectedGroup, selectedGroup } = get();
    
      await getGroups(); // Always refresh the group list
    
      if (authUser._id === memberId) {
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(null);
        }
        // toast.success("You exited the group.");  // ✅ Clear wording
      } else {
        console.log(`User ${memberId} exited group ${groupId}`);
      }
    });    
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("groupCreated");
      socket.off("user-blocked");
      socket.off("block-success");
      socket.off("memberRemoved");
    }
  },

  /** ✅ Selecting User Logic with Unread Clear */
  setSelectedUser: async (selectedUser) => {
    if (!selectedUser) {
      set((state) => ({
        selectedUser: null,
        selectedGroup: state.selectedGroup,
        isMessagesLoading: false,
      }));
      return;
    }

    set((state) => ({
      selectedUser,
      selectedGroup: null,
      isMessagesLoading: true,
    }));

    try {
      const res = await axiosInstance.get(`/messages/${selectedUser._id}`);
      set((state) => ({
        messages: res.data,
        unreadMessages: { ...state.unreadMessages, [selectedUser._id]: false },
        isMessagesLoading: false,
      }));
      get().prepareContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
      set({ isMessagesLoading: false });
    }
  },

  /** ✅ Selecting Group Logic with Unread Clear */
  setSelectedGroup: async (selectedGroup) => {
    if (!selectedGroup || !selectedGroup._id) {
      set((state) => ({
        selectedGroup: null,
        selectedUser: state.selectedUser,
        messages: [],
        isMessagesLoading: false,
      }));
      return;
    }

    set((state) => ({
      selectedGroup,
      selectedUser: null,
      isMessagesLoading: true,
    }));

    try {
      const res = await axiosInstance.get(`/groups/messages/${selectedGroup._id}`);
      set((state) => ({
        messages: res.data,
        unreadMessages: { ...state.unreadMessages, [selectedGroup._id]: false },
        isMessagesLoading: false,
      }));
      get().prepareContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load group messages");
      set({ isMessagesLoading: false });
    }
  },

  clearSelectedUser: () => {
    set((state) => ({
      selectedUser: null,
      selectedGroup: state.selectedGroup,
      messages: [],
      isMessagesLoading: false,
    }));
  },

  clearSelectedGroup: () => {
    set((state) => ({
      selectedGroup: null,
      selectedUser: state.selectedUser,
      messages: [],
      isMessagesLoading: false,
    }));
  },

  /** ✅ Preparing Contacts (with Online Status) */
  prepareContacts: () => {
    const { users, groups, lastMessages, unreadMessages } = get();
    const { onlineUsers } = useAuthStore.getState();
  
    const userContacts = users.map((user) => {
      const lastMsg = lastMessages[user._id];
      return {
        type: "user",
        _id: user._id,
        name: user.fullName,
        profilePic: user.profilePic || "/avatar.png",
        lastMessageTimestamp: lastMsg?.timestamp || 0,                // ✅ No fallback to createdAt
        isUnread: unreadMessages?.[user._id] || false,
        lastMessage: lastMsg || null,
        isOnline: onlineUsers.includes(user._id),
        raw: user,
      };
    });
  
    const groupContacts = groups.map((group) => {
      const lastMsg = lastMessages[group._id];
      const fallbackTimestamp = lastMsg?.timestamp 
        ? lastMsg.timestamp 
        : (group.messagesCount > 0 ? group.lastMessageTime : 0);     // ✅ Safer fallback only if there are messages
      return {
        type: "group",
        _id: group._id,
        name: group.name,
        profilePic: group.groupImage || "/avatar.png",
        lastMessageTimestamp: fallbackTimestamp,
        isUnread: unreadMessages?.[group._id] || false,
        lastMessage: lastMsg || null,
        raw: group,
      };
    });
  
    const combinedContacts = [...userContacts, ...groupContacts].sort(
      (a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp
    );
  
    set({ contacts: combinedContacts });
  },
}));  