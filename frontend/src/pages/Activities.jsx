import { useState, useEffect } from 'react';
import { activityTypesApi, activityLogsApi } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Plus, Search, MapPin, Clock, Users, Trash2, X, Trophy, TrendingUp, Pencil } from 'lucide-react';
import { format, startOfMonth, isAfter } from 'date-fns';

export default function Activities() {
  const [activityTypes, setActivityTypes] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTypeDialogOpen, setNewTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [searchActivity, setSearchActivity] = useState('all');
  const [searchPlayer, setSearchPlayer] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [newLog, setNewLog] = useState({
    activity_type_id: '',
    activity_date: new Date(),
    location: '',
    duration_minutes: '',
    players: ['', '', '', '']
  });

  const [editingLog, setEditingLog] = useState(null); // full log object with parsed date + padded players[4]

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, logsRes] = await Promise.all([
        activityTypesApi.getAll(),
        activityLogsApi.getAll()
      ]);
      setActivityTypes(typesRes.data || []);
      setActivityLogs(logsRes.data || []);
      setAllLogs(logsRes.data || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivityTypes([]);
      setActivityLogs([]);
      setAllLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchActivity && searchActivity !== 'all') params.activity_type_id = searchActivity;
      if (searchPlayer) params.player = searchPlayer;
      if (searchLocation) params.location = searchLocation;
      const res = await activityLogsApi.getAll(params);
      setActivityLogs(res.data || []);
    } catch (error) {
      toast.error('Search failed');
    }
    setLoading(false);
  };

  const clearSearch = () => {
    setSearchActivity('all');
    setSearchPlayer('');
    setSearchLocation('');
    fetchData();
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await activityTypesApi.create({ name: newTypeName.trim() });
      setNewTypeName('');
      setNewTypeDialogOpen(false);
      fetchData();
      toast.success('Activity type added');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create activity type');
    }
  };

  const handleCreateLog = async () => {
    if (!newLog.activity_type_id) {
      toast.error('Please select an activity');
      return;
    }
    try {
      const players = newLog.players.filter(p => p.trim());
      await activityLogsApi.create({
        activity_type_id: newLog.activity_type_id,
        activity_date: format(newLog.activity_date, 'yyyy-MM-dd'),
        location: newLog.location || null,
        duration_minutes: newLog.duration_minutes ? parseInt(newLog.duration_minutes) : null,
        players
      });
      setDialogOpen(false);
      setNewLog({
        activity_type_id: '',
        activity_date: new Date(),
        location: '',
        duration_minutes: '',
        players: ['', '', '', '']
      });
      fetchData();
      toast.success('Activity logged');
    } catch (error) {
      toast.error('Failed to log activity');
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      await activityLogsApi.delete(logId);
      fetchData();
      toast.success('Activity deleted');
    } catch (error) {
      toast.error('Failed to delete activity');
    }
  };

  const openEditLog = (log) => {
    const paddedPlayers = [...(log.players || [])];
    while (paddedPlayers.length < 4) paddedPlayers.push('');
    setEditingLog({
      id: log.id,
      activity_type_id: log.activity_type_id,
      activity_date: new Date(log.activity_date + 'T00:00:00'),
      location: log.location || '',
      duration_minutes: log.duration_minutes ? String(log.duration_minutes) : '',
      players: paddedPlayers.slice(0, 4),
    });
  };

  const handleUpdateLog = async () => {
    if (!editingLog) return;
    try {
      const players = editingLog.players.filter(p => p.trim());
      await activityLogsApi.update(editingLog.id, {
        activity_date: format(editingLog.activity_date, 'yyyy-MM-dd'),
        location: editingLog.location || null,
        duration_minutes: editingLog.duration_minutes ? parseInt(editingLog.duration_minutes) : null,
        players,
      });
      setEditingLog(null);
      fetchData();
      toast.success('Activity updated');
    } catch (error) {
      toast.error('Failed to update activity');
    }
  };

  const updateEditPlayer = (index, value) => {
    const newPlayers = [...editingLog.players];
    newPlayers[index] = value;
    setEditingLog({ ...editingLog, players: newPlayers });
  };

  const updatePlayer = (index, value) => {
    const newPlayers = [...newLog.players];
    newPlayers[index] = value;
    setNewLog({ ...newLog, players: newPlayers });
  };

  // Compute this-month stats from allLogs (stats ignore current search filters)
  const monthStart = startOfMonth(new Date());
  const monthLogs = allLogs.filter(l => {
    const d = new Date(l.activity_date);
    return isAfter(d, monthStart) || d.getTime() === monthStart.getTime() ||
      (d.getFullYear() === monthStart.getFullYear() && d.getMonth() === monthStart.getMonth());
  });

  const totalMinutes = monthLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const byActivity = monthLogs.reduce((acc, l) => {
    const key = l.activity_type_name || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topActivities = Object.entries(byActivity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const playerCounts = monthLogs.reduce((acc, l) => {
    (l.players || []).forEach(p => {
      const name = (p || '').trim();
      if (name) acc[name] = (acc[name] || 0) + 1;
    });
    return acc;
  }, {});
  const topPartnerEntry = Object.entries(playerCounts).sort((a, b) => b[1] - a[1])[0];
  const topPartner = topPartnerEntry ? `${topPartnerEntry[0]} (${topPartnerEntry[1]})` : null;

  const monthLabel = format(new Date(), 'MMMM yyyy');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-100 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Activities
          </h1>
          <p className="text-sm text-zinc-500">{activityLogs.length} activities logged</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newTypeDialogOpen} onOpenChange={setNewTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-zinc-700">
                <Plus className="w-4 h-4 mr-2" /> Add New Sport
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Add New Activity Type</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-300">Name</Label>
                  <Input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g., Tennis, Golf..."
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewTypeDialogOpen(false)} className="border-zinc-700">Cancel</Button>
                  <Button onClick={handleCreateType} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">Add</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
                <Plus className="w-4 h-4 mr-2" /> Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Log Activity</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-300">Activity *</Label>
                  <Select value={newLog.activity_type_id} onValueChange={(v) => setNewLog({ ...newLog, activity_type_id: v })}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue placeholder="Select activity" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {activityTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-zinc-300">Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-zinc-950 border-zinc-800 text-zinc-400">
                        {format(newLog.activity_date, 'MMM d, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                      <Calendar
                        mode="single"
                        selected={newLog.activity_date}
                        onSelect={(date) => date && setNewLog({ ...newLog, activity_date: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label className="text-zinc-300">Location (optional)</Label>
                  <Input
                    value={newLog.location}
                    onChange={(e) => setNewLog({ ...newLog, location: e.target.value })}
                    placeholder="e.g., City Sports Club"
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>
                
                <div>
                  <Label className="text-zinc-300">Duration in minutes (optional)</Label>
                  <Input
                    type="number"
                    value={newLog.duration_minutes}
                    onChange={(e) => setNewLog({ ...newLog, duration_minutes: e.target.value })}
                    placeholder="e.g., 60"
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>
                
                <div>
                  <Label className="text-zinc-300">Other Players (up to 4)</Label>
                  <div className="space-y-2 mt-2">
                    {[0, 1, 2, 3].map(index => (
                      <Input
                        key={index}
                        value={newLog.players[index]}
                        onChange={(e) => updatePlayer(index, e.target.value)}
                        placeholder={`Player ${index + 1}`}
                        className="bg-zinc-950 border-zinc-800"
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700">Cancel</Button>
                  <Button onClick={handleCreateLog} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">Log Activity</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800" data-testid="activities-stats-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> This month · {monthLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthLogs.length === 0 ? (
            <p className="text-sm text-zinc-500">No activities logged this month yet. Log one to see your stats.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1" data-testid="stat-sessions">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Sessions</p>
                <p className="text-2xl font-semibold text-zinc-100">{monthLogs.length}</p>
              </div>
              <div className="space-y-1" data-testid="stat-hours">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Total time</p>
                <p className="text-2xl font-semibold text-zinc-100">
                  {totalMinutes > 0 ? `${totalHours}h` : '—'}
                </p>
              </div>
              <div className="space-y-1" data-testid="stat-top-activity">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Top activities</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {topActivities.map(([name, count]) => (
                    <span key={name} className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-xs font-medium">
                      {name} · {count}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-1" data-testid="stat-top-partner">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Most-frequent partner</p>
                <p className="text-base font-medium text-zinc-100 truncate">
                  {topPartner || <span className="text-zinc-500 text-sm font-normal">Solo sessions only</span>}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
            <Search className="w-4 h-4" /> Search Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label className="text-zinc-400 text-xs">Activity</Label>
              <Select value={searchActivity} onValueChange={setSearchActivity}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                  <SelectValue placeholder="All activities" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all">All activities</SelectItem>
                  {activityTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Player Name</Label>
              <Input
                value={searchPlayer}
                onChange={(e) => setSearchPlayer(e.target.value)}
                placeholder="Search by player..."
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Location</Label>
              <Input
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Search by location..."
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="bg-zinc-700 hover:bg-zinc-600">
                <Search className="w-4 h-4 mr-2" /> Search
              </Button>
              <Button onClick={clearSearch} variant="outline" className="border-zinc-700">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {activityLogs.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No activities logged yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activityLogs.map(log => (
            <Card key={log.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">
                        {log.activity_type_name}
                      </span>
                      <span className="text-zinc-400 text-sm">
                        {format(new Date(log.activity_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                      {log.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {log.location}
                        </span>
                      )}
                      {log.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {log.duration_minutes} min
                        </span>
                      )}
                      {log.players && log.players.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {log.players.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditLog(log)}
                      className="h-8 w-8 text-zinc-500 hover:text-amber-400"
                      data-testid={`edit-log-${log.id}`}
                      title="Edit activity"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLog(log.id)}
                      className="h-8 w-8 text-zinc-500 hover:text-red-400"
                      data-testid={`delete-log-${log.id}`}
                      title="Delete activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Activity Log Dialog */}
      <Dialog open={!!editingLog} onOpenChange={(v) => { if (!v) setEditingLog(null); }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Edit Activity</DialogTitle>
          </DialogHeader>
          {editingLog && (
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300">Activity</Label>
                <div className="mt-1.5 px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-400 text-sm">
                  {activityTypes.find(t => t.id === editingLog.activity_type_id)?.name || 'Unknown'}
                  <span className="ml-2 text-xs text-zinc-600">(activity type cannot be changed)</span>
                </div>
              </div>

              <div>
                <Label className="text-zinc-300">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-zinc-950 border-zinc-800 text-zinc-400" data-testid="edit-log-date-btn">
                      {format(editingLog.activity_date, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                    <Calendar
                      mode="single"
                      selected={editingLog.activity_date}
                      onSelect={(date) => date && setEditingLog({ ...editingLog, activity_date: date })}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-zinc-300">Location (optional)</Label>
                <Input
                  value={editingLog.location}
                  onChange={(e) => setEditingLog({ ...editingLog, location: e.target.value })}
                  placeholder="e.g., City Sports Club"
                  className="bg-zinc-950 border-zinc-800"
                  data-testid="edit-log-location"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Duration in minutes (optional)</Label>
                <Input
                  type="number"
                  value={editingLog.duration_minutes}
                  onChange={(e) => setEditingLog({ ...editingLog, duration_minutes: e.target.value })}
                  placeholder="e.g., 60"
                  className="bg-zinc-950 border-zinc-800"
                  data-testid="edit-log-duration"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Other Players (up to 4)</Label>
                <div className="space-y-2 mt-2">
                  {[0, 1, 2, 3].map(index => (
                    <Input
                      key={index}
                      value={editingLog.players[index]}
                      onChange={(e) => updateEditPlayer(index, e.target.value)}
                      placeholder={`Player ${index + 1}`}
                      className="bg-zinc-950 border-zinc-800"
                      data-testid={`edit-log-player-${index}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingLog(null)} className="border-zinc-700">Cancel</Button>
                <Button onClick={handleUpdateLog} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200" data-testid="save-edit-log-btn">
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
