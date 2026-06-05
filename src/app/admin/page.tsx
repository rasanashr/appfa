'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Disc3,
  Music2,
  ListMusic,
  Plus,
  Pencil,
  Trash2,
  Search,
  TrendingUp,
  Headphones,
  BarChart3,
  Loader2,
  ChevronLeft,
  Upload,
  Link,
  LogOut,
  Eye,
  EyeOff,
  FileAudio,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatPlayCount, formatListeners } from '@/lib/types';

// ─── Types ───────────────────────────────────────────────
interface AdminStats {
  totalArtists: number; totalAlbums: number; totalTracks: number; totalPlaylists: number; totalPlayCount: number;
  topTracks: { id: string; title: string; playCount: number; artist: { id: string; name: string }; album: { id: string; title: string } | null }[];
  topArtists: { id: string; name: string; imageUrl: string; monthlyListeners: number }[];
  recentTracks: { id: string; title: string; createdAt: string; artist: { id: string; name: string } }[];
}
interface ArtistItem { id: string; name: string; imageUrl: string; bio: string; monthlyListeners: number; _count?: { albums: number; tracks: number }; }
interface AlbumItem { id: string; title: string; coverUrl: string; releaseYear: number; artistId: string; artist: { id: string; name: string; imageUrl: string }; _count?: { tracks: number }; }
interface TrackItem { id: string; title: string; duration: number; audioUrl: string; coverUrl: string; albumId: string | null; artistId: string; playCount: number; genre: string; artist: { id: string; name: string; imageUrl: string }; album: { id: string; title: string; coverUrl: string } | null; }
interface PlaylistItem { id: string; title: string; description: string; coverUrl: string; isPublic: boolean; createdAt: string; _count?: { tracks: number }; }

type AdminTab = 'dashboard' | 'artists' | 'albums' | 'tracks' | 'playlists';

// ─── Helpers ─────────────────────────────────────────────
function toPersianNum(n: number): string { return new Intl.NumberFormat('fa-IR').format(n); }

async function uploadFile(file: File, type: 'image' | 'audio'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'خطا در آپلود فایل'); }
  const data = await res.json();
  return data.url;
}

// ─── Image Upload Component ──────────────────────────────
function ImageUploadField({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const url = await uploadFile(file, 'image'); onChange(url); }
    catch (err) { alert(err instanceof Error ? err.message : 'خطا در آپلود'); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <Label className="text-[#a7a7a7]">{label}</Label>
      <div className="flex items-center gap-3">
        {value && (
          <div className="size-12 rounded-lg overflow-hidden bg-[#282828] shrink-0 border border-[#404040]">
            <img src={value} alt="preview" className="size-full object-cover" />
          </div>
        )}
        <div className="flex-1 flex flex-col gap-2">
          <Button type="button" variant="outline" size="sm" className="bg-[#181818] border-[#404040] text-[#a7a7a7] hover:text-white gap-1.5 w-fit" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            {uploading ? 'در حال آپلود...' : 'آپلود تصویر'}
          </Button>
          <div className="flex items-center gap-2">
            <Link className="size-3.5 text-[#666] shrink-0" />
            <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="یا آدرس URL تصویر" className="bg-[#181818] border-[#404040] text-xs h-8" dir="ltr" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
}

// ─── Audio Upload Component ──────────────────────────────
function AudioUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const url = await uploadFile(file, 'audio'); onChange(url); }
    catch (err) { alert(err instanceof Error ? err.message : 'خطا در آپلود'); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <Label className="text-[#a7a7a7]">فایل صوتی</Label>
      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" size="sm" className="bg-[#181818] border-[#404040] text-[#a7a7a7] hover:text-white gap-1.5 w-fit" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <FileAudio className="size-3.5" />}
          {uploading ? 'در حال آپلود...' : 'آپلود فایل صوتی'}
        </Button>
        <div className="flex items-center gap-2">
          <Link className="size-3.5 text-[#666] shrink-0" />
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="یا آدرس URL فایل صوتی" className="bg-[#181818] border-[#404040] text-xs h-8" dir="ltr" />
        </div>
        {value && <p className="text-xs text-[#1db954] truncate" dir="ltr">{value}</p>}
      </div>
      <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

// ─── Login Screen ────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'خطا در ورود'); return; }
      onLogin();
    } catch { setError('خطا در ارتباط با سرور'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212]" dir="rtl">
      <Card className="w-full max-w-md mx-4 bg-[#181818] border-[#282828]">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center size-16 rounded-full bg-[#1db954]">
              <BarChart3 className="size-8 text-black" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">ورود به پنل مدیریت</CardTitle>
          <p className="text-[#a7a7a7] text-sm mt-1">پلتفرم ملودی</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label className="text-[#a7a7a7]">نام کاربری</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-[#282828] border-[#404040] text-white" placeholder="نام کاربری" /></div>
            <div className="space-y-2"><Label className="text-[#a7a7a7]">رمز عبور</Label><div className="relative"><Input value={password} onChange={(e) => setPassword(e.target.value)} type={showPass ? 'text' : 'password'} className="bg-[#282828] border-[#404040] text-white pl-10" placeholder="رمز عبور" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a7a7a7] hover:text-white">{showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-medium" disabled={loading || !username || !password}>{loading ? <Loader2 className="size-4 animate-spin" /> : 'ورود'}</Button>
          </form>
          <div className="mt-4 text-center"><a href="/" className="text-[#a7a7a7] hover:text-[#1db954] text-sm transition-colors">بازگشت به سایت</a></div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Admin Page ─────────────────────────────────────
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  useEffect(() => {
    fetch('/api/admin/auth').then((r) => r.json()).then((data) => setAuthenticated(data.authenticated === true)).catch(() => setAuthenticated(false)).finally(() => setChecking(false));
  }, []);

  const handleLogin = () => setAuthenticated(true);
  const handleLogout = async () => { await fetch('/api/admin/auth', { method: 'DELETE' }); setAuthenticated(false); };

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-[#121212]"><Loader2 className="size-8 text-[#1db954] animate-spin" /></div>;
  if (!authenticated) return <LoginScreen onLogin={handleLogin} />;

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'artists', label: 'خواننده‌ها', icon: Users },
    { id: 'albums', label: 'آلبوم‌ها', icon: Disc3 },
    { id: 'tracks', label: 'آهنگ‌ها', icon: Music2 },
    { id: 'playlists', label: 'پلی‌لیست‌ها', icon: ListMusic },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white" dir="rtl">
      <ScrollArea className="h-screen">
        <div className="p-4 md:p-6 lg:p-8 pb-12 max-w-7xl mx-auto">
          <div className="relative -m-4 md:-m-6 lg:-m-8 mb-0 p-4 md:p-6 lg:p-8 pb-6 bg-gradient-to-b from-[#1a1a2e] to-[#121212]">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3"><BarChart3 className="size-8 text-[#1db954]" />پنل مدیریت</h1>
                <p className="text-[#a7a7a7] text-sm mt-1">مدیریت و کنترل پلتفرم ملودی</p>
              </div>
              <div className="flex items-center gap-2">
                <a href="/"><Button variant="ghost" className="text-[#a7a7a7] hover:text-white">بازگشت به سایت<ChevronLeft className="size-4 mr-1" /></Button></a>
                <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={handleLogout}><LogOut className="size-4 ml-1.5" />خروج</Button>
              </div>
            </div>
            <div className="flex gap-1 mt-6 overflow-x-auto scrollbar-hidden">
              {tabs.map((tab) => { const Icon = tab.icon; const isActive = activeTab === tab.id; return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-[#1db954] text-black' : 'bg-white/5 text-[#a7a7a7] hover:bg-white/10 hover:text-white'}`}><Icon className="size-4" />{tab.label}</button>
              ); })}
            </div>
          </div>
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'artists' && <ArtistsTab />}
          {activeTab === 'albums' && <AlbumsTab />}
          {activeTab === 'tracks' && <TracksTab />}
          {activeTab === 'playlists' && <PlaylistsTab />}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Dashboard Tab ───────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/admin/stats').then((r) => r.json()).then(setStats).catch(console.error).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingSpinner />;
  if (!stats) return <div className="text-[#a7a7a7] text-center py-8">خطا در بارگذاری آمار</div>;

  const statCards = [
    { label: 'خواننده‌ها', value: stats.totalArtists, icon: Users, color: 'from-emerald-500/20 to-emerald-900/20', accent: 'text-emerald-400' },
    { label: 'آلبوم‌ها', value: stats.totalAlbums, icon: Disc3, color: 'from-purple-500/20 to-purple-900/20', accent: 'text-purple-400' },
    { label: 'آهنگ‌ها', value: stats.totalTracks, icon: Music2, color: 'from-orange-500/20 to-orange-900/20', accent: 'text-orange-400' },
    { label: 'پلی‌لیست‌ها', value: stats.totalPlaylists, icon: ListMusic, color: 'from-cyan-500/20 to-cyan-900/20', accent: 'text-cyan-400' },
    { label: 'کل پخش', value: stats.totalPlayCount, icon: Headphones, color: 'from-pink-500/20 to-pink-900/20', accent: 'text-pink-400', format: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => { const Icon = card.icon; return (
          <Card key={card.label} className="bg-[#181818] border-[#282828]"><CardContent className="p-4"><div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${card.color} mb-3`}><Icon className={`size-5 ${card.accent}`} /></div><p className="text-2xl font-bold text-white">{card.format ? formatPlayCount(card.value) : toPersianNum(card.value)}</p><p className="text-xs text-[#a7a7a7] mt-1">{card.label}</p></CardContent></Card>
        ); })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#181818] border-[#282828]"><CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2 text-base"><TrendingUp className="size-5 text-[#1db954]" />محبوب‌ترین آهنگ‌ها</CardTitle></CardHeader><CardContent><div className="space-y-3">{stats.topTracks.map((t, i) => (<div key={t.id} className="flex items-center gap-3 text-sm"><span className="text-[#a7a7a7] w-6 text-center font-medium">{toPersianNum(i + 1)}</span><div className="flex-1 min-w-0"><p className="text-white truncate">{t.title}</p><p className="text-[#a7a7a7] text-xs truncate">{t.artist.name}</p></div><span className="text-[#a7a7a7] text-xs">{formatPlayCount(t.playCount)} پخش</span></div>))}</div></CardContent></Card>
        <Card className="bg-[#181818] border-[#282828]"><CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2 text-base"><Users className="size-5 text-[#1db954]" />خواننده‌های برتر</CardTitle></CardHeader><CardContent><div className="space-y-3">{stats.topArtists.map((a, i) => (<div key={a.id} className="flex items-center gap-3 text-sm"><span className="text-[#a7a7a7] w-6 text-center font-medium">{toPersianNum(i + 1)}</span><div className="size-8 rounded-full overflow-hidden bg-[#282828] shrink-0"><img src={a.imageUrl} alt={a.name} className="size-full object-cover" /></div><div className="flex-1 min-w-0"><p className="text-white truncate">{a.name}</p></div><span className="text-[#a7a7a7] text-xs">{formatListeners(a.monthlyListeners)} شنونده</span></div>))}</div></CardContent></Card>
        <Card className="bg-[#181818] border-[#282828] lg:col-span-2"><CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2 text-base"><Music2 className="size-5 text-[#1db954]" />آخرین آهنگ‌های اضافه شده</CardTitle></CardHeader><CardContent><div className="space-y-3">{stats.recentTracks.map((t) => (<div key={t.id} className="flex items-center gap-3 text-sm"><div className="size-8 rounded bg-[#282828] flex items-center justify-center shrink-0"><Music2 className="size-4 text-[#1db954]" /></div><div className="flex-1 min-w-0"><p className="text-white truncate">{t.title}</p><p className="text-[#a7a7a7] text-xs truncate">{t.artist.name}</p></div><span className="text-[#a7a7a7] text-xs">{new Date(t.createdAt).toLocaleDateString('fa-IR')}</span></div>))}</div></CardContent></Card>
      </div>
    </div>
  );
}

// ─── Artists Management Tab ──────────────────────────────
function ArtistsTab() {
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<ArtistItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<ArtistItem | null>(null);
  const [form, setForm] = useState({ name: '', imageUrl: '', bio: '', monthlyListeners: 0 });
  const [saving, setSaving] = useState(false);

  const fetchArtists = useCallback(() => { setLoading(true); const q = search ? `?search=${encodeURIComponent(search)}` : ''; fetch(`/api/artists${q}`).then((r) => r.json()).then(setArtists).catch(console.error).finally(() => setLoading(false)); }, [search]);
  useEffect(() => { fetchArtists(); }, [fetchArtists]);

  const openCreate = () => { setEditingArtist(null); setForm({ name: '', imageUrl: '', bio: '', monthlyListeners: 0 }); setDialogOpen(true); };
  const openEdit = (a: ArtistItem) => { setEditingArtist(a); setForm({ name: a.name, imageUrl: a.imageUrl, bio: a.bio, monthlyListeners: a.monthlyListeners }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = editingArtist ? await fetch(`/api/artists/${editingArtist.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }) : await fetch('/api/artists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(); setDialogOpen(false); fetchArtists();
    } catch { alert('خطا در ذخیره اطلاعات'); } finally { setSaving(false); }
  };
  const handleDelete = async () => { if (!deleteDialog) return; try { await fetch(`/api/artists/${deleteDialog.id}`, { method: 'DELETE' }); setDeleteDialog(null); fetchArtists(); } catch { alert('خطا در حذف خواننده'); } };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#a7a7a7]" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی خواننده..." className="bg-[#282828] border-[#404040] text-white pr-10 placeholder:text-[#666]" /></div>
        <Button onClick={openCreate} className="bg-[#1db954] hover:bg-[#1ed760] text-black gap-2"><Plus className="size-4" />افزودن خواننده</Button>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="rounded-lg border border-[#282828] overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-[#181818] border-b border-[#282828]"><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium">تصویر</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium">نام</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium hidden md:table-cell">شنوندگان</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium hidden lg:table-cell">آلبوم</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium hidden lg:table-cell">آهنگ</th><th className="text-center px-4 py-3 text-[#a7a7a7] font-medium">عملیات</th></tr></thead><tbody>
          {artists.map((a) => (<tr key={a.id} className="border-b border-[#282828] hover:bg-white/5"><td className="px-4 py-3"><div className="size-10 rounded-full overflow-hidden bg-[#282828]"><img src={a.imageUrl} alt={a.name} className="size-full object-cover" /></div></td><td className="px-4 py-3"><p className="text-white font-medium truncate max-w-48">{a.name}</p><p className="text-[#a7a7a7] text-xs truncate max-w-48">{a.bio.slice(0, 40)}</p></td><td className="px-4 py-3 text-[#a7a7a7] hidden md:table-cell">{formatListeners(a.monthlyListeners)}</td><td className="px-4 py-3 text-[#a7a7a7] hidden lg:table-cell">{a._count?.albums ?? 0}</td><td className="px-4 py-3 text-[#a7a7a7] hidden lg:table-cell">{a._count?.tracks ?? 0}</td><td className="px-4 py-3"><div className="flex items-center justify-center gap-1"><Button variant="ghost" size="icon" className="text-[#a7a7a7] hover:text-white size-8" onClick={() => openEdit(a)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" className="text-[#a7a7a7] hover:text-red-400 size-8" onClick={() => setDeleteDialog(a)}><Trash2 className="size-4" /></Button></div></td></tr>))}
          {artists.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[#a7a7a7]">خواننده‌ای یافت نشد</td></tr>}
        </tbody></table></div></div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="bg-[#282828] border-[#404040] text-white max-w-md" dir="rtl"><DialogHeader><DialogTitle>{editingArtist ? 'ویرایش خواننده' : 'افزودن خواننده جدید'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label className="text-[#a7a7a7]">نام خواننده *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#181818] border-[#404040]" /></div>
          <ImageUploadField label="تصویر خواننده" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
          <div className="space-y-2"><Label className="text-[#a7a7a7]">بیوگرافی</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="bg-[#181818] border-[#404040] min-h-20" /></div>
          <div className="space-y-2"><Label className="text-[#a7a7a7]">شنوندگان ماهانه</Label><Input type="number" value={form.monthlyListeners} onChange={(e) => setForm({ ...form, monthlyListeners: parseInt(e.target.value) || 0 })} className="bg-[#181818] border-[#404040]" dir="ltr" /></div>
        </div>
        <DialogFooter className="gap-2"><Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-[#a7a7a7]">انصراف</Button><Button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-[#1db954] hover:bg-[#1ed760] text-black">{saving ? <Loader2 className="size-4 animate-spin" /> : editingArtist ? 'بروزرسانی' : 'ایجاد'}</Button></DialogFooter>
      </DialogContent></Dialog>
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}><AlertDialogContent className="bg-[#282828] border-[#404040] text-white" dir="rtl"><AlertDialogHeader><AlertDialogTitle>حذف خواننده</AlertDialogTitle><AlertDialogDescription className="text-[#a7a7a7]">آیا از حذف &laquo;{deleteDialog?.name}&raquo; مطمئن هستید؟ تمام آثار نیز حذف خواهند شد.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="gap-2"><AlertDialogCancel className="bg-transparent border-[#404040] text-[#a7a7a7] hover:bg-white/5">انصراف</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

// ─── Albums Management Tab ───────────────────────────────
function AlbumsTab() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<AlbumItem | null>(null);
  const [form, setForm] = useState({ title: '', artistId: '', coverUrl: '', releaseYear: 2024 });
  const [saving, setSaving] = useState(false);

  const fetchAlbums = useCallback(() => { setLoading(true); const q = search ? `?search=${encodeURIComponent(search)}` : ''; fetch(`/api/albums${q}`).then((r) => r.json()).then(setAlbums).catch(console.error).finally(() => setLoading(false)); }, [search]);
  useEffect(() => { fetchAlbums(); fetch('/api/artists').then((r) => r.json()).then(setArtists).catch(console.error); }, [fetchAlbums]);

  const openCreate = () => { setEditingAlbum(null); setForm({ title: '', artistId: artists[0]?.id ?? '', coverUrl: '', releaseYear: 2024 }); setDialogOpen(true); };
  const openEdit = (a: AlbumItem) => { setEditingAlbum(a); setForm({ title: a.title, artistId: a.artistId, coverUrl: a.coverUrl, releaseYear: a.releaseYear }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = editingAlbum ? await fetch(`/api/albums/${editingAlbum.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }) : await fetch('/api/albums', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(); setDialogOpen(false); fetchAlbums();
    } catch { alert('خطا در ذخیره اطلاعات'); } finally { setSaving(false); }
  };
  const handleDelete = async () => { if (!deleteDialog) return; try { await fetch(`/api/albums/${deleteDialog.id}`, { method: 'DELETE' }); setDeleteDialog(null); fetchAlbums(); } catch { alert('خطا در حذف آلبوم'); } };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#a7a7a7]" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی آلبوم..." className="bg-[#282828] border-[#404040] text-white pr-10 placeholder:text-[#666]" /></div>
        <Button onClick={openCreate} className="bg-[#1db954] hover:bg-[#1ed760] text-black gap-2"><Plus className="size-4" />افزودن آلبوم</Button>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="rounded-lg border border-[#282828] overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-[#181818] border-b border-[#282828]"><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium">کاور</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium">عنوان</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium">خواننده</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium hidden md:table-cell">سال</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium hidden lg:table-cell">آهنگ</th><th className="text-center px-4 py-3 text-[#a7a7a7] font-medium">عملیات</th></tr></thead><tbody>
          {albums.map((a) => (<tr key={a.id} className="border-b border-[#282828] hover:bg-white/5"><td className="px-4 py-3"><div className="size-10 rounded overflow-hidden bg-[#282828]"><img src={a.coverUrl} alt={a.title} className="size-full object-cover" /></div></td><td className="px-4 py-3 text-white font-medium truncate max-w-48">{a.title}</td><td className="px-4 py-3 text-[#a7a7a7] truncate max-w-32">{a.artist.name}</td><td className="px-4 py-3 text-[#a7a7a7] hidden md:table-cell">{toPersianNum(a.releaseYear)}</td><td className="px-4 py-3 text-[#a7a7a7] hidden lg:table-cell">{a._count?.tracks ?? 0}</td><td className="px-4 py-3"><div className="flex items-center justify-center gap-1"><Button variant="ghost" size="icon" className="text-[#a7a7a7] hover:text-white size-8" onClick={() => openEdit(a)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" className="text-[#a7a7a7] hover:text-red-400 size-8" onClick={() => setDeleteDialog(a)}><Trash2 className="size-4" /></Button></div></td></tr>))}
          {albums.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[#a7a7a7]">آلبومی یافت نشد</td></tr>}
        </tbody></table></div></div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="bg-[#282828] border-[#404040] text-white max-w-md" dir="rtl"><DialogHeader><DialogTitle>{editingAlbum ? 'ویرایش آلبوم' : 'افزودن آلبوم جدید'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label className="text-[#a7a7a7]">عنوان آلبوم *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-[#181818] border-[#404040]" /></div>
          <div className="space-y-2"><Label className="text-[#a7a7a7]">خواننده *</Label><Select value={form.artistId} onValueChange={(v) => setForm({ ...form, artistId: v })}><SelectTrigger className="bg-[#181818] border-[#404040] text-white"><SelectValue placeholder="انتخاب خواننده" /></SelectTrigger><SelectContent className="bg-[#282828] border-[#404040]">{artists.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}</SelectContent></Select></div>
          <ImageUploadField label="کاور آلبوم" value={form.coverUrl} onChange={(url) => setForm({ ...form, coverUrl: url })} />
          <div className="space-y-2"><Label className="text-[#a7a7a7]">سال انتشار</Label><Input type="number" value={form.releaseYear} onChange={(e) => setForm({ ...form, releaseYear: parseInt(e.target.value) || 2024 })} className="bg-[#181818] border-[#404040]" dir="ltr" /></div>
        </div>
        <DialogFooter className="gap-2"><Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-[#a7a7a7]">انصراف</Button><Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.artistId} className="bg-[#1db954] hover:bg-[#1ed760] text-black">{saving ? <Loader2 className="size-4 animate-spin" /> : editingAlbum ? 'بروزرسانی' : 'ایجاد'}</Button></DialogFooter>
      </DialogContent></Dialog>
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}><AlertDialogContent className="bg-[#282828] border-[#404040] text-white" dir="rtl"><AlertDialogHeader><AlertDialogTitle>حذف آلبوم</AlertDialogTitle><AlertDialogDescription className="text-[#a7a7a7]">آیا از حذف آلبوم &laquo;{deleteDialog?.title}&raquo; مطمئن هستید؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="gap-2"><AlertDialogCancel className="bg-transparent border-[#404040] text-[#a7a7a7] hover:bg-white/5">انصراف</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

// ─── Tracks Management Tab ───────────────────────────────
function TracksTab() {
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [albums, setAlbums] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<TrackItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<TrackItem | null>(null);
  const [form, setForm] = useState({ title: '', artistId: '', albumId: '', duration: 200, genre: 'پاپ', coverUrl: '', audioUrl: '', playCount: 0 });
  const [saving, setSaving] = useState(false);
  const genres = ['پاپ', 'سنتی', 'راک', 'پاپ راک', 'کلاسیک', 'جاز', 'بلوز', 'الکترونیک'];

  const fetchTracks = useCallback(() => { setLoading(true); const q = search ? `?search=${encodeURIComponent(search)}` : ''; fetch(`/api/tracks${q}`).then((r) => r.json()).then(setTracks).catch(console.error).finally(() => setLoading(false)); }, [search]);
  useEffect(() => { fetchTracks(); fetch('/api/artists').then((r) => r.json()).then(setArtists).catch(console.error); fetch('/api/albums').then((r) => r.json()).then(setAlbums).catch(console.error); }, [fetchTracks]);

  const openCreate = () => { setEditingTrack(null); setForm({ title: '', artistId: artists[0]?.id ?? '', albumId: '', duration: 200, genre: 'پاپ', coverUrl: '', audioUrl: '', playCount: 0 }); setDialogOpen(true); };
  const openEdit = (t: TrackItem) => { setEditingTrack(t); setForm({ title: t.title, artistId: t.artistId, albumId: t.albumId ?? '', duration: t.duration, genre: t.genre, coverUrl: t.coverUrl, audioUrl: t.audioUrl, playCount: t.playCount }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, albumId: form.albumId === 'none' ? null : form.albumId || null };
    try {
      const res = editingTrack ? await fetch(`/api/tracks/${editingTrack.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }) : await fetch('/api/tracks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(); setDialogOpen(false); fetchTracks();
    } catch { alert('خطا در ذخیره اطلاعات'); } finally { setSaving(false); }
  };
  const handleDelete = async () => { if (!deleteDialog) return; try { await fetch(`/api/tracks/${deleteDialog.id}`, { method: 'DELETE' }); setDeleteDialog(null); fetchTracks(); } catch { alert('خطا در حذف آهنگ'); } };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#a7a7a7]" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی آهنگ..." className="bg-[#282828] border-[#404040] text-white pr-10 placeholder:text-[#666]" /></div>
        <Button onClick={openCreate} className="bg-[#1db954] hover:bg-[#1ed760] text-black gap-2"><Plus className="size-4" />افزودن آهنگ</Button>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="rounded-lg border border-[#282828] overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-[#181818] border-b border-[#282828]"><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium">عنوان</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium">خواننده</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium hidden md:table-cell">آلبوم</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium hidden lg:table-cell">ژانر</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium hidden md:table-cell">پخش</th><th className="text-center px-4 py-3 text-[#a7a7a7] font-medium">عملیات</th></tr></thead><tbody>
          {tracks.map((t) => (<tr key={t.id} className="border-b border-[#282828] hover:bg-white/5"><td className="px-4 py-3"><div className="flex items-center gap-3">{t.coverUrl && <div className="size-8 rounded overflow-hidden bg-[#282828] shrink-0"><img src={t.coverUrl} alt={t.title} className="size-full object-cover" /></div>}<span className="text-white font-medium truncate max-w-40">{t.title}</span></div></td><td className="px-4 py-3 text-[#a7a7a7] truncate max-w-32">{t.artist.name}</td><td className="px-4 py-3 text-[#a7a7a7] truncate max-w-32 hidden md:table-cell">{t.album?.title ?? '—'}</td><td className="px-4 py-3 hidden lg:table-cell"><Badge variant="secondary" className="bg-[#282828] text-[#a7a7a7]">{t.genre}</Badge></td><td className="px-4 py-3 text-[#a7a7a7] hidden md:table-cell">{formatPlayCount(t.playCount)}</td><td className="px-4 py-3"><div className="flex items-center justify-center gap-1"><Button variant="ghost" size="icon" className="text-[#a7a7a7] hover:text-white size-8" onClick={() => openEdit(t)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" className="text-[#a7a7a7] hover:text-red-400 size-8" onClick={() => setDeleteDialog(t)}><Trash2 className="size-4" /></Button></div></td></tr>))}
          {tracks.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[#a7a7a7]">آهنگی یافت نشد</td></tr>}
        </tbody></table></div></div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="bg-[#282828] border-[#404040] text-white max-w-lg" dir="rtl"><DialogHeader><DialogTitle>{editingTrack ? 'ویرایش آهنگ' : 'افزودن آهنگ جدید'}</DialogTitle></DialogHeader>
        <ScrollArea className="max-h-[70vh]"><div className="space-y-4 py-4 px-1">
          <div className="space-y-2"><Label className="text-[#a7a7a7]">عنوان آهنگ *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-[#181818] border-[#404040]" /></div>
          <div className="space-y-2"><Label className="text-[#a7a7a7]">خواننده *</Label><Select value={form.artistId} onValueChange={(v) => setForm({ ...form, artistId: v })}><SelectTrigger className="bg-[#181818] border-[#404040] text-white"><SelectValue placeholder="انتخاب خواننده" /></SelectTrigger><SelectContent className="bg-[#282828] border-[#404040]">{artists.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}</SelectContent></Select></div>
          <div className="space-y-2"><Label className="text-[#a7a7a7]">آلبوم</Label><Select value={form.albumId} onValueChange={(v) => setForm({ ...form, albumId: v })}><SelectTrigger className="bg-[#181818] border-[#404040] text-white"><SelectValue placeholder="بدون آلبوم" /></SelectTrigger><SelectContent className="bg-[#282828] border-[#404040]"><SelectItem value="none">بدون آلبوم</SelectItem>{albums.map((a) => (<SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>))}</SelectContent></Select></div>
          <AudioUploadField value={form.audioUrl} onChange={(url) => setForm({ ...form, audioUrl: url })} />
          <ImageUploadField label="کاور آهنگ" value={form.coverUrl} onChange={(url) => setForm({ ...form, coverUrl: url })} />
          <div className="space-y-2"><Label className="text-[#a7a7a7]">ژانر</Label><Select value={form.genre} onValueChange={(v) => setForm({ ...form, genre: v })}><SelectTrigger className="bg-[#181818] border-[#404040] text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#282828] border-[#404040]">{genres.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-[#a7a7a7]">مدت (ثانیه)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} className="bg-[#181818] border-[#404040]" dir="ltr" /></div><div className="space-y-2"><Label className="text-[#a7a7a7]">تعداد پخش</Label><Input type="number" value={form.playCount} onChange={(e) => setForm({ ...form, playCount: parseInt(e.target.value) || 0 })} className="bg-[#181818] border-[#404040]" dir="ltr" /></div></div>
        </div></ScrollArea>
        <DialogFooter className="gap-2"><Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-[#a7a7a7]">انصراف</Button><Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.artistId} className="bg-[#1db954] hover:bg-[#1ed760] text-black">{saving ? <Loader2 className="size-4 animate-spin" /> : editingTrack ? 'بروزرسانی' : 'ایجاد'}</Button></DialogFooter>
      </DialogContent></Dialog>
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}><AlertDialogContent className="bg-[#282828] border-[#404040] text-white" dir="rtl"><AlertDialogHeader><AlertDialogTitle>حذف آهنگ</AlertDialogTitle><AlertDialogDescription className="text-[#a7a7a7]">آیا از حذف آهنگ &laquo;{deleteDialog?.title}&raquo; مطمئن هستید؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="gap-2"><AlertDialogCancel className="bg-transparent border-[#404040] text-[#a7a7a7] hover:bg-white/5">انصراف</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

// ─── Playlists Management Tab ────────────────────────────
function PlaylistsTab() {
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<PlaylistItem | null>(null);
  const [form, setForm] = useState({ title: '', description: '', coverUrl: '', isPublic: true });
  const [saving, setSaving] = useState(false);

  const fetchPlaylists = useCallback(() => { setLoading(true); fetch('/api/playlists').then((r) => r.json()).then((data: PlaylistItem[]) => setPlaylists(search ? data.filter((p) => p.title.includes(search)) : data)).catch(console.error).finally(() => setLoading(false)); }, [search]);
  useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);

  const openCreate = () => { setEditingPlaylist(null); setForm({ title: '', description: '', coverUrl: '', isPublic: true }); setDialogOpen(true); };
  const openEdit = (p: PlaylistItem) => { setEditingPlaylist(p); setForm({ title: p.title, description: p.description, coverUrl: p.coverUrl, isPublic: p.isPublic }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = editingPlaylist ? await fetch(`/api/playlists/${editingPlaylist.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }) : await fetch('/api/playlists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(); setDialogOpen(false); fetchPlaylists();
    } catch { alert('خطا در ذخیره اطلاعات'); } finally { setSaving(false); }
  };
  const handleDelete = async () => { if (!deleteDialog) return; try { await fetch(`/api/playlists/${deleteDialog.id}`, { method: 'DELETE' }); setDeleteDialog(null); fetchPlaylists(); } catch { alert('خطا در حذف پلی‌لیست'); } };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#a7a7a7]" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی پلی‌لیست..." className="bg-[#282828] border-[#404040] text-white pr-10 placeholder:text-[#666]" /></div>
        <Button onClick={openCreate} className="bg-[#1db954] hover:bg-[#1ed760] text-black gap-2"><Plus className="size-4" />افزودن پلی‌لیست</Button>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="rounded-lg border border-[#282828] overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-[#181818] border-b border-[#282828]"><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium">کاور</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium">عنوان</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium hidden md:table-cell">توضیحات</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium hidden lg:table-cell">آهنگ</th><th className="text-right px-4 py-3 text-[#a7a7a7] font-medium">وضعیت</th><th className="text-center px-4 py-3 text-[#a7a7a7] font-medium">عملیات</th></tr></thead><tbody>
          {playlists.map((p) => (<tr key={p.id} className="border-b border-[#282828] hover:bg-white/5"><td className="px-4 py-3"><div className="size-10 rounded overflow-hidden bg-[#282828]"><img src={p.coverUrl} alt={p.title} className="size-full object-cover" /></div></td><td className="px-4 py-3 text-white font-medium truncate max-w-48">{p.title}</td><td className="px-4 py-3 text-[#a7a7a7] truncate max-w-64 hidden md:table-cell">{p.description || '—'}</td><td className="px-4 py-3 text-[#a7a7a7] hidden lg:table-cell">{p._count?.tracks ?? 0}</td><td className="px-4 py-3"><Badge variant={p.isPublic ? 'default' : 'secondary'} className={p.isPublic ? 'bg-[#1db954]/20 text-[#1db954]' : 'bg-[#282828] text-[#a7a7a7]'}>{p.isPublic ? 'عمومی' : 'خصوصی'}</Badge></td><td className="px-4 py-3"><div className="flex items-center justify-center gap-1"><Button variant="ghost" size="icon" className="text-[#a7a7a7] hover:text-white size-8" onClick={() => openEdit(p)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" className="text-[#a7a7a7] hover:text-red-400 size-8" onClick={() => setDeleteDialog(p)}><Trash2 className="size-4" /></Button></div></td></tr>))}
          {playlists.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[#a7a7a7]">پلی‌لیستی یافت نشد</td></tr>}
        </tbody></table></div></div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="bg-[#282828] border-[#404040] text-white max-w-md" dir="rtl"><DialogHeader><DialogTitle>{editingPlaylist ? 'ویرایش پلی‌لیست' : 'افزودن پلی‌لیست جدید'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label className="text-[#a7a7a7]">عنوان پلی‌لیست *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-[#181818] border-[#404040]" /></div>
          <div className="space-y-2"><Label className="text-[#a7a7a7]">توضیحات</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#181818] border-[#404040] min-h-20" /></div>
          <ImageUploadField label="کاور پلی‌لیست" value={form.coverUrl} onChange={(url) => setForm({ ...form, coverUrl: url })} />
          <div className="flex items-center justify-between"><Label className="text-[#a7a7a7]">عمومی</Label><Switch checked={form.isPublic} onCheckedChange={(v) => setForm({ ...form, isPublic: v })} /></div>
        </div>
        <DialogFooter className="gap-2"><Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-[#a7a7a7]">انصراف</Button><Button onClick={handleSave} disabled={saving || !form.title.trim()} className="bg-[#1db954] hover:bg-[#1ed760] text-black">{saving ? <Loader2 className="size-4 animate-spin" /> : editingPlaylist ? 'بروزرسانی' : 'ایجاد'}</Button></DialogFooter>
      </DialogContent></Dialog>
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}><AlertDialogContent className="bg-[#282828] border-[#404040] text-white" dir="rtl"><AlertDialogHeader><AlertDialogTitle>حذف پلی‌لیست</AlertDialogTitle><AlertDialogDescription className="text-[#a7a7a7]">آیا از حذف پلی‌لیست &laquo;{deleteDialog?.title}&raquo; مطمئن هستید؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="gap-2"><AlertDialogCancel className="bg-transparent border-[#404040] text-[#a7a7a7] hover:bg-white/5">انصراف</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

// ─── Loading Spinner ─────────────────────────────────────
function LoadingSpinner() {
  return (<div className="flex items-center justify-center py-12"><div className="flex flex-col items-center gap-4"><div className="size-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" /><p className="text-[#a7a7a7] text-sm">در حال بارگذاری...</p></div></div>);
}
