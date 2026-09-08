import type { Message } from "@/app/chat/page";
import { User } from "@/context/AppContext";
import Image from "next/image";
import React, { useEffect, useMemo, useRef } from "react";
import { Check, CheckCheck } from "lucide-react";

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
  const bottomRef = useRef<HTMLDivElement>(null);

  // Remove duplicate messages based on message ID
  const uniqueMessages = useMemo(() => {
    if (!messages) return [];

    const seen = new Set<string>();
    return messages.filter((message) => {
      if (seen.has(message._id)) {
        return false;
      }

      seen.add(message._id);
      return true;
    });
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, uniqueMessages]);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full max-h-[calc(100vh-215px)] overflow-y-auto p-2 space-y-2 custom-scroll">
        {!selectedUser ? (
          <p className="text-gray-400 text-center mt-20">
            Please select a user to start chatting 💌
          </p>
        ) : (
          <>
            {uniqueMessages.map((e, i) => {
              const isSentByMe = e.sender === loggedInUser?._id;
              const uniqueKey = `${e._id}-${i}`;

              return (
                <div key={uniqueKey}>
                  <div
                    className={`flex flex-col gap-1 mt-2 ${
                      isSentByMe ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg p-3 max-w-sm ${
                        isSentByMe
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
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

                      {e.text && <p className="mt-1">{e.text}</p>}
                    </div>

                    <div
                      className={`flex items-center gap-1 text-xs text-gray-400 ${
                        isSentByMe ? "pr-2 flex-row-reverse" : "pl-2"
                      }`}
                      key={uniqueKey}
                    >
                      <span>
                        {new Intl.DateTimeFormat("en", {
                          hour: "2-digit",
                          minute: "2-digit",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(e.createdAt))}
                      </span>

                      {isSentByMe && (
                        <div className="flex items-center ml-1">
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

            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;
