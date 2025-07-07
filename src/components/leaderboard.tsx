"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react';

interface UserData {
    wallet: string;
    points: number;
    referralCount: number;
}

interface LeaderboardProps {
    POINTS_PER_REFERRAL: number;
}

export default function Leaderboard({ POINTS_PER_REFERRAL }: LeaderboardProps) {
    const [leaderboardData, setLeaderboardData] = useState<UserData[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const users: UserData[] = [];
        if (typeof window !== 'undefined' && window.localStorage) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('user-data-')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key)!);
                        const wallet = key.replace('user-data-', '');
                        
                        // Handle old and new referral data structure
                        const referralCount = (data.referrals && typeof data.referrals === 'object') 
                            ? (data.referrals.count || 0) 
                            : (typeof data.referrals === 'number' ? data.referrals : 0);

                        users.push({
                            wallet,
                            points: data.points || 0,
                            referralCount: referralCount,
                        });
                    } catch (e) {
                        console.error('Failed to parse user data for leaderboard', e);
                    }
                }
            }
        }
        users.sort((a, b) => b.points - a.points);
        setLeaderboardData(users);
    }, []);

    const truncateWallet = (wallet: string) => `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

    if (!mounted) {
        return null; // Or a loading skeleton
    }

    return (
        <div className="w-full max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><Trophy className="h-8 w-8 text-accent"/> Leaderboard</h2>
            <Card className="bg-secondary/30 border-border/50">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Rank</TableHead>
                                <TableHead>Wallet</TableHead>
                                <TableHead className="text-right">Referrals</TableHead>
                                <TableHead className="text-right">Total Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaderboardData.map((user, index) => (
                                <TableRow key={user.wallet}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{truncateWallet(user.wallet)}</TableCell>
                                    <TableCell className="text-right">{user.referralCount}</TableCell>
                                    <TableCell className="text-right font-bold">{new Intl.NumberFormat().format(user.points)}</TableCell>
                                </TableRow>
                            ))}
                             {leaderboardData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        No data available for the leaderboard yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}