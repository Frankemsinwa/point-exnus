"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';

interface Referral {
    wallet: string;
    joinDate: string;
}

interface ReferralsListProps {
    referrals: {
        count: number;
        referredUsers: Referral[];
    };
}

const POINTS_PER_REFERRAL = 100;

export default function ReferralsList({ referrals }: ReferralsListProps) {
    const { count = 0, referredUsers = [] } = referrals || {};
    const truncateWallet = (wallet: string) => `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-3"><Users className="h-8 w-8 text-accent"/> Your Referrals</h2>
            
             <Card className="bg-secondary/30 border-border/50">
                <CardHeader>
                    <CardTitle>How Referrals Work</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                        Share your unique referral code with friends. When they sign up using your code and activate their account, you'll receive <strong>{POINTS_PER_REFERRAL} bonus points</strong>, and they'll get a <strong>10 point</strong> head start!
                    </p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                 <Card className="bg-secondary/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Total Referrals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{count}</p>
                    </CardContent>
                </Card>
                 <Card className="bg-secondary/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Referral Bonus Earned</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{new Intl.NumberFormat().format(count * POINTS_PER_REFERRAL)}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-secondary/30 border-border/50">
                <CardHeader>
                    <CardTitle>Referred Users</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Wallet</TableHead>
                                <TableHead className="text-right">Join Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referredUsers && referredUsers.length > 0 ? (
                                referredUsers.map((ref) => (
                                    <TableRow key={ref.wallet}>
                                        <TableCell>{truncateWallet(ref.wallet)}</TableCell>
                                        <TableCell className="text-right">{formatDate(ref.joinDate)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                        You haven't referred anyone yet.
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
