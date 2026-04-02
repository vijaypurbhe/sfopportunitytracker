import { useState } from 'react';
import { useActivityLogs, useCreateActivityLog, useDeleteActivityLog } from '@/hooks/useActivityLogs';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, MessageSquare, Phone, Mail, Users, FileText } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

const ACTIVITY_TYPES = [
  { value: 'note', label: 'Note', icon: FileText },
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'update', label: 'Status Update', icon: MessageSquare },
];

function getActivityIcon(type: string) {
  const found = ACTIVITY_TYPES.find(t => t.value === type);
  const Icon = found?.icon || FileText;
  return <Icon className="h-4 w-4" />;
}

function getActivityColor(type: string) {
  const colors: Record<string, string> = {
    note: 'bg-muted text-muted-foreground',
    call: 'bg-green-100 text-green-800',
    email: 'bg-blue-100 text-blue-800',
    meeting: 'bg-purple-100 text-purple-800',
    update: 'bg-orange-100 text-orange-800',
  };
  return colors[type] || colors.note;
}

export default function ActivityLogTab({ opportunityId }: { opportunityId: string }) {
  const { user } = useAuth();
  const { data: logs, isLoading } = useActivityLogs(opportunityId);
  const createLog = useCreateActivityLog();
  const deleteLog = useDeleteActivityLog();

  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [activityType, setActivityType] = useState('note');
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    try {
      await createLog.mutateAsync({
        opportunity_id: opportunityId,
        user_id: user.id,
        activity_type: activityType,
        content: content.trim(),
        activity_date: activityDate,
      });
      setContent('');
      setActivityType('note');
      setActivityDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      toast.success('Activity logged');
    } catch (err: any) {
      toast.error('Failed to log activity: ' + err.message);
    }
  };

  const handleDelete = async (logId: string) => {
    try {
      await deleteLog.mutateAsync({ id: logId, opportunityId });
      toast.success('Activity deleted');
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{logs?.length || 0} activities logged</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> Log Activity
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                <Input type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)} />
              </div>
            </div>
            <Textarea
              placeholder="Describe the activity or progress made..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || createLog.isPending}>
                {createLog.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !logs?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No activities logged yet. Click "Log Activity" to add your first entry.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-md ${getActivityColor(log.activity_type)}`}>
                      {getActivityIcon(log.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs capitalize">{log.activity_type}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(log.activity_date)}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{log.content}</p>
                    </div>
                  </div>
                  {user?.id === log.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleDelete(log.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
