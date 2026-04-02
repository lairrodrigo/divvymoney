import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Insight {
  icon: string;
  text: string;
}

export default function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!error && data?.insights) {
        setInsights(data.insights);
      }
    } catch (e) {
      console.error('AI insights error:', e);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (!loaded && !loading) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Insights IA</h2>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="p-1.5 rounded-full hover:bg-secondary transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !loaded ? (
        <div className="rounded-xl bg-card p-4 flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Analisando suas finanças...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <div key={i} className="rounded-xl bg-card px-4 py-3 flex gap-3">
              <span className="text-base shrink-0">{insight.icon}</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{insight.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
