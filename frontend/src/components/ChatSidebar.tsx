// It controls the left sidebar where you can:

// See your existing chats
// Search for users
// Start a new chat
// Select a conversation
// Open your profile
// Logout
// Open/close the sidebar on mobile

import { Chats, User } from "@/context/AppContext"; //User and Chats are TypeScript types coming from AppContext.
import Link from "next/link"; //Used for navigation.
import {
  CornerDownRight,
  CornerUpLeft,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  UserCircle,
  X,
} from "lucide-react";
import React, { useState } from "react";

//These are the things that the parent component gives to ChatSidebar.
interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAllUsers: boolean;//"Should I show the list of all users?"
  setShowAllUsers: (show: boolean | ((prev: boolean) => boolean)) => void;
  users: User[] | null;
  loggedInUser: User | null;
  chats: Chats[] | null;
  selectedUser: string | null;
  setSelectedUser: (userId: string | null) => void;
  handleLogout: () => void;
  createChat: (user: User) => void;
}

const ChatSidebar = ({
  sidebarOpen,
  setShowAllUsers,
  setSidebarOpen,
  showAllUsers,
  users,
  loggedInUser,
  chats,
  selectedUser,
  setSelectedUser,
  handleLogout,
  createChat,
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState(""); //This state is used to filter users.

  //Everything inside <aside> represents the sidebar.
  return (
    <aside
      className={`fixed z-20 sm:static top-0 left-0 h-screen w-80 bg-gray-900 border-r border-gray-700 transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } sm:translate-x-0 transition-transform duration-300 flex flex-col`}
    >
      {/* header */}
      <div className="p-6 border-b border-gray-700">
        <div className="sm:hidden flex justify-end mb-0">
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg justify-between">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            {/* Header title */}
            <h2 className="text-xl font-bold text-white">
              {showAllUsers ? "New Chat" : "Messages"}
            </h2>
          </div>

          {/*  Plus / X button */}
          <button
            className={`p-2.5 rounded-lg transition-colors ${
              showAllUsers
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
            onClick={() => setShowAllUsers((prev) => !prev)}
          >
            {showAllUsers ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* content */}
      <div className="flex-1 overflow-hidden px-4 py-2">
        {/* Case 1 — Show all users */}
        {showAllUsers ? (
          <div className="space-y-4 h-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="text"
                placeholder="Search Users..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* users list */}
            <div className="space-y-2 overflow-y-auto h-full pb-4">
              {users
                ?.filter(
                  (u) =>
                    u._id !== loggedInUser?._id &&
                    u.name.toLowerCase().includes(searchQuery.toLowerCase()), //"rahul".includes("rah") → true
                )
                //creates a button for every user
                .map((u) => (
                  <button
                    key={u._id} //React needs a unique key when rendering lists.
                    className="w-full text-left p-4 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-colors"
                    onClick={() => createChat(u)} //When you click Rahul: createChat(Rahul) , Parent handles chat creation
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <UserCircle className="w-6 h-6 text-gray-300" />
                      </div>

                      {/* online symbol dikhana hai */}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-white">{u.name}</span>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {/* to show online offline text */}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ) : //Case 2 — Existing chats
        chats && chats.length > 0 ? (
          <div className="space-y-2 overflow-y-auto h-full pb-4">
            {chats.map((chat) => {
              //Each chat represents one conversation.
              const latestMessage = chat.chat.latestMessage;
              const isSelected = selectedUser === chat.chat._id; //This determines whether this conversation is currently open.This allows the UI to visually highlight the selected conversation.
              const isSentByMe = latestMessage?.sender === loggedInUser?._id; //Checking who sent the latest message
              const unseenCount = chat.chat.unseenCount || 0;

              return (
                //Selecting a chat
                <button
                  key={chat.chat._id}
                  onClick={() => {
                    setSelectedUser(chat.chat._id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-blue-600 border border-blue-500"
                      : "border border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                        <UserCircle className="w-7 h-7 text-gray-300" />
                        {/* onlineuser ka work hai */}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-semibold truncate ${
                            isSelected ? "text-white" : "text-gray-200"
                          }`}
                        >
                          {/* Displays the person you're chatting with. */}
                          {chat.user.name}
                        </span>

                        {/* Unseen count */}
                        {unseenCount > 0 && (
                          <div className="bg-red-600 text-white text-xs font-bold rounded-full min-w-[22px] h-5.5 flex items-center justify-center px-2">
                            {unseenCount > 99 ? "99+" : unseenCount}
                          </div>
                        )}
                      </div>

                      {/* Only show the latest message section if a latest message exists. */}
                      {latestMessage && (
                        //  Sent vs received icon
                        <div className="flex items-center gap-2">
                          {isSentByMe ? (
                            <CornerUpLeft
                              size={14}
                              className="text-blue-400 text-shrink-0"
                            />
                          ) : (
                            <CornerDownRight
                              size={14}
                              className="text-green-400 text-shrink-0"
                            />
                          )}

                          {/* Latest message text */}
                          <span className="text-sm text-gray-400 truncate flex-1">
                            {latestMessage.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          //  Case 3 — No conversations
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-gray-800 rounded-full mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>

            <p className="text-gray-400 font-medium">No conversation yet</p>

            <p className="text-sm text-gray-500 mt-1">
              Start a new chat to begin messaging
            </p>
          </div>
        )}
      </div>

      {/* Footer — Profile */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <Link
          href={"/profile"}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <div className="p-1.5 bg-gray-700 rounded-lg">
            <UserCircle className="w-4 h-4 text-gray-300" />
          </div>

          <span className="font-medium text-gray-300">Profile</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-colors text-red-500 hover:text-white"
        >
          <div className="p-1.5 bg-red-600 rounded-lg">
            <LogOut className="w-4 h-4 text-gray-300" />
          </div>

          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
