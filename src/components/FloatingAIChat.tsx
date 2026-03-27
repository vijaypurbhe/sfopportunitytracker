import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X, Send, Loader2, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

type Message = { role: 'user' | 'assistant'; content: string };

const PAGE_PROMPTS: Record<string, string[]> = {
  '/': ['Summarize my pipeline health', 'Which deals need attention?', 'Show win rate trends'],
  '/pipeline': ['Which stage has the most value?', 'Identify stalled deals', 'Pipeline velocity insights'],
  '/opportunities': ['Find high-risk opportunities', 'Top deals by TCV', 'Deals closing this quarter'],
  '/accounts': ['Top accounts by revenue', 'Account concentration risk', 'New account opportunities'],
  '/gates': ['Pending approvals summary', 'Gate approval bottlenecks', 'Average approval time'],
  '/ai-insights': ['Run full pipeline analysis', 'Competitive landscape', 'Revenue forecast'],
  '/notifications': ['Unread notification summary', 'Recent gate decisions', 'Action items for me'],
  '/settings': ['How to manage user roles?', 'Configure notifications', 'Data export options'],
};

function getPromptsForPath(pathname: string): string[] {
  if (PAGE_PROMPTS[pathname]) return PAGE_PROMPTS[pathname];
  if (pathname.startsWith('/opportunities/')) return ['Analyze this deal', 'Risk factors for this opportunity', 'Recommended next steps'];
  if (pathname.startsWith('/accounts/')) return ['Account health overview', 'Related opportunities', 'Key contacts'];
  return ['How can I help?', 'Pipeline overview', 'Quick insights'];
}

function getPageContext(pathname: string): string {
  if (pathname === '/') return 'User is on the Dashboard viewing pipeline summary metrics.';
  if (pathname === '/pipeline') return 'User is on the Pipeline Kanban board.';
  if (pathname === '/opportunities') return 'User is on the Opportunities list page.';
  if (pathname.startsWith('/opportunities/')) return 'User is viewing a specific opportunity detail page. Use the entity data provided to answer contextually.';
  if (pathname === '/accounts') return 'User is on the Accounts page.';
  if (pathname.startsWith('/accounts/')) return 'User is viewing a specific account detail page. Use the entity data provided to answer contextually.';
  if (pathname === '/gates') return 'User is on the Approval Gates page.';
  if (pathname === '/ai-insights') return 'User is on the AI Insights page.';
  if (pathname === '/notifications') return 'User is on the Notifications page.';
  if (pathname === '/settings') return 'User is on the Settings page.';
  return 'User is browsing the CRM application.';
}

function extractEntityFromPath(pathname: string): { entityType: string; entityId: string } | null {
  const oppMatch = pathname.match(/^\/opportunities\/([^/]+)$/);
  if (oppMatch) return { entityType: 'opportunity', entityId: oppMatch[1] };
  const accMatch = pathname.match(/^\/accounts\/([^/]+)$/);
  if (accMatch) return { entityType: 'account', entityId: accMatch[1] };
  return null;
}

export default function FloatingAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prompts = getPromptsForPath(location.pathname);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: allMessages,
          context: getPageContext(location.pathname),
        },
      });
      if (error) throw error;
      setMessages(prev => [...prev, { role: 'assistant', content: data?.response || 'No response received.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t process that request. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[hsl(217,91%,55%)] to-[hsl(280,65%,55%)] text-white font-medium text-sm shadow-xl shadow-[hsl(217,91%,60%,0.3)] hover:shadow-2xl hover:shadow-[hsl(217,91%,60%,0.4)] hover:-translate-y-0.5 transition-all duration-300"
      >
        <Sparkles className="h-4 w-4" />
        Ask AI
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[520px] flex flex-col rounded-2xl border border-white/20 bg-white/80 backdrop-blur-2xl shadow-2xl shadow-black/15 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[hsl(217,91%,55%)] to-[hsl(280,65%,55%)]">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-4 w-4" />
          <span className="font-semibold text-sm">AI Assistant</span>
        </div>
        <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs font-medium">Suggested for this page</span>
            </div>
            {prompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm bg-white/60 border border-white/30 hover:bg-[hsl(217,91%,60%,0.08)] hover:border-[hsl(217,91%,60%,0.2)] text-foreground transition-all duration-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[hsl(217,91%,60%)] text-white rounded-br-md'
                : 'bg-white/70 border border-white/30 text-foreground rounded-bl-md'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-p:text-[13px] prose-strong:text-foreground prose-ul:my-1 prose-li:my-0.5 prose-headings:text-sm prose-headings:font-semibold prose-headings:mt-2 prose-headings:mb-1 prose-table:text-[12px] prose-th:px-2 prose-th:py-1 prose-th:bg-muted/30 prose-td:px-2 prose-td:py-1 prose-code:text-[12px] prose-code:bg-muted/40 prose-code:px-1 prose-code:rounded">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-white/70 border border-white/30">
              <Loader2 className="h-4 w-4 animate-spin text-[hsl(217,91%,60%)]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/30">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Ask anything about your pipeline..."
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm border border-border/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[hsl(217,91%,60%,0.3)] focus:border-[hsl(217,91%,60%,0.5)]"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-[hsl(217,91%,60%)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
