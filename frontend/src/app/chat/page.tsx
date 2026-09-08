"use client";

import ChatSidebar from "@/components/ChatSidebar";
import Loading from "@/components/Loading";
import { chat_service, useAppData, User } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import axios from "axios";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import MessageInput from "@/components/MessageInput";

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

const ChatApp = () => {
  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
  } = useAppData();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAllUser, setShowAllUser] = useState(false);

  const router = useRouter();

  //if not authenticated, send them to login first
  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  const handleLogout = () => logoutUser();

  const fetchChat = useCallback(async () => {
    if (!selectedUser) return;
    const token = Cookies.get("token");

    try {
      const { data } = await axios.get(
        `${chat_service}/api/v1/message/${selectedUser}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMessages(data.messages);
      setUser(data.user);

      await fetchChats();
    } catch (error) {
      console.log(error);
      toast.error("Failed to load messages");
    }
  }, [fetchChats, selectedUser]);

  async function createChat(u: User) {
    try {
      const token = Cookies.get("token");
      const { data } = await axios.post(
        `${chat_service}/api/v1/chat/new`,
        {
          otherUserId: u._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSelectedUser(data.chatId);
      setShowAllUser(false);
      await fetchChats();
    } catch {
      toast.error("Failed to start chat");
    }
  }

  const handleMessageSend = async (
    e: React.FormEvent<HTMLFormElement>,
    imageFile?: File | null,
  ): Promise<boolean> => {
    e.preventDefault();

    if (!message.trim() && !imageFile) return false;
    if (!selectedUser) return false;

    const token = Cookies.get("token");

    try {
      const formData = new FormData();

      formData.append("chatId", selectedUser);

      if (message.trim()) {
        formData.append("text", message.trim());
      }
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const { data } = await axios.post(
        `${chat_service}/api/v1/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMessages((prev) => {
        const currentMessages = prev || [];

        const messageExists = currentMessages.some(
          (msg) => msg._id === data.message._id,
        );
        if (!messageExists) {
          return [...currentMessages, data.message];
        }

        return currentMessages;
      });

      setMessage("");
      await fetchChats();
      return true;
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? "Failed to send message"
        : "Failed to send message";
      toast.error(errorMessage);
      return false;
    }
  };

  useEffect(() => {
    if (!selectedUser) return;
    queueMicrotask(() => void fetchChat());
  }, [fetchChat, selectedUser]);

  //if loading, show loading component
  if (loading) return <Loading />;

  return (
    <div className="min-h-screen flex bg-gray-900 text-white relative overflow-hidden">
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAllUsers={showAllUser}
        setShowAllUsers={setShowAllUser}
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleLogout={handleLogout}
        createChat={createChat}
      />

      <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10">
        <ChatHeader
          user={user}
          setSidebarOpen={setSidebarOpen}
        />

        <ChatMessages
          selectedUser={selectedUser}
          messages={messages}
          loggedInUser={loggedInUser}
        />

        <MessageInput
          selectedUser={selectedUser}
          message={message}
          setMessage={setMessage}
          handleMessageSend={handleMessageSend}
        />
      </div>
    </div>
  );
};

export default ChatApp;
