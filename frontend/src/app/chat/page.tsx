//This is the main Chat Page / parent component. Its job is mainly to connect all the smaller components together and manage the chat state + API calls.

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

//Getting data from AppContext. useAppData() gives the page global application data.
const ChatApp = () => {
  const {
    loading,
    isAuth,
    logoutUser,
    chats, //User's existing chats
    user: loggedInUser, //just renaming
    users, //List of users
    fetchChats,
  } = useAppData();

  const [selectedUser, setSelectedUser] = useState<string | null>(null); //It actually contains the chat ID, not the user ID
  const [message, setMessage] = useState(""); //Current message being typed,This is passed to MessageInput.
  const [messages, setMessages] = useState<Message[] | null>(null); //Stores messages of the currently selected chat.
  const [user, setUser] = useState<User | null>(null); //Selected user's information , This stores the other person's information.This gets used by: <ChatHeader user={user} />
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAllUser, setShowAllUser] = useState(false); //Controls whether the sidebar shows existing chats or all users.

  const router = useRouter();

  //if not authenticated, send them to login first
  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  const handleLogout = () => logoutUser();

  //This is the function that loads the messages of the selected chat.
  const fetchChat = useCallback(async () => {
    //useCallback keeps the function reference stable unless: selectedUser or fetchChats changes. Without it, a new fetchChat function would be created on every render, which can cause unnecessary effect executions.
    if (!selectedUser) return; //No selected chat?
    const token = Cookies.get("token"); //Gets the JWT token stored in browser cookies.

    //API request
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
      await fetchChats(); //Refresh sidebar chats Because after opening a chat, things like:last message,unread count,latest chat may have changed.
    } catch (error) {
      console.log(error);
      toast.error("Failed to load messages");
    }
  }, [fetchChats, selectedUser]);

  //This runs when you select a user who doesn't already have a chat.
  async function createChat(u: User) {
    //The user object comes from ChatSidebar.

    //Send request.You're telling backend:Create a chat between me and this user.
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
      //Backend creates/finds a chat and returns:chatId
      setSelectedUser(data.chatId); //Store chat ID
      setShowAllUser(false);//Hide all users
      await fetchChats();//Refresh chats Because a new chat now exists
    } catch {
      toast.error("Failed to start chat");
    }
  }
 
  //sending a message. MessageInput component handles the UI/form, while ChatApp handles the actual API request
  const handleMessageSend = async (
    e: React.FormEvent<HTMLFormElement>,
    imageFile?: File | null,
  ): Promise<boolean> => {
    e.preventDefault();

    if (!message.trim() && !imageFile) return false;
    if (!selectedUser) return false;//No selected chat → can't send.

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
      
      //Send to backend
      const { data } = await axios.post(
        `${chat_service}/api/v1/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      //Immediately add returned message
      setMessages((prev) => {
        const currentMessages = prev || [];

        const messageExists = currentMessages.some(//Is this message already in my messages?
          (msg) => msg._id === data.message._id,
        );
        if (!messageExists) {
          return [...currentMessages, data.message];
        }

        return currentMessages;
      });

      setMessage("");//Clear input
      await fetchChats();//Refresh chats
      return true;
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? (error.response?.data?.message ?? "Failed to send message")
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
        <ChatHeader user={user} setSidebarOpen={setSidebarOpen} />

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
