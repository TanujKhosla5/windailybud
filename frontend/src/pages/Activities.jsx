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
import { Plus, Search, MapPin, Clock, Users, Trash2, X, Trophy } from 'lucide-react';
import { format } from 'date-fns';

export default function Activities() {
  const [activityTypes, setActivityTypes] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, logsRes] = await Promise.all([
        activityTypesApi.getAll(),
        activityLogsApi.getAll()
      ]);
      setActivityTypes(typesRes.data || []);
      setActivityLogs(logsRes.data || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivityTypes([]);
      setActivityLogs([]);
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

  const updatePlayer = (index, value) => {
    const newPlayers = [...newLog.players];
    newPlayers[index] = value;
    setNewLog({ ...newLog, players: newPlayers });
  };

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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteLog(log.id)}
                    className="h-8 w-8 text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
