"use client";
import { useState, useEffect } from "react";
import { Bell, MailOpen, Circle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function NotificationBell({ userId, isDark }) {
  const [notifications, setNotifications] = useState([]);
  const [show, setShow] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchNotifications();

    
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, 
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
         
        }
      ).subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  };

  const markAsRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button onClick={() => { setShow(!show); if(!show) markAsRead(); }} className="relative p-2">
        <Bell size={20} className={unreadCount > 0 ? "text-yellow-500" : "opacity-50"} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        )}
      </button>

      {show && (
        <div className={`absolute right-0 mt-4 w-80 rounded-sm border z-[200] shadow-2xl ${isDark ? "bg-[#0a0a0a] border-white/10" : "bg-white border-slate-200"}`}>
          <div className="p-3 border-b border-inherit flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Notifications</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[10px] opacity-30 uppercase font-bold">No Alerts</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`p-4 border-b border-inherit last:border-0 ${!n.read ? 'bg-yellow-500/5' : ''}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-yellow-500">{n.title}</span>
                    <span className="text-[8px] opacity-30">{new Date(n.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] opacity-70 leading-tight">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}