"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Users, Star, Gift, Twitter, Send, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const POINTS_PER_REFERRAL = 1000;
const JOIN_BONUS_FOR_REFEREE = 500;
const INITIAL_POINTS = 1000;

const TASKS = {
    x: { name: "Follow on X", cta: "Complete Task", url: "https://x.com/exnusprotocol?t=WgNg7R13Pwu-w_syhOQSvQ&s=09" },
    telegram: { name: "Join Telegram", cta: "Complete Task", url: "https://t.me/Exnusprotocol" },
    discord: { name: "Join Discord", cta: "Complete Task", url: "https://discord.gg/27W8A8Ss" },
} as const;

type TaskName = keyof typeof TASKS;

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


// Helper function to animate numbers from 0 to a target value
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

export default function Dashboard() {
  const [basePoints, setBasePoints] = useState(0);
  const [referrals, setReferrals] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const { toast } = useToast();
  const { publicKey } = useWallet();

  const [tasksCompleted, setTasksCompleted] = useState({ x: false, telegram: false, discord: false });
  const [verifyingTask, setVerifyingTask] = useState<TaskName | null>(null);
  const [miningActivated, setMiningActivated] = useState(false);

  useEffect(() => {
    if (!publicKey) return;

    const userKey = `user-data-${publicKey.toBase58()}`;
    let userData = JSON.parse(localStorage.getItem(userKey) || "null");

    if (!userData) {
      // New user setup
      const newReferralCode = publicKey.toBase58().substring(0, 8).toUpperCase();
      userData = {
        points: INITIAL_POINTS,
        referrals: 0,
        referralCode: newReferralCode,
        tasksCompleted: { x: false, telegram: false, discord: false },
        miningActivated: false,
      };

      const pendingRefCode = sessionStorage.getItem("pending_referral_code");
      if (pendingRefCode) {
        // User was referred
        userData.points += JOIN_BONUS_FOR_REFEREE;
        
        toast({
          title: "Referral Applied!",
          description: `You've received ${JOIN_BONUS_FOR_REFEREE} bonus points!`,
        });

        // This simulates the backend updating the referrer.
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('user-data-')) {
            try {
              let referrerData = JSON.parse(localStorage.getItem(key) || "null");
              if (referrerData && referrerData.referralCode === pendingRefCode) {
                referrerData.referrals += 1;
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

    // Backwards compatibility for existing users
    if (userData.tasksCompleted === undefined) {
      userData.tasksCompleted = { x: false, telegram: false, discord: false };
    }
    if (userData.miningActivated === undefined) {
      userData.miningActivated = false;
    }
    localStorage.setItem(userKey, JSON.stringify(userData));

    setReferralCode(userData.referralCode);
    animateValue(setBasePoints, userData.points, 1000);
    animateValue(setReferrals, userData.referrals, 1200);
    setTasksCompleted(userData.tasksCompleted);
    setMiningActivated(userData.miningActivated);

  }, [publicKey, toast]);

  const handleVerifyTask = (taskName: TaskName) => {
    if (verifyingTask || !publicKey) return;

    window.open(TASKS[taskName].url, '_blank', 'noopener,noreferrer');
    setVerifyingTask(taskName);

    setTimeout(() => {
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

    }, 10000);
  };
  
  const handleActivateMining = () => {
      if (!publicKey) return;
      setMiningActivated(true);
      const userKey = `user-data-${publicKey.toBase58()}`;
      const userData = JSON.parse(localStorage.getItem(userKey) || "null");
      if (userData) {
        userData.miningActivated = true;
        localStorage.setItem(userKey, JSON.stringify(userData));
      }
      toast({
          title: "Mining Activated!",
          description: "Welcome! You can now earn points and see your stats.",
      });
  };

  const handleCopy = () => {
    const referralLink = `https://points.exnus.xyz/join?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied to clipboard!",
      description: "You can now share your referral link.",
    });
  };

  const bonusPoints = referrals * POINTS_PER_REFERRAL;
  const totalPoints = basePoints + bonusPoints;
  const allTasksDone = Object.values(tasksCompleted).every(Boolean);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8 w-full">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">
            Exnus Points
          </h1>
          <WalletMultiButton />
        </header>

        {!miningActivated ? (
            <div className="w-full text-center mt-8">
                {!allTasksDone ? (
                    <>
                        <h2 className="text-4xl font-bold mb-4">Almost there!</h2>
                        <p className="text-muted-foreground mb-12">Complete these tasks to activate your account and start mining points.</p>
                        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {(Object.keys(TASKS) as TaskName[]).map((taskName) => {
                                const task = TASKS[taskName];
                                const isCompleted = tasksCompleted[taskName];
                                const isVerifying = verifyingTask === taskName;
                                const isDisabled = isCompleted || !!verifyingTask;

                                return (
                                    <Card key={taskName} className="bg-secondary/30 border-border/50 text-center flex flex-col">
                                        <CardHeader>
                                            <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                                                {TASK_ICONS[taskName]}
                                            </div>
                                            <CardTitle className="text-2xl pt-4">{task.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow flex flex-col justify-end">
                                            <Button onClick={() => handleVerifyTask(taskName)} disabled={isDisabled}>
                                                {isVerifying ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                                                ) : isCompleted ? (
                                                    <><CheckCircle2 className="mr-2 h-5 w-5" /> Completed</>
                                                ) : (
                                                    task.cta
                                                )}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="mt-12 animate-in fade-in duration-500 flex flex-col items-center">
                         <h2 className="text-4xl font-bold mb-4">Tasks Completed!</h2>
                        <p className="text-muted-foreground mb-8">You're all set. Activate your account to begin.</p>
                        <Button size="lg" className="px-12 py-7 text-xl" onClick={handleActivateMining}>
                           Activate Mining
                        </Button>
                    </div>
                )}
            </div>
        ) : (
            <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-3 bg-secondary/30 border-accent/30 shadow-lg shadow-accent/5">
                <CardHeader>
                <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
                    <Gift className="text-accent" />
                    Your Total Points
                </CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-5xl font-bold text-primary">
                    {new Intl.NumberFormat().format(totalPoints)}{" "}
                    <span className="text-3xl text-accent">PTS</span>
                </p>
                </CardContent>
            </Card>

            <Card className="md:col-span-2 bg-secondary/30 border-border/50">
                <CardHeader>
                <CardTitle className="text-lg font-medium text-muted-foreground">
                    Your Referral Link
                </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="flex items-center space-x-2 bg-background/50 p-3 rounded-lg border border-dashed border-border">
                    <p className="text-lg font-mono text-accent flex-grow overflow-x-auto no-scrollbar">
                    {`https://points.exnus.xyz/join?ref=${referralCode}`}
                    </p>
                    <Button variant="ghost" size="icon" onClick={handleCopy}>
                    <Copy className="h-5 w-5 text-muted-foreground hover:text-accent" />
                    </Button>
                </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6 md:col-span-1 md:grid-cols-1">
                <Card className="bg-secondary/30 border-border/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users /> Total Referrals
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{referrals}</p>
                </CardContent>
                </Card>

                <Card className="bg-secondary/30 border-border/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Star /> Bonus Points
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">
                    {new Intl.NumberFormat().format(bonusPoints)}
                    </p>
                </CardContent>
                </Card>
            </div>
            </main>
        )}

      </div>
    </div>
  );
}
