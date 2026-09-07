"use client";

import Loading from "@/components/Loading";
import { useAppData } from "@/context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { loading, isAuth, user } = useAppData();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuth) router.replace("/login");
  }, [isAuth, loading, router]);

  if (loading || !user) return <Loading />;

  return (
    <main className="min-h-screen bg-gray-900 p-6 text-white">
      <section className="mx-auto max-w-md rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <dl className="mt-6 space-y-4">
          <div><dt className="text-sm text-gray-400">Name</dt><dd>{user.name}</dd></div>
          <div><dt className="text-sm text-gray-400">Email</dt><dd>{user.email}</dd></div>
        </dl>
        <Link href="/chat" className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700">
          Back to chats
        </Link>
      </section>
    </main>
  );
}
