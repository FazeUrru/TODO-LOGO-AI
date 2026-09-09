"use client";

import { useCallback, useMemo, useState } from "react";
import { ArenaContext, type ArenaMode } from "./arena-context";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import SearchDialog from "./SearchDialog";
import UpdateGate from "./UpdateGate";
import DemoBanner from "@/components/DemoBanner";
import { SettingsProvider } from "@/lib/settings";
import { AuthProvider } from "@/lib/auth-client";
import { ProfileProvider } from "@/lib/profile";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ArenaMode>("battle");
  const [modelAId, setModelAId] = useState("glm-5.3");
  const [modelBId, setModelBId] = useState("claude-opus-5");
  const [modelDirectId, setModelDirectId] = useState("gpt-6-astra");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roundKey, setRoundKey] = useState(0);

  const resetChat = useCallback(() => {
    setMode("battle");
    setRoundKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      modelAId,
      setModelAId,
      modelBId,
      setModelBId,
      modelDirectId,
      setModelDirectId,
      searchOpen,
      setSearchOpen,
      sidebarOpen,
      setSidebarOpen,
      roundKey,
      resetChat,
    }),
    [mode, modelAId, modelBId, modelDirectId, searchOpen, sidebarOpen, roundKey, resetChat]
  );

  return (
    <SettingsProvider>
      <AuthProvider>
        <ProfileProvider>
        <ArenaContext.Provider value={value}>
        <div className="min-h-screen">
          <Sidebar />
          <div
            className={cn(
              "flex min-h-screen flex-col transition-all duration-200",
              sidebarOpen
                ? "ml-0 md:ml-[256px]"
                : "ml-0 md:ml-[56px]"
            )}
          >
            <DemoBanner />
            <TopBar />
            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          </div>
          {searchOpen && <SearchDialog />}
          <UpdateGate />
        </div>
        </ArenaContext.Provider>
        </ProfileProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
