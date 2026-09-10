"use client";

import Loading from "@/components/Loading";
import { useAppData } from "@/context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Mail, MessageCircle, UserCircle } from "lucide-react";

export default function ProfilePage() {
  const { loading, isAuth, user } = useAppData();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuth) router.replace("/login");
  }, [isAuth, loading, router]);

  if (loading || !user) return <Loading />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gray-900 px-4 py-10 text-white sm:px-6 sm:py-16">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-600/15 to-transparent" />

      <section className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/90 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="border-b border-gray-700 bg-gray-800/70 px-6 py-8 sm:px-10">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-900/40">
              <UserCircle className="h-9 w-9" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-400">Your account</p>
              <h1 className="mt-1 truncate text-3xl font-bold tracking-tight">Profile</h1>
              <p className="mt-1 text-sm text-gray-400">Your Gupsy account details</p>
            </div>
          </div>
        </div>

        <dl className="space-y-4 px-6 py-7 sm:px-10">
          <div className="flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-900/50 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-blue-400">
              <UserCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Name</dt>
              <dd className="mt-1 truncate text-base font-semibold text-white">{user.name}</dd>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-900/50 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-blue-400">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email address</dt>
              <dd className="mt-1 truncate text-base font-semibold text-white">{user.email}</dd>
            </div>
          </div>
        </dl>

        <div className="flex flex-col gap-3 border-t border-gray-700 bg-gray-900/30 px-6 py-5 sm:flex-row sm:justify-end sm:px-10">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            <MessageCircle className="h-4 w-4" />
            Go to chats
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </section>
    </main>
  );
}
