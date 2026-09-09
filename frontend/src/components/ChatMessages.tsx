//this component is mainly responsible for displaying chat messages, removing duplicates, auto-scrolling, showing images/text, and showing sent/seen status.

import type { Message } from "@/app/chat/page"; //Message is a TypeScript type defined in your chat page.It tells this component what a message looks like.
import { User } from "@/context/AppContext"; //The component needs information about the currently logged-in user.
import Image from "next/image";
import React, { useEffect, useMemo, useRef } from "react"; //useRef is Used to get a reference to a DOM element.Usememo is Used to calculate something and avoid recalculating it unnecessarily,Here it is used to remove duplicate messages.
import { Check, CheckCheck } from "lucide-react";

//The ChatMessages component receives 3 things.
interface ChatMessagesProps {
  selectedUser: string | null;
  messages: Message[] | null;
  loggedInUser: User | null;
}

const ChatMessages = ({
  selectedUser,
  messages,
  loggedInUser,
}: ChatMessagesProps) => {
  //Component receives the props
  const bottomRef = useRef<HTMLDivElement>(null); //This creates a reference to an invisible HTML <div> at the bottom of the messages.Then JavaScript can tell the browser: Scroll to bottomRef. This is how automatic scrolling works.

  // Remove duplicate messages based on message ID ,The component creates a new array containing only unique messages.
  const uniqueMessages = useMemo(() => {
    //If messages hasn't changed, React can reuse the previous uniqueMessages.
    if (!messages) return [];

    const seen = new Set<string>(); //Set for detecting duplicates,A JavaScript Set stores unique values.
    return messages.filter((message) => {
      if (seen.has(message._id)) {
        return false;
      }
      seen.add(message._id);
      return true;
    });
  }, [messages]); //This means the duplicate-removal calculation runs when messages changes.

  //This is responsible for automatically moving the chat to the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, uniqueMessages]);

  return (
    //Message container
    <div className="flex-1 overflow-hidden">
      <div className="h-full max-h-[calc(100vh-215px)] overflow-y-auto p-2 space-y-2 custom-scroll">
        {!selectedUser ? (
          <p className="text-gray-400 text-center mt-20">
            Please select a user to start chatting 💌
          </p>
        ) : (
          <>
            {uniqueMessages.map((e, i) => {
              //e means the current message and i means its index.
              const isSentByMe = e.sender === loggedInUser?._id; //to determine which side the message belongs to.
              const uniqueKey = `${e._id}-${i}`; //React needs a unique key when rendering lists.helps React identify individual message elements.

              return (
                <div key={uniqueKey}>
                  <div
                    className={`flex flex-col gap-1 mt-2 ${
                      isSentByMe ? "items-end" : "items-start" //isSentByMe = true then put message on right
                    }`}
                  >
                    <div
                      className={`rounded-lg p-3 max-w-sm ${
                        isSentByMe
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      {/* Display image */}
                      {e.messageType === "image" && e.image && (
                        <div className="relative group">
                          <Image
                            src={e.image.url}
                            alt="shared image"
                            className="max-w-full h-auto rounded-lg"
                            width={800}
                            height={600}
                            unoptimized
                          />
                        </div>
                      )}

                      {/* Display text */}
                      {e.text && <p className="mt-1">{e.text}</p>}
                    </div>

                    <div
                      className={`flex items-center gap-1 text-xs text-gray-400 ${
                        isSentByMe ? "pr-2 flex-row-reverse" : "pl-2"
                      }`}
                      key={uniqueKey}
                    >
                      {/* Display message timestamp */}
                      <span>
                        {new Intl.DateTimeFormat("en", {
                          hour: "2-digit",
                          minute: "2-digit",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(e.createdAt))}
                      </span>

                      {/* Show check mark only for my messages */}
                      {isSentByMe && (
                        <div className="flex items-center ml-1">
                          {/* Check whether message was seen */}
                          {e.seen ? (
                            <div className="flex items-center gap-1 text-blue-400">
                              <CheckCheck className="w-3 h-3" />
                              {e.seenAt && (
                                <span>
                                  {new Intl.DateTimeFormat("en", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }).format(new Date(e.seenAt))}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Check className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* It's basically a scrolling target. */}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;
