"use client";

import Loading from "@/components/Loading";
import { useAppData } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";


const ChatApp = () => {
  const { loading, isAuth } = useAppData();
  const router = useRouter();

  //if not authenticated, send them to login first
  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  //if loading, show loading component
  if (loading) return <Loading />;

  return <div>ChatApp</div>;
};

export default ChatApp;