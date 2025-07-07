"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Twitter, Send, Loader2, LayoutDashboard, Trophy, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardContent from "./dashboard-content";
import Leaderboard from "./leaderboard";
import ReferralsList from "./referrals-list";

const POINTS_PER_REFERRAL = 100;
const MINING_REWARD = 1000;
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

const TASKS = {
    x: { name: "Follow on X", cta: "Complete Task", url: "https://x.com/exnusprotocol?t=WgNg7R13Pwu-w_syhOQSvQ&s=09" },
    telegram: { name: "Join Telegram", cta: "Complete Task", url: "https://t.me/Exnusprotocol" },
    discord: { name: "Join Discord", cta: "Complete Task", url: "https://discord.gg/27W8A8Ss" },
} as const;

type TaskName = keyof typeof TASKS;
type Page = 'dashboard' | 'leaderboard' | 'referrals';
type UserData = {
    points: number;
    referrals: { count: number; referredUsers: any[] };
    referralCode: string;
    tasksCompleted: { x: boolean; telegram: boolean; discord: boolean };
    miningActivated: boolean;
    miningSessionStart: number | null;
    referralCodeApplied?: boolean;
} | null;

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.369-.42.738-.609 1.1-.299-.046-.599-.083-.908-.11a12.6 12.6 0 00-3.132 0c-.299.028-.588.064-.878.11-.19-.362-.399-.73-.609-1.1a.074.074 0 00-.079-.037A19.791 19.791 0 003.683 4.37a.074.074 0 00-.037.079C3.725 6.438 4.688 9.648 5.89 12.58a.074.074 0 00.046.064c1.83.936 3.75 1.431 5.66 1.431a12.918 12.918 0 005.66-1.431.074.074 0 00.046-.064c1.202-2.932 2.165-6.142 2.245-8.122a.074.074 0 00-.037-.08zM8.02 15.33c-1.183 0-2.15-1.076-2.15-2.4 0-1.325.967-2.401 2.15-2.401s2.15 1.076 2.15 2.4c0 1.324-.967 2.4-2.15 2.4zm7.984 0c-1.183 0-2.15-1.076-2.15-2.4 0-1.325.967-2.401 2.15-2.401s2.15 1.076 2.15 2.4c0 1.324-.967 2.4-2.15 2.4z"/>
    </svg>
);

const TASK_ICONS: Record<TaskName, React.ReactNode> = {
    x: <Twitter className="h-8 w-8 text-accent" />,
    telegram: <Send className="h-8 w-8 text-accent" />,
    discord: <DiscordIcon className="h-8 w-8 text-accent fill-current" />,
};

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { publicKey, signMessage } = useWallet();

  const [verifyingTask, setVerifyingTask] = useState<TaskName | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);

  // Mining state
  const [minedPoints, setMinedPoints] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const [activePage, setActivePage] = useState<Page>('dashboard');

  const updateUserData = useCallback(async (data: Partial<UserData>) => {
    if (!publicKey) return;
    try {
        const response = await fetch(`/api/users/${publicKey.toBase58()}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update user data');
        const updatedUser = await response.json();
        setUserData(updatedUser);
        return updatedUser;
    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Could not update your data. Please refresh.', variant: 'destructive' });
    }
  }, [publicKey, toast]);

  const handleActivateMining = useCallback(async () => {
    if (!publicKey || !signMessage || userData?.miningActivated) return;

    setIsActivating(true);
    toast({ title: "Action Required", description: "Please sign the message in your wallet to activate mining." });

    try {
        const message = new TextEncoder().encode("Activate Exnus Points mining by signing this message.");
        await signMessage(message);
        
        await updateUserData({
            miningActivated: true,
            miningSessionStart: Date.now(),
        });

        toast({ title: "Mining Activated!", description: "You have started mining points for the next 24 hours." });
    } catch (error) {
        console.error("Signature failed", error);
        toast({ title: "Signature Failed", description: "The signature was declined. Please try again.", variant: "destructive" });
    } finally {
        setIsActivating(false);
    }
  }, [publicKey, signMessage, userData, updateUserData, toast]);

  useEffect(() => {
    if (!publicKey) {
      setLoading(false);
      setUserData(null);
      return;
    }

    const fetchOrCreateUser = async () => {
      setLoading(true);
      const wallet = publicKey.toBase58();
      try {
        const response = await fetch(`/api/users/${wallet}`);
        if (response.ok) {
          const user = await response.json();
          setUserData(user);
        } else if (response.status === 404) {
          const createResponse = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet }),
          });
          if (!createResponse.ok) throw new Error('Failed to create user');
          const newUser = await createResponse.json();
          setUserData(newUser);
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Could not load your data. Please refresh.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateUser();
  }, [publicKey, toast]);

  useEffect(() => {
    if (!userData?.miningActivated || !userData.miningSessionStart) return;

    const interval = setInterval(async () => {
        const now = Date.now();
        const elapsedTimeMs = now - userData.miningSessionStart!;

        if (elapsedTimeMs >= SESSION_DURATION_MS) {
            const newPoints = (userData.points || 0) + MINING_REWARD;
            const updatedUser = await updateUserData({
                points: newPoints,
                miningSessionStart: now,
            });
            if (updatedUser) {
                setMinedPoints(0);
                setTimeRemaining(SESSION_DURATION_MS / 1000);
                toast({
                    title: "Points Claimed!",
                    description: `${MINING_REWARD} points have been added. A new session has started.`,
                });
            }
        } else {
            const points = (elapsedTimeMs / SESSION_DURATION_MS) * MINING_REWARD;
            const remainingMs = SESSION_DURATION_MS - elapsedTimeMs;
            setMinedPoints(points);
            setTimeRemaining(remainingMs / 1000);
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [userData, updateUserData, toast]);

  const handleVerifyTask = (taskName: TaskName) => {
    if (verifyingTask || !publicKey || !userData) return;

    window.open(TASKS[taskName].url, '_blank', 'noopener,noreferrer');
    setVerifyingTask(taskName);

    setTimeout(async () => {
        const newTasksCompleted = { ...userData.tasksCompleted, [taskName]: true };
        
        await updateUserData({ tasksCompleted: newTasksCompleted });

        setVerifyingTask(null);
        toast({
            title: `Task Verified!`,
            description: `You've completed the ${TASKS[taskName].name} task.`,
        });
    }, 10000);
  };
  
  const handleApplyReferral = useCallback(async () => {
      if (!publicKey || !referralCodeInput) return;
      setIsApplyingReferral(true);
      try {
          const response = await fetch(`/api/users/${publicKey.toBase58()}/apply-referral`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ referralCode: referralCodeInput }),
          });
          const result = await response.json();
          if (!response.ok) {
              throw new Error(result.error || 'Failed to apply referral code');
          }
          setUserData(result);
          toast({ title: "Referral Applied!", description: "You've received bonus points!" });
      } catch (error: any) {
          console.error(error);
          toast({ title: 'Error', description: error.message || 'Could not apply referral code.', variant: 'destructive' });
      } finally {
          setIsApplyingReferral(false);
      }
  }, [publicKey, referralCodeInput, toast]);

  const handleCopy = () => {
    if (!userData?.referralCode) return;
    navigator.clipboard.writeText(userData.referralCode);
    toast({
      title: "Copied to clipboard!",
      description: "You can now share your referral code.",
    });
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center min-h-screen">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
          </div>
      )
  }

  const renderContent = () => {
    if (!userData) {
      return (
        <div className="text-center">
            <h2 className="text-2xl font-bold">Please connect your wallet to continue.</h2>
        </div>
      );
    }

    if (userData.miningActivated) {
        switch(activePage) {
            case 'dashboard':
                return <DashboardContent
                            onboardingStep="dashboard"
                            tasksCompleted={userData.tasksCompleted}
                            verifyingTask={verifyingTask}
                            TASK_ICONS={TASK_ICONS}
                            TASKS={TASKS}
                            handleVerifyTask={handleVerifyTask}
                            minedPoints={minedPoints}
                            MINING_REWARD={MINING_REWARD}
                            timeRemaining={timeRemaining}
                            formatTime={formatTime}
                            totalPoints={userData.points}
                            referralCode={userData.referralCode}
                            handleCopy={handleCopy}
                            referralCount={userData.referrals?.count || 0}
                            POINTS_PER_REFERRAL={POINTS_PER_REFERRAL}
                            isActivating={isActivating}
                            handleActivateMining={handleActivateMining}
                        />;
            case 'leaderboard':
                return <Leaderboard POINTS_PER_REFERRAL={POINTS_PER_REFERRAL} />;
            case 'referrals':
                return <ReferralsList referrals={userData.referrals} />;
            default:
                return null;
        }
    }
    
    const allTasksCompleted = Object.values(userData.tasksCompleted).every(Boolean);

    if (!allTasksCompleted) {
        return <DashboardContent
                    onboardingStep="tasks"
                    tasksCompleted={userData.tasksCompleted}
                    verifyingTask={verifyingTask}
                    TASK_ICONS={TASK_ICONS}
                    TASKS={TASKS}
                    handleVerifyTask={handleVerifyTask}
                />;
    }
    
    if (!userData.referralCodeApplied) {
        return (
            <div className="w-full max-w-md mx-auto text-center mt-8 animate-in fade-in-50">
                <Card className="bg-secondary/30 border-border/50">
                    <CardHeader>
                        <CardTitle className="text-2xl">Enter Referral Code</CardTitle>
                        <CardDescription>You must enter a valid referral code to proceed.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="ENTER 8-DIGIT CODE"
                            value={referralCodeInput}
                            onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                            maxLength={8}
                            className="text-center text-lg tracking-widest font-mono"
                        />
                        <Button onClick={handleApplyReferral} disabled={isApplyingReferral || !referralCodeInput} className="w-full">
                            {isApplyingReferral ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Applying...</> : 'Apply Code'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return <DashboardContent
                onboardingStep="activate"
                isActivating={isActivating}
                handleActivateMining={handleActivateMining}
                tasksCompleted={userData.tasksCompleted}
                verifyingTask={verifyingTask}
                TASK_ICONS={TASK_ICONS}
                TASKS={TASKS}
                handleVerifyTask={handleVerifyTask}
            />;
  };

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600 px-2">
                    Exnus Points
                </h1>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActivePage('dashboard')} isActive={activePage === 'dashboard'} tooltip="Dashboard" disabled={!userData?.miningActivated}>
                            <LayoutDashboard />
                            <span>Dashboard</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActivePage('leaderboard')} isActive={activePage === 'leaderboard'} tooltip="Leaderboard" disabled={!userData?.miningActivated}>
                            <Trophy />
                            <span>Leaderboard</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActivePage('referrals')} isActive={activePage === 'referrals'} tooltip="Referrals" disabled={!userData?.miningActivated}>
                            <UsersIcon />
                            <span>Referrals</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
                <header className="flex justify-between items-center mb-8 w-full max-w-5xl mx-auto">
                    <SidebarTrigger className="md:hidden"/>
                    <div className="hidden md:block w-7"></div>
                    <WalletMultiButton />
                </header>
                {renderContent()}
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
