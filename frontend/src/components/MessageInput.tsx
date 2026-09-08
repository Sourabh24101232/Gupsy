import { Loader2, Paperclip, Send, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

interface MessageInputProps {
  selectedUser: string | null;
  message: string;
  setMessage: (message: string) => void;
  handleMessageSend: (
    e: React.FormEvent<HTMLFormElement>,
    imageFile?: File | null,
  ) => Promise<boolean>;
}

const MessageInput = ({
  selectedUser,
  message,
  setMessage,
  handleMessageSend,
}: MessageInputProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const clearImage = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!message.trim() && !imageFile) return;

    setIsUploading(true);
    try {
      const sent = await handleMessageSend(e, imageFile);
      if (sent) clearImage();
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedUser) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t border-gray-700 pt-2"
    >
      {imageFile && previewUrl && (
        <div className="relative w-fit">
          <Image
            src={previewUrl}
            alt="preview"
            className="h-24 w-24 rounded-lg border border-gray-600 object-cover"
            width={96}
            height={96}
            unoptimized
          />

          <button
            type="button"
            className="absolute -top-2 -right-2 rounded-full bg-black p-1"
            onClick={clearImage}
            aria-label="Remove image"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="cursor-pointer rounded-lg bg-gray-700 px-3 py-2 transition-colors hover:bg-gray-600">
          <Paperclip size={18} className="text-gray-300" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file?.type.startsWith("image/")) {
                if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
                const url = URL.createObjectURL(file);
                previewUrlRef.current = url;
                setPreviewUrl(url);
                setImageFile(file);
              }
              e.target.value = "";
            }}
          />
        </label>

        <input
          type="text"
          className="flex-1 rounded-lg bg-gray-700 px-4 py-2 text-white placeholder-gray-400"
          placeholder={imageFile ? "Add a caption..." : "Type a message..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          type="submit"
          disabled={(!imageFile && !message.trim()) || isUploading}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
