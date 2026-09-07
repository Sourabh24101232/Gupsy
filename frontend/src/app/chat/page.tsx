"use client";

import ChatSidebar from "@/components/ChatSidebar";
import Loading from "@/components/Loading";
import { chat_service, useAppData, User } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { Menu, Send, UserCircle } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import axios from "axios";

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
  const [sending, setSending] = useState(false);

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
    } catch (error) {
      toast.error("Failed to start chat");
    }
  }

  useEffect(() => {
    void fetchChat();
  }, [fetchChat]);

  async function handleSendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = message.trim();
    if (!selectedUser || !text) return;

    setSending(true);
    try {
      const token = Cookies.get("token");
      await axios.post(
        `${chat_service}/api/v1/message`,
        { chatId: selectedUser, text },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage("");
      await fetchChat();
    } catch (error) {
      console.log(error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

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

      <main className="flex min-w-0 flex-1 flex-col">
        {selectedUser ? (
          <>
            <header className="flex items-center gap-3 border-b border-gray-700 bg-gray-800 p-4">
              <button
                className="rounded-lg p-2 hover:bg-gray-700 sm:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open conversations"
              >
                <Menu className="h-5 w-5" />
              </button>
              <UserCircle className="h-8 w-8 text-gray-300" />
              <div>
                <h1 className="font-semibold">{user?.name ?? "Loading chat..."}</h1>
                {user?.email && <p className="text-sm text-gray-400">{user.email}</p>}
              </div>
            </header>

            <section className="flex-1 space-y-3 overflow-y-auto p-4">
              {(messages ?? []).map((chatMessage) => {
                const sentByMe = chatMessage.sender === loggedInUser?._id;
                return (
                  <div key={chatMessage._id} className={`flex ${sentByMe ? "justify-end" : "justify-start"}`}>
                    <p className={`max-w-[75%] rounded-2xl px-4 py-2 ${sentByMe ? "bg-blue-600" : "bg-gray-700"}`}>
                      {chatMessage.text}
                    </p>
                  </div>
                );
              })}
            </section>

            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-gray-700 bg-gray-800 p-4">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message..."
                className="min-w-0 flex-1 rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="rounded-lg bg-blue-600 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </>
        ) : (
          <section className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400">
            <button className="rounded-lg p-2 hover:bg-gray-800 sm:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open conversations">
              <Menu className="h-5 w-5" />
            </button>
            <UserCircle className="h-12 w-12" />
            <p>Select a conversation or start a new chat.</p>
          </section>
        )}
      </main>
    </div>
  );
};

export default ChatApp;
