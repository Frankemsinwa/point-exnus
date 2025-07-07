"use client";

import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, Database, Users, GitCoin, Trophy, ShieldAlert } from 'lucide-react';

interface UserData {
    wallet: string;
    points: number;
    referralCount: number;
    airdropAllocation?: number;
}

const TOTAL_AIRDROP_TOKENS = 100_000_000;

export default function AdminDashboard() {
    const { publicKey } = useWallet();
    const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');
    const [users, setUsers] = useState<UserData[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            setAuthStatus('checking');
            if (!publicKey) {
                setAuthStatus('unauthorized');
                return;
            }
            try {
                const response = await fetch('/api/admin/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wallet: publicKey.toBase58() })
                });
                if (!response.ok) throw new Error('Auth check failed');
                const { authorized } = await response.json();
                setAuthStatus(authorized ? 'authorized' : 'unauthorized');
            } catch (error) {
                console.error(error);
                setAuthStatus('unauthorized');
            }
        };
        checkAuth();
    }, [publicKey]);

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

        const totalPoints = users.reduce((acc, user) => acc + user.points, 0);

        const processedUsers = users.map(user => ({
            ...user,
            airdropAllocation: totalPoints > 0 ? (user.points / totalPoints) * TOTAL_AIRDROP_TOKENS : 0,
        })).sort((a, b) => b.points - a.points);

        return { processedUsers, totalPoints, totalUsers: users.length };
    }, [users]);
    
    const handleExport = () => {
        const headers = ['Rank', 'Wallet', 'Points', 'Referrals', 'Airdrop_Allocation'];
        const csvContent = [
            headers.join(','),
            ...processedUsers.map((user, index) => [
                index + 1,
                user.wallet,
                user.points,
                user.referralCount,
                user.airdropAllocation?.toFixed(4) ?? 0,
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

    if (authStatus === 'checking') {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
                <p className="mt-4 text-muted-foreground">Verifying access...</p>
            </div>
        );
    }

    if (authStatus === 'unauthorized') {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground p-4 text-center">
                 <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground mt-2 max-w-md">You do not have permission to view this page. Please connect an authorized wallet to continue.</p>
                <div className="mt-8">
                    <WalletMultiButton />
                </div>
            </div>
        );
    }
    
    return (
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
                            <GitCoin className="h-4 w-4 text-muted-foreground" />
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processedUsers.map((user, index) => (
                                    <TableRow key={user.wallet}>
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell>{truncateWallet(user.wallet)}</TableCell>
                                        <TableCell className="text-right">{new Intl.NumberFormat().format(user.points)}</TableCell>
                                        <TableCell className="text-right">{user.referralCount}</TableCell>
                                        <TableCell className="text-right font-bold">{user.airdropAllocation?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                    </TableRow>
                                ))}
                                {processedUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">No user data found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
