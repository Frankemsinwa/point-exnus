"use client";

import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, Database, Users, Coins, Trophy, ShieldAlert, LockKeyhole, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserData {
    wallet: string;
    points: number;
    referralCount: number;
    airdropAllocation?: number;
    ipAddress?: string | null;
    isMultiAccount?: boolean;
}

const TOTAL_AIRDROP_TOKENS = 100_000_000;

export default function AdminDashboard() {
    const { toast } = useToast();
    const { publicKey, connected, connecting } = useWallet();

    const [authStatus, setAuthStatus] = useState<'idle' | 'checking' | 'authorized' | 'unauthorized'>('idle');
    const [users, setUsers] = useState<UserData[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [newPoints, setNewPoints] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            if (!connected || !publicKey) {
                setAuthStatus('idle');
                return;
            }

            setAuthStatus('checking');
            try {
                const response = await fetch('/api/admin/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wallet: publicKey.toBase58() })
                });
                const { authorized } = await response.json();
                if (authorized) {
                    setAuthStatus('authorized');
                } else {
                    setAuthStatus('unauthorized');
                }
            } catch (error) {
                console.error(error);
                setAuthStatus('unauthorized');
                toast({ title: "Authentication Error", description: "Could not verify admin status.", variant: "destructive" });
            }
        };
        checkAuth();
    }, [connected, publicKey, toast]);

    useEffect(() => {
        if (authStatus !== 'authorized') return;

        const fetchUsers = async () => {
            try {
                setLoadingData(true);
                const response = await fetch('/api/admin/users');
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchUsers();
    }, [authStatus]);

    const { processedUsers, totalPoints, totalUsers } = useMemo(() => {
        if (users.length === 0) {
            return { processedUsers: [], totalPoints: 0, totalUsers: 0 };
        }

        const ipCounts: Map<string, number> = new Map();
        users.forEach(user => {
            if (user.ipAddress) {
                ipCounts.set(user.ipAddress, (ipCounts.get(user.ipAddress) || 0) + 1);
            }
        });

        const totalPoints = users.reduce((acc, user) => acc + user.points, 0);

        let preparedUsers = users.map(user => ({
            ...user,
            airdropAllocation: totalPoints > 0 ? (user.points / totalPoints) * TOTAL_AIRDROP_TOKENS : 0,
            isMultiAccount: user.ipAddress ? (ipCounts.get(user.ipAddress) || 0) > 1 : false,
        })).sort((a, b) => b.points - a.points);

        if (searchQuery) {
            preparedUsers = preparedUsers.filter(user => 
                user.wallet.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return { processedUsers: preparedUsers, totalPoints, totalUsers: users.length };
    }, [users, searchQuery]);
    
    const handleExport = () => {
        const headers = ['Rank', 'Wallet', 'Points', 'Referrals', 'Airdrop_Allocation', 'Potential_Multi_Account'];
        const csvContent = [
            headers.join(','),
            ...processedUsers.map((user, index) => [
                index + 1,
                user.wallet,
                user.points,
                user.referralCount,
                user.airdropAllocation?.toFixed(4) ?? 0,
                user.isMultiAccount ? 'TRUE' : 'FALSE'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'airdrop_snapshot.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const truncateWallet = (wallet: string) => `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

    const handlePointUpdate = async () => {
        if (!editingUser || !publicKey) return;

        const pointsValue = parseInt(newPoints, 10);
        if (isNaN(pointsValue) || pointsValue < 0) {
            toast({ title: "Invalid Input", description: "Please enter a valid non-negative number for points.", variant: "destructive" });
            return;
        }

        setIsUpdating(true);
        try {
            const response = await fetch(`/api/admin/users/${editingUser.wallet}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminWallet: publicKey.toBase58(), points: pointsValue })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to update points');
            }
            
            setUsers(prevUsers => 
                prevUsers.map(u => 
                    u.wallet === editingUser.wallet ? { ...u, points: pointsValue } : u
                )
            );

            toast({ title: "Success", description: `Points updated for ${truncateWallet(editingUser.wallet)}.` });
            setEditingUser(null);

        } catch (error: any) {
            console.error(error);
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const AuthScreen = () => (
        <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground p-4 text-center">
            {connecting || authStatus === 'checking' ? (
                <Loader2 className="h-16 w-16 animate-spin text-accent" />
            ) : authStatus === 'unauthorized' ? (
                <>
                    <AlertCircle className="h-16 w-16 text-destructive mb-4" />
                    <h1 className="text-3xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground mt-2 max-w-md">The connected wallet is not authorized for admin access.</p>
                    <div className="mt-8">
                        <WalletMultiButton />
                    </div>
                </>
            ) : (
                <>
                    <LockKeyhole className="h-16 w-16 text-accent mb-4" />
                    <h1 className="text-3xl font-bold">Admin Access</h1>
                    <p className="text-muted-foreground mt-2 max-w-md">Please connect the admin wallet to access the dashboard.</p>
                    <div className="mt-8">
                        <WalletMultiButton />
                    </div>
                </>
            )}
        </div>
    );


    if (authStatus !== 'authorized') {
        return <AuthScreen />;
    }
    
    return (
        <TooltipProvider>
            <div className="flex flex-col min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
                <header className="flex justify-between items-center mb-8 w-full max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Database className="h-8 w-8 text-accent" />
                        Admin Dashboard
                    </h1>
                    <div className="flex items-center gap-4">
                         <WalletMultiButton />
                        <Button onClick={handleExport} disabled={users.length === 0 || loadingData}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Snapshot
                        </Button>
                    </div>
                </header>

                <main className="w-full max-w-7xl mx-auto">
                    <div className="grid gap-6 md:grid-cols-3 mb-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalUsers}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                                <Trophy className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{new Intl.NumberFormat().format(totalPoints)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Airdrop Tokens</CardTitle>
                                <Coins className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{new Intl.NumberFormat().format(TOTAL_AIRDROP_TOKENS)}</div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>User Data & Airdrop Allocation</CardTitle>
                            <CardDescription>Live data of all users and their calculated token allocation.</CardDescription>
                            <div className="pt-4">
                                <Input 
                                    placeholder="Search by wallet address..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingData ? (
                                <div className="flex justify-center items-center h-64">
                                    <Loader2 className="h-12 w-12 animate-spin text-accent" />
                                </div>
                            ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Rank</TableHead>
                                        <TableHead>Wallet</TableHead>
                                        <TableHead className="text-right">Points</TableHead>
                                        <TableHead className="text-right">Referrals</TableHead>
                                        <TableHead className="text-right">Airdrop Allocation</TableHead>
                                        <TableHead>Flags</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {processedUsers.map((user, index) => (
                                        <TableRow key={user.wallet} className={user.isMultiAccount ? 'bg-destructive/10' : ''}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>{truncateWallet(user.wallet)}</TableCell>
                                            <TableCell className="text-right">{new Intl.NumberFormat().format(user.points)}</TableCell>
                                            <TableCell className="text-right">{user.referralCount}</TableCell>
                                            <TableCell className="text-right font-bold">{user.airdropAllocation?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell>
                                                {user.isMultiAccount && (
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <ShieldAlert className="h-5 w-5 text-destructive" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Potential multi-account detected (shared IP).</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    setEditingUser(user);
                                                    setNewPoints(user.points.toString());
                                                }}>
                                                    Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {processedUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-24">No user data found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            )}
                        </CardContent>
                    </Card>
                </main>
                <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Points for {editingUser?.wallet && truncateWallet(editingUser.wallet)}</DialogTitle>
                            <DialogDescription>
                                You can manually adjust the point balance for this user. This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="points" className="text-right">
                                Points
                                </Label>
                                <Input
                                id="points"
                                type="number"
                                value={newPoints}
                                onChange={(e) => setNewPoints(e.target.value)}
                                className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                            <Button onClick={handlePointUpdate} disabled={isUpdating}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
