"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trophy } from 'lucide-react';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/leaderboard');
                if (!response.ok) {
                    throw new Error('Failed to fetch leaderboard');
                }
                const data = await response.json();
                setLeaderboardData(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const truncateWallet = (wallet: string) => `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

    if (loading) {
        return (
            <div className="flex justify-center items-center w-full max-w-5xl mx-auto h-96">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
            </div>
        );
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
                             {leaderboardData.length === 0 && !loading && (
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
