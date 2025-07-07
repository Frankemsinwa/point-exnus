"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Users as UsersIcon, Star, Gift, Twitter, Send, CheckCircle2, Loader2, LayoutDashboard, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardContent from "./dashboard-content";
import Leaderboard from "./leaderboard";
import ReferralsList from "./referrals-list";

const POINTS_PER_REFERRAL = 1000;
const JOIN_BONUS_FOR_REFEREE = 500;
const INITIAL_POINTS = 1000;
const MINING_REWARD = 1000;
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

const TASKS = {
    x: { name: "Follow on X", cta: "Complete Task", url: "https://x.com/exnusprotocol?t=WgNg7R13Pwu-w_syhOQSvQ&s=09" },
    telegram: { name: "Join Telegram", cta: "Complete Task", url: "https://t.me/Exnusprotocol" },
    discord: { name: "Join Discord", cta: "Complete Task", url: "https://discord.gg/27W8A8Ss" },
} as const;

type TaskName = keyof typeof TASKS;
type Page = 'dashboard' | 'leaderboard' | 'referrals';

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

const animateValue = (
  setter: React.Dispatch<React.SetStateAction<number>>,
  endValue: number,
  duration: number
) => {
  if (endValue === 0) {
    setter(0);
    return;
  }
  let startTimestamp: number | null = null;
  const step = (timestamp: number) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    setter(Math.floor(progress * endValue));
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
};

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

export default function Dashboard() {
  const [basePoints, setBasePoints] = useState(0);
  const [referrals, setReferrals] = useState({ count: 0, referredUsers: [] });
  const [animatedReferralCount, setAnimatedReferralCount] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const { toast } = useToast();
  const { publicKey, signMessage } = useWallet();

  const [tasksCompleted, setTasksCompleted] = useState({ x: false, telegram: false, discord: false });
  const [verifyingTask, setVerifyingTask] = useState<TaskName | null>(null);
  const [miningActivated, setMiningActivated] = useState(false);

  // Mining state
  const [isMining, setIsMining] = useState(false);
  const [minedPoints, setMinedPoints] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const isClaimingRef = useRef(false);
  
  const [activePage, setActivePage] = useState<Page>('dashboard');


  const handleActivateMining = async () => {
    if (!publicKey || !signMessage || miningActivated) return;

    toast({
        title: "Action Required",
        description: "Please sign the message in your wallet to activate mining.",
    });

    try {
        const message = new TextEncoder().encode("Activate Exnus Points mining by signing this message.");
        await signMessage(message);
        
        const userKey = `user-data-${publicKey.toBase58()}`;
        const userData = JSON.parse(localStorage.getItem(userKey) || "null");
        
        if (userData) {
            userData.miningActivated = true;
            userData.miningSessionStart = Date.now();
            localStorage.setItem(userKey, JSON.stringify(userData));
            setMiningActivated(true);
            setIsMining(true);
        }

        toast({
            title: "Mining Activated!",
            description: "You have started mining points for the next 24 hours.",
        });

    } catch (error) {
        console.error("Signature failed", error);
        toast({
            title: "Signature Failed",
            description: "The signature was declined. Please try again to activate mining.",
            variant: "destructive",
        });
    }
  };

  useEffect(() => {
    if (!publicKey) return;

    const userKey = `user-data-${publicKey.toBase58()}`;
    let userData = JSON.parse(localStorage.getItem(userKey) || "null");

    if (!userData) {
      const newReferralCode = publicKey.toBase58().substring(0, 8).toUpperCase();
      userData = {
        points: INITIAL_POINTS,
        referrals: { count: 0, referredUsers: [] },
        referralCode: newReferralCode,
        tasksCompleted: { x: false, telegram: false, discord: false },
        miningActivated: false,
        miningSessionStart: null,
      };

      const pendingRefCode = sessionStorage.getItem("pending_referral_code");
      if (pendingRefCode) {
        userData.points += JOIN_BONUS_FOR_REFEREE;
        toast({
          title: "Referral Applied!",
          description: `You've received ${JOIN_BONUS_FOR_REFEREE} bonus points!`,
        });
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('user-data-')) {
            try {
              let referrerData = JSON.parse(localStorage.getItem(key) || "null");
              if (referrerData && referrerData.referralCode === pendingRefCode) {
                // Ensure new referral structure
                if (!referrerData.referrals || typeof referrerData.referrals !== 'object') {
                    referrerData.referrals = { count: 0, referredUsers: [] };
                }
                referrerData.referrals.count = (referrerData.referrals.count || 0) + 1;
                referrerData.referrals.referredUsers.push({
                    wallet: publicKey.toBase58(),
                    joinDate: new Date().toISOString(),
                });
                referrerData.points += POINTS_PER_REFERRAL;
                localStorage.setItem(key, JSON.stringify(referrerData));
                break;
              }
            } catch (e) {
              console.error("Failed to parse or update referrer data", e);
            }
          }
        }
        sessionStorage.removeItem("pending_referral_code");
      }
      localStorage.setItem(userKey, JSON.stringify(userData));
    }

    // Migration for old data structure
    if (typeof userData.referrals === 'number') {
        userData.referrals = { count: userData.referrals, referredUsers: [] };
    }
    if (userData.tasksCompleted === undefined) userData.tasksCompleted = { x: false, telegram: false, discord: false };
    if (userData.miningActivated === undefined) userData.miningActivated = false;
    if (userData.miningSessionStart === undefined) userData.miningSessionStart = null;
    localStorage.setItem(userKey, JSON.stringify(userData));

    setReferralCode(userData.referralCode);
    animateValue(setBasePoints, userData.points, 1000);
    setReferrals(userData.referrals);
    animateValue(setAnimatedReferralCount, userData.referrals.count, 1200);
    setTasksCompleted(userData.tasksCompleted);
    setMiningActivated(userData.miningActivated);
    if(userData.miningActivated && userData.miningSessionStart) {
        setIsMining(true);
    }
  }, [publicKey, toast]);

  useEffect(() => {
    if (!isMining || !publicKey) return;

    const userKey = `user-data-${publicKey.toBase58()}`;

    const interval = setInterval(() => {
        const userData = JSON.parse(localStorage.getItem(userKey) || "null");
        if (!userData || !userData.miningSessionStart) {
            setIsMining(false);
            return;
        }

        const sessionStart = userData.miningSessionStart;
        const now = Date.now();
        const elapsedTimeMs = now - sessionStart;

        if (elapsedTimeMs >= SESSION_DURATION_MS) {
            if (isClaimingRef.current) {
                return;
            }
            isClaimingRef.current = true;
            
            userData.points += MINING_REWARD;
            userData.miningSessionStart = now; 
            localStorage.setItem(userKey, JSON.stringify(userData));
            
            setBasePoints(prev => prev + MINING_REWARD);
            setMinedPoints(0);
            setTimeRemaining(SESSION_DURATION_MS / 1000);
            
            toast({
                title: "Points Claimed!",
                description: `${MINING_REWARD} points have been added to your balance. A new session has started.`,
            });
            
            isClaimingRef.current = false;
        } else {
            const points = (elapsedTimeMs / SESSION_DURATION_MS) * MINING_REWARD;
            const remainingMs = SESSION_DURATION_MS - elapsedTimeMs;
            setMinedPoints(points);
            setTimeRemaining(remainingMs / 1000);
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMining, publicKey, toast]);

  const handleVerifyTask = (taskName: TaskName) => {
    if (verifyingTask || !publicKey) return;

    window.open(TASKS[taskName].url, '_blank', 'noopener,noreferrer');
    setVerifyingTask(taskName);

    setTimeout(async () => {
        const newTasksCompleted = { ...tasksCompleted, [taskName]: true };
        setTasksCompleted(newTasksCompleted);

        const userKey = `user-data-${publicKey.toBase58()}`;
        const userData = JSON.parse(localStorage.getItem(userKey) || "null");
        if (userData) {
            userData.tasksCompleted = newTasksCompleted;
            localStorage.setItem(userKey, JSON.stringify(userData));
        }
        
        setVerifyingTask(null);
        toast({
            title: `Task Verified!`,
            description: `You've completed the ${TASKS[taskName].name} task.`,
        });

        const allTasksDone = Object.values(newTasksCompleted).every(Boolean);
        if (allTasksDone) {
            setTimeout(async () => {
                await handleActivateMining();
            }, 2000);
        }
    }, 10000);
  };

  const handleCopy = () => {
    const referralLink = `https://points.exnus.xyz/join?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied to clipboard!",
      description: "You can now share your referral link.",
    });
  };

  const totalPoints = basePoints;

  const renderContent = () => {
    switch(activePage) {
        case 'dashboard':
            return (
                <DashboardContent
                    miningActivated={miningActivated}
                    tasksCompleted={tasksCompleted}
                    verifyingTask={verifyingTask}
                    TASK_ICONS={TASK_ICONS}
                    TASKS={TASKS}
                    handleVerifyTask={handleVerifyTask}
                    minedPoints={minedPoints}
                    MINING_REWARD={MINING_REWARD}
                    timeRemaining={timeRemaining}
                    formatTime={formatTime}
                    totalPoints={totalPoints}
                    referralCode={referralCode}
                    handleCopy={handleCopy}
                    referralCount={animatedReferralCount}
                    POINTS_PER_REFERRAL={POINTS_PER_REFERRAL}
                />
            );
        case 'leaderboard':
            return <Leaderboard POINTS_PER_REFERRAL={POINTS_PER_REFERRAL} />;
        case 'referrals':
            return <ReferralsList referrals={referrals} />;
        default:
            return null;
    }
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
                        <SidebarMenuButton onClick={() => setActivePage('dashboard')} isActive={activePage === 'dashboard'} tooltip="Dashboard">
                            <LayoutDashboard />
                            <span>Dashboard</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActivePage('leaderboard')} isActive={activePage === 'leaderboard'} tooltip="Leaderboard">
                            <Trophy />
                            <span>Leaderboard</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setActivePage('referrals')} isActive={activePage === 'referrals'} tooltip="Referrals">
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
