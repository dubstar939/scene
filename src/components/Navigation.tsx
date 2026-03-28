import React from "react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

/**
 * Navigation Component
 * 
 * Renders the main navigation bar for the application.
 * 
 * @param {NavigationProps} props - Component props
 * @returns {JSX.Element} The rendered navigation bar
 */
const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    "members",
    "chat",
    "contacts",
    "tasks",
    "discover",
    "spots",
    "cruise",
    "reminders",
    "leaderboard",
    "achievements",
    "profile",
    "studio",
  ] as const;

  return (
    <div className="flex p-2 gap-1 bg-black/40 m-4 md:m-6 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-shrink-0 px-4 py-3 text-[10px] uppercase font-black rounded-xl transition-all ${
            activeTab === tab 
              ? "bg-indigo-600 text-white shadow-lg" 
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {tab === "reminders" ? "Events" : tab}
        </button>
      ))}
    </div>
  );
};

export default React.memo(Navigation);
