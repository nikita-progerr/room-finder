"use client";

import { useState } from "react";
import Link from "next/link";
import { triggerParse } from "@/services/api";
import { RefreshCw, Settings } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

const SARFTI_LOGO = "https://avatars.mds.yandex.net/get-altay/15126910/2a00000194b24f5a1821d4c572dd42441ff4/diploma";

export default function Header() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerParse();
      toast.success("Расписание обновляется...");
    } catch {
      toast.error("Не удалось запустить обновление");
    } finally {
      setTimeout(() => setRefreshing(false), 2000);
    }
  };

  return (
    <header className="header-glass sticky top-0 z-40">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <div className="relative max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-cyan-400/20 to-purple-500/30 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative rounded-2xl p-1.5 bg-gradient-to-r from-blue-500/20 via-transparent to-purple-500/20 border border-white/10 group-hover:border-white/30 transition-all duration-300">
              <img
                src={SARFTI_LOGO}
                alt="СарФТИ"
                className="h-9 w-auto object-contain rounded-xl"
              />
            </div>
          </div>
          <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <div className="flex flex-col">
            <span className="text-white font-bold text-base tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">Поиск аудиторий</span>
            </span>
            <span className="text-[11px] text-cyan-400/80 uppercase tracking-widest font-medium">СарФТИ НИЯУ МИФИ</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 group">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Онлайн</span>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={clsx(
              "group flex items-center gap-2 text-sm font-semibold",
              "px-5 py-2.5 rounded-2xl",
              "bg-gradient-to-r from-orange-500/10 via-yellow-500/5 to-orange-500/10 border-2 border-orange-500/50 hover:border-orange-400",
              "hover:shadow-lg hover:shadow-orange-500/20",
              "backdrop-blur-sm transition-all duration-300",
              refreshing && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={clsx(
              "w-4 h-4 text-orange-500 transition-transform duration-300",
              refreshing ? "animate-spin" : "group-hover:-rotate-12"
            )} />
            <span className="hidden sm:inline bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent font-semibold">
              {refreshing ? "Обновление..." : "Обновить"}
            </span>
          </button>

          <Link
            href="/admin"
            className={clsx(
              "group flex items-center gap-2 text-sm font-semibold",
              "px-5 py-2.5 rounded-2xl",
              "bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-blue-500/10 border-2 border-blue-500/50 hover:border-cyan-400",
              "hover:shadow-lg hover:shadow-cyan-500/20",
              "backdrop-blur-sm transition-all duration-300"
            )}
          >
            <Settings className={clsx(
              "w-4 h-4 text-blue-400 transition-transform duration-300",
              "group-hover:scale-110 group-hover:rotate-12"
            )} />
            <span className="hidden sm:inline bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-semibold">
              Админ
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
