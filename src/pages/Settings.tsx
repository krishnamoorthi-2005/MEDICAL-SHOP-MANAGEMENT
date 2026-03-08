import { useEffect, useMemo, useState } from 'react';
import { Save, Database, Download, RefreshCw, CheckCircle, UserPlus, Trash2, Mail, Lock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import {
  createBackup,
  createUser,
  deleteBackup as apiDeleteBackup,
  deleteUser as apiDeleteUser,
  getBackupDetails,
  getUsers,
  listBackups,
  updateUserStatus,
  type AppUser,
  type BackupRecord,
} from '@/lib/api';
import { downloadPredictionDataset, uploadPredictionDataset } from '@/lib/api';

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

export default function Settings() {
  const { toast } = useToast();

  // Shop Information
  const [shopInfo, setShopInfo] = useState({
    shopName: 'Special Access Pharma',
    gstNumber: '29ABCDE1234F1Z5',
    phone: '+91 9876543210',
    address: 'Ammal Yeri Road, Dadagapatty, Salem - 636006'
  });

  // Tax Settings
  const [taxSettings, setTaxSettings] = useState({
    gst5: '5',
    gst12: '12',
    gst18: '18',
    gst28: '28',
    defaultTax: '12'
  });

  // User Management
  const [users, setUsers] = useState<AppUser[]>([]);

  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff'
  });

  // Backup status
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showBackupDetails, setShowBackupDetails] = useState(false);
  const [backupDetailsLoading, setBackupDetailsLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);

  const [confirmDeleteBackupId, setConfirmDeleteBackupId] = useState<string | null>(null);

  // AI dataset download
  const [downloadingDataset, setDownloadingDataset] = useState(false);
  const [uploadingDataset, setUploadingDataset] = useState(false);
  const [datasetFile, setDatasetFile] = useState<File | null>(null);

  const lastBackupLabel = useMemo(() => {
    const latest = backups[0];
    if (!latest?.createdAt) return 'No backups yet';
    return new Date(latest.createdAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [backups]);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, b] = await Promise.all([getUsers(), listBackups(20)]);
        setUsers(u || []);
        setBackups(b || []);
      } catch (error: any) {
        console.error('Settings load error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load settings data',
          variant: 'destructive',
        });
      }
    };
    load();
  }, [toast]);

  const handleSaveShopInfo = () => {
    toast({
      title: 'Settings Saved',
      description: 'Shop information has been updated successfully'
    });
  };

  const handleSaveTaxSettings = () => {
    toast({
      title: 'Tax Settings Saved',
      description: 'Tax rates have been updated'
    });
  };

  const handleBackupNow = async () => {
    try {
      setIsBackingUp(true);
      await createBackup({ createdBy: 'Admin', note: 'Manual backup from Settings' });
      const updated = await listBackups(20);
      setBackups(updated || []);
      toast({
        title: 'Backup Complete',
        description: 'Your data has been backed up successfully',
      });
    } catch (error: any) {
      console.error('Backup error:', error);
      toast({
        title: 'Backup Failed',
        description: error.message || 'Failed to create backup',
        variant: 'destructive',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });
      const updated = await getUsers();
      setUsers(updated || []);
      setShowAddUserDialog(false);
      setNewUser({ name: '', email: '', password: '', role: 'Staff' });

      toast({
        title: 'User Added',
        description: `${newUser.name} has been added successfully`,
      });
    } catch (error: any) {
      console.error('Add user error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target?.role === 'Admin') {
      toast({
        title: 'Cannot Delete',
        description: 'Cannot delete the main admin user',
        variant: 'destructive'
      });
      return;
    }

    try {
      await apiDeleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
      toast({
        title: 'User Deleted',
        description: 'User has been removed successfully',
      });
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    if (user.role === 'Admin') {
      toast({
        title: 'Cannot Update',
        description: 'Cannot change status of main admin user',
        variant: 'destructive',
      });
      return;
    }

    const nextStatus: 'active' | 'inactive' = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateUserStatus(userId, nextStatus);
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u)));
      toast({
        title: 'Status Updated',
        description: 'User status has been changed',
      });
    } catch (error: any) {
      console.error('Toggle user status error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const handleViewBackup = async (backupId: string) => {
    try {
      setShowBackupDetails(true);
      setBackupDetailsLoading(true);
      const result = await getBackupDetails(backupId);
      setSelectedBackup(result.data);
    } catch (error: any) {
      console.error('Backup details error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load backup',
        variant: 'destructive',
      });
      setShowBackupDetails(false);
    } finally {
      setBackupDetailsLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await apiDeleteBackup(backupId);
      const updated = await listBackups(20);
      setBackups(updated || []);
      toast({
        title: 'Backup Deleted',
        description: 'Backup snapshot removed successfully',
      });
    } catch (error: any) {
      console.error('Delete backup error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete backup',
        variant: 'destructive',
      });
    } finally {
      setConfirmDeleteBackupId(null);
    }
  };

  const handleExportData = () => {
    toast({
      title: 'Export Started',
      description: 'Your data export will be ready shortly'
    });
  };

  const handleDatasetFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setDatasetFile(file);
  };

  const handleDownloadDataset = async () => {
    try {
      setDownloadingDataset(true);
      const blob = await downloadPredictionDataset();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pharmacy_sales_dataset_last12months.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: 'Dataset Downloaded',
        description: 'Last 12 months sales dataset exported for AI training',
      });
    } catch (error: any) {
      console.error('Dataset download error:', error);
      toast({
        title: 'Download Failed',
        description: error?.message || 'Could not download training dataset',
        variant: 'destructive',
      });
    } finally {
      setDownloadingDataset(false);
    }
  };

  const handleUploadDataset = async () => {
    if (!datasetFile) {
      toast({
        title: 'No file selected',
        description: 'Please choose a CSV file before uploading.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingDataset(true);
      const result = await uploadPredictionDataset(datasetFile);
      toast({
        title: 'Dataset Uploaded',
        description:
          result.message || 'Dataset uploaded and AI model training started successfully.',
      });
    } catch (error: any) {
      console.error('Dataset upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error?.message || 'Could not upload training dataset',
        variant: 'destructive',
      });
    } finally {
      setUploadingDataset(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground/70 font-medium">Manage your pharmacy settings and preferences</p>
      </div>

      {/* Shop Information */}
      <Card>
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
          <CardDescription>Basic details about your pharmacy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={shopInfo.shopName}
                onChange={(e) => setShopInfo(s => ({ ...s, shopName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={shopInfo.gstNumber}
                onChange={(e) => setShopInfo(s => ({ ...s, gstNumber: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={shopInfo.phone}
                onChange={(e) => setShopInfo(s => ({ ...s, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={shopInfo.address}
              onChange={(e) => setShopInfo(s => ({ ...s, address: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveShopInfo}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Settings</CardTitle>
          <CardDescription>Configure GST rates for your products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="gst5">GST 5% Rate</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gst5"
                  type="number"
                  value={taxSettings.gst5}
                  onChange={(e) => setTaxSettings(s => ({ ...s, gst5: e.target.value }))}
                  className="w-20"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gst12">GST 12% Rate</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gst12"
                  type="number"
                  value={taxSettings.gst12}
                  onChange={(e) => setTaxSettings(s => ({ ...s, gst12: e.target.value }))}
                  className="w-20"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gst18">GST 18% Rate</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gst18"
                  type="number"
                  value={taxSettings.gst18}
                  onChange={(e) => setTaxSettings(s => ({ ...s, gst18: e.target.value }))}
                  className="w-20"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gst28">GST 28% Rate</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gst28"
                  type="number"
                  value={taxSettings.gst28}
                  onChange={(e) => setTaxSettings(s => ({ ...s, gst28: e.target.value }))}
                  className="w-20"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid gap-2 max-w-xs">
            <Label>Default Tax Rate</Label>
            <Select
              value={taxSettings.defaultTax}
              onValueChange={(v) => setTaxSettings(s => ({ ...s, defaultTax: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No Tax (0%)</SelectItem>
                <SelectItem value="5">GST 5%</SelectItem>
                <SelectItem value="12">GST 12%</SelectItem>
                <SelectItem value="18">GST 18%</SelectItem>
                <SelectItem value="28">GST 28%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveTaxSettings}>
              <Save className="mr-2 h-4 w-4" />
              Save Tax Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI & Prediction Dataset */}
      <Card>
        <CardHeader>
          <CardTitle>AI Prediction Dataset</CardTitle>
          <CardDescription>
            Upload or download the 1-year sales dataset used to train the demand prediction
            model that powers the AI Audit Assistant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[2fr,1fr] items-end">
            <div className="space-y-2">
              <Label htmlFor="datasetFile">Upload custom dataset (CSV)</Label>
              <Input
                id="datasetFile"
                type="file"
                accept=".csv,text/csv"
                onChange={handleDatasetFileChange}
              />
              <p className="text-xs text-muted-foreground">
                Expected format: aggregated 12-month sales per medicine as produced by
                extract_from_mongo.py. Uploading will retrain the AI model server-side.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <Button
                onClick={handleUploadDataset}
                disabled={uploadingDataset}
              >
                {uploadingDataset ? 'Uploading & Training…' : 'Upload & Train Model'}
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadDataset}
                disabled={downloadingDataset}
              >
                <Download className="mr-2 h-4 w-4" />
                {downloadingDataset ? 'Preparing…' : 'Download Dataset'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Data */}
      <Card>
        <CardHeader>
          <CardTitle>Backup & Data</CardTitle>
          <CardDescription>Manage your data backups and exports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Database className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="font-medium">Last Backup</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  {lastBackupLabel}
                </div>
              </div>
            </div>
            <Button onClick={handleBackupNow} disabled={isBackingUp}>
              {isBackingUp ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Backing Up...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Backup Now
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="font-medium">Backups</div>
            <div className="text-sm text-muted-foreground">
              Click a backup to retrieve that snapshot only
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No backups found
                      </TableCell>
                    </TableRow>
                  ) : (
                    backups.slice(0, 10).map((b) => (
                      <TableRow key={b._id}>
                        <TableCell className="font-medium">
                          {new Date(b.createdAt).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>{b.createdBy || 'system'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {(b.counts?.medicines ?? 0)} medicines, {(b.counts?.batches ?? 0)} batches
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewBackup(b._id)}>
                              Retrieve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setConfirmDeleteBackupId(b._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Export Data</div>
              <div className="text-sm text-muted-foreground">
                Download all your data in CSV format
              </div>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system admin and staff access</CardDescription>
            </div>
            <Button onClick={() => setShowAddUserDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.filter(u => u.role.toLowerCase() !== 'user').map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === 'active' ? 'default' : 'secondary'}
                      className={user.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user.id)}
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.role === 'Admin'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for the system
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user-name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="user-name"
                  placeholder="John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="user-email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="user-password"
                  type="password"
                  placeholder="Enter password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-role">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser({ ...newUser, role: v })}
              >
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Backup Details Dialog */}
      <Dialog open={showBackupDetails} onOpenChange={setShowBackupDetails}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Backup Data</DialogTitle>
            <DialogDescription>
              {selectedBackup?.createdAt
                ? `Snapshot from ${new Date(selectedBackup.createdAt).toLocaleString('en-IN')}`
                : 'Backup snapshot'}
            </DialogDescription>
          </DialogHeader>

          {backupDetailsLoading ? (
            <div className="text-sm text-muted-foreground">Loading backup…</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(selectedBackup?.counts || {}).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-md border p-2">
                    <div className="text-muted-foreground">{k}</div>
                    <div className="font-medium">{String(v)}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Showing this backup snapshot only. (Data is stored in the backups collection.)
              </div>

              <div className="rounded-md border bg-muted/20 p-3">
                <div className="text-sm font-medium mb-2">Raw Data Preview</div>
                <pre className="text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
                  {JSON.stringify(selectedBackup?.data || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Backup Delete */}
      <AlertDialog open={!!confirmDeleteBackupId} onOpenChange={(open) => !open && setConfirmDeleteBackupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected backup snapshot from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteBackupId && handleDeleteBackup(confirmDeleteBackupId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
