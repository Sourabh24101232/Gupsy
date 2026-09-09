//MessageInput.tsx manages what the user is typing, lets them select an image, creates a temporary preview, and then hands the text/image to the parent through handleMessageSend().

import { Loader2, Paperclip, Send, X } from "lucide-react";
import Image from "next/image"; //Next.js's optimized image component.
import React, { useEffect, useRef, useState } from "react";
//useState → value needed by the UI.
//useRef → value we need to remember internally.

//This defines what the parent component must give to MessageInput
interface MessageInputProps {
  selectedUser: string | null;
  message: string;
  setMessage: (message: string) => void; //Function provided by the parent to update message
  handleMessageSend: (
    //MessageInput does not actually implement the backend sending logic.Instead, it asks the parent: "Here is the form event and possibly an image. You handle sending it."
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
  const [imageFile, setImageFile] = useState<File | null>(null); //This is the file that eventually gets sent to the backend.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); //It's a temporary browser URL that allows the selected local image to be displayed.The browser creates this URL from the local file.
  const previewUrlRef = useRef<string | null>(null); //to remember the preview URL so we can delete it later
  const [isUploading, setIsUploading] = useState(false);

  //repeatedly selecting images can unnecessarily consume browser memory
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  //This completely removes the selected image after clicking X.
  const clearImage = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    setImageFile(null);
  };

  //It's called when the form is submitted
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    //Don't send empty messages
    if (!message.trim() && !imageFile) return;
    //message.trim() converts "     " into "" so it prevents "   " also.
    //  But an image alone is allowed.

    setIsUploading(true); //Now the UI knows: message is being sent. The send button becomes disabled and the spinner appears.

    //Send to parent.This is where the actual sending happens.
    try {
      const sent = await handleMessageSend(e, imageFile);
      if (sent) clearImage(); //Clear image only if sending succeeded
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedUser) return null; //Don't render MessageInput.the message box isn't shown when no chat is selected.

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t border-gray-700 pt-2"
    >
      {/* The image preview is shown only if both exist */}
      {imageFile && previewUrl && (
        <div className="relative w-fit">
          {/* displays the local image. */}
          <Image
            src={previewUrl}
            alt="preview"
            className="h-24 w-24 rounded-lg border border-gray-600 object-cover"
            width={96}
            height={96}
            unoptimized
          />

          {/* Remove button */}
          <button
            type="button" //Because this button is inside a <form> . Without it, a button can behave as a submit button.That's why type="button" matters.
            className="absolute -top-2 -right-2 rounded-full bg-black p-1"
            onClick={clearImage}
            aria-label="Remove image"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      {/* File picker */}
      <div className="flex items-center gap-2">
        {/* Clicking the label triggers the file input. */}
        <label className="cursor-pointer rounded-lg bg-gray-700 px-3 py-2 transition-colors hover:bg-gray-600">
          {/* This opens the file selector. */}
          <Paperclip size={18} className="text-gray-300" />

          <input
            type="file"
            accept="image/*" //tells the browser that the component expects images.
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]; //When the user selects files, the browser gives:e.target.files .They only take the first one.
              if (file?.type.startsWith("image/")) {
                if (previewUrlRef.current)
                  URL.revokeObjectURL(previewUrlRef.current); //Remove old preview
                const url = URL.createObjectURL(file); //This creates a temporary URL pointing to the local file.
                previewUrlRef.current = url;
                setPreviewUrl(url);
                setImageFile(file);
              }

              e.target.value = ""; //Reset file input, it allows selecting the same file again.
            }}
          />
        </label>

        {/* Text input */}
        <input
          type="text"
          className="flex-1 rounded-lg bg-gray-700 px-4 py-2 text-white placeholder-gray-400"
          placeholder={imageFile ? "Add a caption..." : "Type a message..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={(!imageFile && !message.trim()) || isUploading}//Send button disabled condition
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
