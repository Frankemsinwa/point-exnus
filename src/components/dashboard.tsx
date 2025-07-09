
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardContent from './dashboard-content';
import ReferralsList from './referrals-list';
import Leaderboard from './leaderboard';

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931L18.901 1.153zm-1.61 19.931h2.434L7.182 2.54h-2.61l12.73 18.543z"/>
    </svg>
);

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.354-.41.724-.602 1.1-.326.645-.634 1.328-.926 2.043-2.056-.074-4.042-.074-6.02.043-.284-.715-.582-1.398-.91-2.043-.192-.376-.391-.746-.6-1.1a.074.074 0 00-.078-.037A19.911 19.911 0 003.678 4.37a.074.074 0 00-.036.075C3.733 5.443 4.01 7.21 4.434 9.352a.074.074 0 00.057.065c1.475.438 2.871.746 4.225.992a.074.074 0 00.08-.028c.326-.24.634-.496.926-.77a10.99 10.99 0 00-1.879-1.147.074.074 0 00-.098.057c-.042.15-.078.307-.12.457a.074.074 0 00.024.086C7.942 9.074 9.94 9.876 12 9.876s4.059-.802 5.875-1.44a.074.074 0 00.024-.086c-.042-.15-.086-.307-.12-.457a.074.074 0 00-.098-.057 10.99 10.99 0 00-1.879 1.147.074.074 0 00.08.028c1.346-.246 2.75-.554 4.225-.992a.074.074 0 00.057-.065c.424-2.143.702-3.91.793-4.983a.074.074 0 00-.036-.075zM8.02 12.31c-1.015 0-1.842-.9-1.842-2.002s.827-2.002 1.842-2.002 1.842.9 1.842 2.002-.826 2.002-1.842 2.002zm7.96 0c-1.015 0-1.842-.9-1.842-2.002s.827-2.002 1.842-2.002 1.842.9 1.842 2.002-.826 2.002-1.842 2.002z"/>
    </svg>
);

const MINING_DURATION = 24 * 60 * 60; // 24 hours in seconds
const MINING_REWARD = 1000;
const POINTS_PER_REFERRAL = 100;

type TaskName = 'x' | 'telegram' | 'discord';
type UserData = {
    points: number;
    referrals: { count: number; referredUsers: { wallet: string; joinDate: string }[] };
    referralCode: string;
    tasksCompleted: Record<TaskName, boolean>;
    miningActivated: boolean;
    miningSessionStart: number | null;
    referralCodeApplied: boolean;
};

const TASKS: Record<TaskName, { name: string; cta: string; }> = {
    x: { name: "Follow on X", cta: "Complete Task" },
    telegram: { name: "Join Telegram", cta: "Complete Task" },
    discord: { name: "Join Discord", cta: "Complete Task" },
};

const TASK_ICONS: Record<TaskName, React.ReactNode> = {
    x: <XIcon className="h-8 w-8" />,
    telegram: <Send className="h-8 w-8" />,
    discord: <DiscordIcon className="h-8 w-8" />,
};

const TASK_URLS: Record<TaskName, string> = {
    x: 'https://x.com/exnusprotocol?t=WgNg7R13Pwu-w_syhOQSvQ&s=09',
    telegram: 'https://t.me/Exnusprotocol',
    discord: 'https://discord.gg/27W8A8Ss',
};

export default function Dashboard() {
    const { publicKey } = useWallet();
    const { toast } = useToast();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [onboardingStep, setOnboardingStep] = useState<'tasks' | 'referral' | 'activate' | 'dashboard'>('tasks');

    const [verifyingTask, setVerifyingTask] = useState<TaskName | null>(null);
    const [isActivating, setIsActivating] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);

    const [referralCodeInput, setReferralCodeInput] = useState('');
    const [isApplyingReferral, setIsApplyingReferral] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    const fetchUserData = useCallback(async (wallet: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet }),
            });

            const data = await response.json();
            if (!response.ok) {
                const errorMessage = data.details || data.error || "An unknown error occurred while fetching user data.";
                console.error("Fetch user data error:", errorMessage);
                throw new Error(errorMessage);
            }
            
            setUserData(data);

        } catch (error: any) {
             toast({
                title: 'Error Loading Data',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);


    useEffect(() => {
        if (publicKey) {
            fetchUserData(publicKey.toBase58());
        }
    }, [publicKey, fetchUserData]);

    useEffect(() => {
        if (!userData) return;

        const allTasksDone = userData.tasksCompleted && Object.values(userData.tasksCompleted).every(Boolean);

        if (!allTasksDone) {
            setOnboardingStep('tasks');
        } else if (!userData.referralCodeApplied) {
            setOnboardingStep('referral');
        } else if (!userData.miningActivated) {
            setOnboardingStep('activate');
        } else {
            setOnboardingStep('dashboard');
        }
    }, [userData]);
    
    useEffect(() => {
        if (!userData?.miningActivated || !userData.miningSessionStart) {
            setTimeRemaining(0);
            return;
        }

        const intervalId = setInterval(() => {
            const sessionStart = userData.miningSessionStart!;
            const elapsedTime = (Date.now() - sessionStart) / 1000;
            const remaining = MINING_DURATION - elapsedTime;
            
            if (remaining <= 0) {
                setTimeRemaining(0);
                clearInterval(intervalId);
            } else {
                setTimeRemaining(remaining);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [userData?.miningSessionStart, userData?.miningActivated]);

    const handleVerifyTask = useCallback(async (taskName: TaskName) => {
        if (!publicKey || !userData) return;

        window.open(TASK_URLS[taskName], '_blank');

        setVerifyingTask(taskName);
        try {
            await new Promise(res => setTimeout(res, 15000));
            const updatedTasks = { ...(userData.tasksCompleted || {}), [taskName]: true };
            const response = await fetch(`/api/users/${publicKey.toBase58()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasksCompleted: updatedTasks }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to update task");
            setUserData(data);
            toast({ title: 'Task Verified!', description: `You've completed the ${TASKS[taskName].name} task.` });
        } catch (error: any) {
            console.error(error);
            toast({ title: 'Verification Failed', description: error.message, variant: 'destructive' });
        } finally {
            setVerifyingTask(null);
        }
    }, [publicKey, userData, toast]);

    const handleApplyReferral = async () => {
        if (!publicKey || !referralCodeInput) return;
        setIsApplyingReferral(true);
        try {
            const response = await fetch(`/api/users/${publicKey.toBase58()}/apply-referral`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referralCode: referralCodeInput }),
            });
            const data = await response.json();
            if (!response.ok) {
                 throw new Error(data.error || "Failed to apply referral code");
            }
            toast({ title: "Success!", description: "Referral code applied." });
            setUserData(data);
        } catch (error: any) {
             toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsApplyingReferral(false);
        }
    };
    
    const handleSkipReferral = async () => {
        if (!publicKey) return;
        try {
            const response = await fetch(`/api/users/${publicKey.toBase58()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referralCodeApplied: true }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error("Failed to skip referral step");
            setUserData(data);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Could not skip referral step.', variant: 'destructive' });
        }
    };

    const handleActivateMining = async () => {
        if (!publicKey) return;
        setIsActivating(true);
        try {
             const response = await fetch(`/api/users/${publicKey.toBase58()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ miningActivated: true, miningSessionStart: Date.now() }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error("Failed to activate mining");
            setUserData(data);
            toast({ title: "Mining Activated!", description: "You are now earning points." });
        } catch (error) {
            console.error(error);
            toast({ title: 'Activation Failed', variant: 'destructive' });
        } finally {
            setIsActivating(false);
        }
    };

    const handleClaimRewards = async () => {
        if (!publicKey || !userData) return;
        setIsClaiming(true);
        try {
            const newPoints = userData.points + MINING_REWARD;
            const response = await fetch(`/api/users/${publicKey.toBase58()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    points: newPoints,
                    miningSessionStart: Date.now()
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error("Failed to claim rewards");
            setUserData(data);
            toast({ title: "Rewards Claimed!", description: `${MINING_REWARD} points have been added to your balance.` });
        } catch (error) {
            console.error(error);
            toast({ title: 'Claim Failed', variant: 'destructive' });
        } finally {
            setIsClaiming(false);
        }
    };

    const minedPoints = useMemo(() => {
        if (!userData?.miningActivated || !userData.miningSessionStart || timeRemaining <= 0) {
            return MINING_REWARD;
        }
        const elapsedTime = MINING_DURATION - timeRemaining;
        return (elapsedTime / MINING_DURATION) * MINING_REWARD;
    }, [userData?.miningActivated, userData?.miningSessionStart, timeRemaining]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const handleCopy = () => {
        if (!userData?.referralCode) return;
        navigator.clipboard.writeText(userData.referralCode);
        toast({ title: 'Copied to clipboard!' });
    };

    if (loading || !userData) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
            </div>
        );
    }
    
    if (onboardingStep === 'referral') {
        return (
            <div className="w-full max-w-md mx-auto mt-8 text-center animate-in fade-in-50">
                <Card className="bg-secondary/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Do you have a referral code?</CardTitle>
                        <CardDescription>Enter a code to get bonus points!</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input 
                            placeholder="Enter referral code"
                            value={referralCodeInput}
                            onChange={(e) => setReferralCodeInput(e.target.value)}
                        />
                        <Button onClick={handleApplyReferral} disabled={isApplyingReferral || !referralCodeInput} className="w-full">
                            {isApplyingReferral ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Apply Code
                        </Button>
                        <Button variant="link" onClick={handleSkipReferral}>
                            I don't have a code
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <Tabs defaultValue="dashboard" className="w-full">
            <div className="flex justify-center mb-6">
                 <TabsList>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="referrals">Referrals</TabsTrigger>
                    <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="dashboard">
                 <DashboardContent
                    onboardingStep={onboardingStep}
                    tasksCompleted={userData.tasksCompleted || { x: false, telegram: false, discord: false }}
                    verifyingTask={verifyingTask}
                    TASK_ICONS={TASK_ICONS}
                    TASKS={TASKS}
                    handleVerifyTask={handleVerifyTask}
                    isActivating={isActivating}
                    handleActivateMining={handleActivateMining}
                    minedPoints={minedPoints}
                    MINING_REWARD={MINING_REWARD}
                    timeRemaining={timeRemaining}
                    formatTime={formatTime}
                    totalPoints={userData.points}
                    referralCode={userData.referralCode}
                    handleCopy={handleCopy}
                    referralCount={userData.referrals.count}
                    POINTS_PER_REFERRAL={POINTS_PER_REFERRAL}
                    isClaiming={isClaiming}
                    handleClaimRewards={handleClaimRewards}
                />
            </TabsContent>
            <TabsContent value="referrals">
                <ReferralsList referrals={userData.referrals} />
            </TabsContent>
            <TabsContent value="leaderboard">
                <Leaderboard POINTS_PER_REFERRAL={POINTS_PER_REFERRAL} />
            </TabsContent>
        </Tabs>
    );
}
