"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  Sparkles,
  Receipt,
  CreditCard,
  FileText,
  BarChart3,
  Shield,
  Mic,
  Paperclip,
  ChevronRight,
  MessageSquare,
  Zap,
  ArrowRight,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickActions = [
  { label: "Submit expense", icon: Receipt, prompt: "Help me submit a new expense" },
  { label: "Check card balance", icon: CreditCard, prompt: "What is my card balance and spend limit?" },
  { label: "Expense report status", icon: FileText, prompt: "What is the status of my latest expense report?" },
  { label: "Spend summary", icon: BarChart3, prompt: "Show me my spend summary for this month" },
  { label: "Policy check", icon: Shield, prompt: "Will a ₹12,000 dinner expense be approved?" },
  { label: "Request new card", icon: CreditCard, prompt: "I need to request a new virtual card" },
];

const sampleConversation: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm your AI Expense Assistant. I can help you submit expenses, check policies, track reimbursements, and more. What would you like to do today?",
    timestamp: new Date(),
  },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(sampleConversation);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);

    const responses: Record<string, string> = {
      "Help me submit a new expense": "Sure! Let me walk you through submitting a new expense.\n\n**Step 1:** Upload your receipt (photo or PDF)\n**Step 2:** I'll extract the details using OCR\n**Step 3:** Review and confirm the category, amount, and GST details\n**Step 4:** Submit for approval\n\nWould you like to upload a receipt now, or enter the details manually?",
      "What is my card balance and spend limit?": "Here are your card details:\n\n**Card ending 1005** (Physical - VISA)\n- Monthly Limit: ₹5,00,000\n- Spent MTD: ₹1,23,450 (24.7%)\n- Available: ₹3,76,550\n\n**Card ending 1006** (Virtual - Mastercard)\n- Monthly Limit: ₹2,00,000\n- Spent MTD: ₹45,200 (22.6%)\n- Available: ₹1,54,800\n\nWould you like to adjust any limits or freeze a card?",
      "What is the status of my latest expense report?": "Your latest expense report:\n\n**EXP-2026-0005** — January Expense Report\n- Status: **Submitted** → Awaiting manager approval\n- Amount: ₹34,250\n- Expenses: 4 items\n- Policy Score: 92% compliant\n- SLA: Approval due in 18 hours\n\nYour manager Deepa Nair was notified on Feb 15. Shall I send a reminder?",
      "Show me my spend summary for this month": "Here's your February 2026 spend summary:\n\n| Category | Amount |\n|----------|--------|\n| Travel - Air | ₹28,500 |\n| Meals | ₹12,350 |\n| Transportation | ₹5,200 |\n| Software | ₹3,999 |\n\n**Total: ₹50,049**\n\nThat's 15% higher than January. Your top merchant is IndiGo Airlines (₹28,500). Need a detailed breakdown?",
      "Will a ₹12,000 dinner expense be approved?": "Let me check the applicable policies...\n\n⚠️ **Soft Violation Detected**\n\nPolicy: *Meal Expense Cap*\n- Limit: ₹5,000 per meal\n- Your amount: ₹12,000\n- Severity: **SOFT** (Warning only, not blocked)\n\n✅ The expense **will be submitted** but flagged with a warning. Your approver will see the policy violation.\n\n**Tip:** If this is a client entertainment expense, categorize it as \"Client Entertainment\" instead — it has different limits and requires HOD + Finance approval.",
      "I need to request a new virtual card": "I can help you request a virtual card! Here's what I need:\n\n1. **Purpose:** What will this card be used for?\n2. **Spend Limit:** Suggested monthly limit?\n3. **Duration:** Ongoing or single-use?\n4. **MCC Restrictions:** Any specific merchant categories?\n\nOr I can use your default profile settings. Shall I proceed with defaults?\n\n*Default: ₹2,00,000/month, all categories, ongoing*",
    };

    setTimeout(() => {
      const response = responses[userMessage] ||
        "I understand you're asking about: \"" + userMessage + "\"\n\nI can help with:\n- **Expense submission** and receipt scanning\n- **Policy checks** before submitting\n- **Card management** (balance, limits, freeze)\n- **Report status** tracking\n- **Spend analytics** and summaries\n- **Reimbursement** status\n\nCould you be more specific about what you need?";

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = (message?: string) => {
    const text = message || input.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        role: "user",
        content: text,
        timestamp: new Date(),
      },
    ]);
    setInput("");
    simulateResponse(text);
  };

  return (
    <div className="space-y-6 animate-in h-[calc(100vh-8rem)]">
      <PageHeader title="AI Expense Assistant" description="Intelligent Service — powered by AI">
        <Badge variant="outline" className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Intelligent Service
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100%-4rem)]">
        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={msg.role === "assistant" ? "bg-primary/10 text-primary" : "bg-muted"}>
                        {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : "VS"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-lg px-4 py-2.5 max-w-[80%] text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <span className="text-[9px] opacity-50 mt-1 block">
                        {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick actions (show when few messages) */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 justify-start text-xs"
                      onClick={() => handleSend(action.prompt)}
                    >
                      <action.icon className="w-3.5 h-3.5 mr-2 shrink-0" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Ask about expenses, cards, policies, reports..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button onClick={() => handleSend()} disabled={!input.trim()} className="shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4 hidden lg:block">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                {[
                  "Submit expenses with receipt OCR",
                  "Policy pre-check before submission",
                  "Card balance & spend tracking",
                  "Expense report status tracking",
                  "Spend analytics & summaries",
                  "Virtual card request",
                  "Reimbursement status",
                  "Category suggestions via AI",
                ].map((cap) => (
                  <div key={cap} className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">{cap}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                Teams Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Use the expense bot in Microsoft Teams to submit expenses and approve reports on the go.
              </p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Teams Commands:</p>
                <code className="block bg-muted rounded px-2 py-1 text-[10px]">/expense submit</code>
                <code className="block bg-muted rounded px-2 py-1 text-[10px]">/expense approve [ID]</code>
                <code className="block bg-muted rounded px-2 py-1 text-[10px]">/expense status</code>
                <code className="block bg-muted rounded px-2 py-1 text-[10px]">/expense balance</code>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                Install Teams App
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
