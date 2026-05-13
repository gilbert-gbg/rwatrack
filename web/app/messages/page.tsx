"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, Users, MessageSquare, Megaphone, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  user: { id: string; firstName: string; lastName: string; avatar?: string; role: string };
  lastMessage: string;
  lastTime: string;
  unread: number;
}

interface Msg {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string; avatar?: string; role: string };
}

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [broadcasts, setBroadcasts] = useState<Msg[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchData = async () => {
    try {
      const [userRes, msgRes, usersRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/messages"),
        fetch("/api/admin/users").catch(() => null),
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (msgRes.ok) {
        const data = await msgRes.json();
        setContacts(data.conversations || []);
        setBroadcasts(data.broadcasts || []);
      }
      if (usersRes?.ok) {
        const users = await usersRes.json();
        setAvailableContacts(Array.isArray(users) ? users : []);
      }
    } catch {}
    setLoading(false);
  };

  const openChat = async (contact: any) => {
    setSelectedContact(contact);
    try {
      const res = await fetch(`/api/messages?chatWith=${contact.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedContact) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: selectedContact.id, content: newMsg.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMsg("");
      }
    } catch {}
    setSending(false);
  };

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setSending(true);
    const target = user?.role === "HR" ? "ALL_WORKERS" : "ALL_HR";
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: broadcastMsg.trim(), broadcast: true, broadcastTo: target }),
      });
      if (res.ok) {
        toast({ title: "Broadcast Sent!", description: `Message sent to all ${target === "ALL_WORKERS" ? "workers" : "HR managers"}` });
        setBroadcastMsg("");
        setShowBroadcast(false);
      }
    } catch {}
    setSending(false);
  };

  const dashboardPath = user?.role === "ADMIN" ? "/admin" : user?.role === "HR" ? "/hr" : "/worker";

  // Filter available contacts based on role
  const filteredContacts = availableContacts.filter((u) => {
    if (!user) return false;
    if (u.id === user.id) return false;
    if (user.role === "WORKER") return u.role === "HR";
    if (user.role === "HR") return u.role === "ADMIN" || u.role === "WORKER";
    if (user.role === "ADMIN") return u.role === "HR";
    return false;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
      <header className="border-b border-blue-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={dashboardPath} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="font-bold text-lg">Messages</h1>
          {(user?.role === "HR" || user?.role === "ADMIN") && (
            <Button size="sm" variant="outline" onClick={() => setShowBroadcast(!showBroadcast)}>
              <Megaphone className="w-4 h-4 mr-1" />
              Broadcast
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Broadcast section */}
        {showBroadcast && (
          <Card className="border-blue-200 dark:border-gray-700 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                Send Broadcast to All {user?.role === "HR" ? "Workers in Your Department" : "HR Managers"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Type your broadcast message..."
                  onKeyDown={(e) => e.key === "Enter" && sendBroadcast()}
                />
                <Button onClick={sendBroadcast} disabled={sending || !broadcastMsg.trim()}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6" style={{ minHeight: "60vh" }}>
          {/* Contact list */}
          <Card className="border-blue-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" /> Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {/* Existing conversations */}
                {contacts.map((c) => (
                  <button
                    key={c.user.id}
                    onClick={() => openChat(c.user)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-gray-800 border-b border-blue-50 dark:border-gray-800 transition text-left ${
                      selectedContact?.id === c.user.id ? "bg-blue-50 dark:bg-gray-800" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">{c.user.firstName[0]}{c.user.lastName[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate">{c.user.firstName} {c.user.lastName}</p>
                        {c.unread > 0 && (
                          <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{c.unread}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                    </div>
                  </button>
                ))}

                {/* New contacts */}
                {filteredContacts.filter((u) => !contacts.find((c) => c.user.id === u.id)).length > 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground font-semibold border-b">New Conversation</div>
                )}
                {filteredContacts
                  .filter((u) => !contacts.find((c) => c.user.id === u.id))
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => openChat(u)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-gray-800 border-b border-blue-50 dark:border-gray-800 transition text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-500 font-bold text-sm">{u.firstName?.[0]}{u.lastName?.[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">{u.role}</Badge>
                      </div>
                    </button>
                  ))}

                {contacts.length === 0 && filteredContacts.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground text-sm">No contacts available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat area */}
          <Card className="border-blue-200 dark:border-gray-700 lg:col-span-2 flex flex-col">
            {selectedContact ? (
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{selectedContact.firstName[0]}{selectedContact.lastName[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{selectedContact.firstName} {selectedContact.lastName}</p>
                      <Badge variant="outline" className="text-[10px]">{selectedContact.role}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground text-sm py-12">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        No messages yet. Say hello!
                      </div>
                    )}
                    {messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? "bg-primary text-white rounded-br-md"
                              : "bg-gray-100 dark:bg-gray-800 text-foreground rounded-bl-md"
                          }`}>
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-muted-foreground"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t p-3 flex gap-2">
                    <Input
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      disabled={sending}
                    />
                    <Button onClick={sendMessage} disabled={sending || !newMsg.trim()} size="icon">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">Select a contact to start chatting</p>
                  <p className="text-sm mt-1">Choose someone from the left panel</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Broadcast messages received */}
        {broadcasts.length > 0 && (
          <Card className="border-blue-200 dark:border-gray-700 mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" /> Broadcast Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {broadcasts.map((b) => (
                <div key={b.id} className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{b.sender?.firstName} {b.sender?.lastName}</span>
                    <Badge variant="outline" className="text-[10px]">{b.sender?.role}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(b.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{b.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
